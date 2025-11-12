/**
 * Scheduling Agent (Migrated to OpenAI Agents JS SDK)
 *
 * Main AI agent class that orchestrates scheduling using the OpenAI Agents SDK.
 *
 * Author: Ravindra Kanchikare (krhebber)
 * License: MIT
 */

import { Agent, run, tool } from '@openai/agents';
import { aisdk } from '@openai/agents-extensions';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import {
  AgentConfig,
  AgentResponse,
  ParsedRequest,
  ConversationContext,
  SchedulingPreferences,
  SchedulingHistory,
  AgentError,
} from '../types';

import { RequestParser } from '../nlu';
import { SlotRecommender, ConflictResolver, PreferenceEngine } from '../intelligence';
import { SchedulingAdapter } from '../integration';

/**
 * Scheduling Agent powered by OpenAI Agents SDK
 *
 * AI-powered scheduling assistant that understands natural language,
 * makes smart recommendations, and handles complex scheduling scenarios.
 *
 * Features:
 * - Natural language understanding (via OpenAI Agents SDK)
 * - Smart slot recommendations based on preferences
 * - Intelligent conflict resolution
 * - Multi-turn conversations
 * - Preference learning
 */
export class SchedulingAgent {
  private agent: Agent;
  private _requestParser: RequestParser;
  private slotRecommender: SlotRecommender;
  private _conflictResolver: ConflictResolver;
  private preferenceEngine: PreferenceEngine;
  private schedulingAdapter: SchedulingAdapter;

  // State management
  private activeConversations: Map<string, ConversationContext> = new Map();
  private userPreferences: Map<string, SchedulingPreferences> = new Map();
  private schedulingHistory: Map<string, SchedulingHistory[]> = new Map();

  constructor(private config: AgentConfig) {
    // Initialize components (keeping domain logic intact)
    this._requestParser = new RequestParser(undefined as any); // Will be updated to not require LLM provider
    this.slotRecommender = new SlotRecommender(undefined as any);
    this._conflictResolver = new ConflictResolver(undefined as any);
    this.preferenceEngine = new PreferenceEngine();
    this.schedulingAdapter = new SchedulingAdapter(
      undefined,
      config.scheduling.timezone
    );

    // Create tools for the agent
    const tools = this.createTools();

    // Initialize OpenAI Agents SDK Agent
    // If using AI SDK providers (Anthropic, Google), create the model
    const agentConfig: any = {
      name: 'SchedulingAgent',
      instructions: this.buildInstructions(),
      tools,
    };

    // Add model if using AI SDK providers
    if (['anthropic', 'claude', 'google'].includes(config.llm.provider)) {
      agentConfig.model = this.createModel();
    }

    this.agent = new Agent(agentConfig);
  }

  /**
   * Create AI SDK model based on provider configuration
   *
   * Note: API keys are set via environment variables or passed through provider config.
   * For AI SDK providers, set: OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY
   */
  private createModel() {
    const { provider, model, apiKey } = this.config.llm;

    // Set environment variable for the provider if apiKey is provided
    if (apiKey) {
      switch (provider) {
        case 'openai':
          process.env.OPENAI_API_KEY = apiKey;
          break;
        case 'anthropic':
        case 'claude':
          process.env.ANTHROPIC_API_KEY = apiKey;
          break;
        case 'google':
          process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
          break;
      }
    }

    switch (provider) {
      case 'openai':
        return aisdk(openai(model));

      case 'anthropic':
      case 'claude':
        return aisdk(anthropic(model));

      case 'google':
        return aisdk(google(model));

      case 'custom':
        // For custom providers, users should configure the model themselves
        throw new AgentError(
          'Custom provider requires manual model configuration',
          'UNSUPPORTED_PROVIDER'
        );

      default:
        // Default to OpenAI if provider is not recognized
        console.warn(`Unknown provider "${provider}", defaulting to OpenAI`);
        return aisdk(openai(model));
    }
  }

  /**
   * Build agent instructions from config and domain knowledge
   */
  private buildInstructions(): string {
    return `You are an intelligent scheduling assistant that helps users schedule, reschedule, and manage interviews and meetings.

Your capabilities:
1. **Natural Language Understanding**: Parse user requests to extract scheduling intent, people involved, dates/times, and other relevant details
2. **Smart Recommendations**: Recommend optimal time slots based on preferences, load balancing, and historical data
3. **Conflict Resolution**: Detect and resolve scheduling conflicts intelligently
4. **Multi-turn Conversations**: Handle follow-up questions and collect missing information naturally

Instructions:
- Always be professional, friendly, and helpful
- Ask clarifying questions when information is missing or ambiguous
- Consider user preferences and historical patterns when making recommendations
- Explain your reasoning when suggesting time slots
- Handle conflicts gracefully and propose alternatives
- Confirm actions before making changes to schedules

Timezone: ${this.config.scheduling.timezone}
Confidence Threshold: ${this.config.intelligence?.minConfidenceThreshold || 0.7}`;
  }

  /**
   * Create tools for the agent
   */
  private createTools() {
    // Tool 1: Parse scheduling request
    const parseRequestTool = tool({
      name: 'parse_scheduling_request',
      description: 'Parse a natural language scheduling request to extract intent and entities',
      parameters: z.object({
        message: z.string().describe('The user message to parse'),
        userId: z.string().describe('The user ID for context'),
      }),
      execute: async ({ message, userId }) => {
        try {
          const context = this.getOrCreateConversation(userId);

          // Use the domain-specific parser
          // For now, create a simple parsed response since we're removing LLM dependency
          const parsed: ParsedRequest = await this.parseMessageWithoutLLM(message, context);

          // Update conversation history
          this.updateConversationHistory(context, message, parsed);
          this.activeConversations.set(userId, context);

          return {
            success: true,
            intent: parsed.intent,
            entities: parsed.entities,
            confidence: parsed.confidence,
            clarifications: parsed.clarifications,
            ambiguities: parsed.ambiguities,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    });

    // Tool 2: Find and recommend slots
    const findSlotsTool = tool({
      name: 'find_available_slots',
      description: 'Find available time slots and provide smart recommendations',
      parameters: z.object({
        userId: z.string().describe('The user ID'),
        entities: z.any().describe('Extracted entities from the request'),
        topN: z.number().optional().default(5).describe('Number of recommendations to return'),
      }),
      execute: async ({ userId, entities, topN }) => {
        try {
          // Find available slots
          const slots = await this.schedulingAdapter.findSlots(entities);

          if (slots.length === 0) {
            return {
              success: false,
              message: 'No available slots found',
              slots: [],
            };
          }

          // Get user preferences
          const preferences = this.userPreferences.get(userId);
          const history = this.schedulingHistory.get(userId);

          // Apply smart recommendations
          this.slotRecommender.updateData(
            preferences ? [preferences] : undefined,
            history
          );

          const recommendations = await this.slotRecommender.recommend(
            slots.map((s) => ({
              id: s.id,
              startTime: s.startTime,
              endTime: s.endTime,
              interviewers: s.interviewers,
              loadInfo: s.loadInfo,
            })),
            topN
          );

          return {
            success: true,
            count: recommendations.length,
            recommendedSlots: recommendations,
            message: `Found ${recommendations.length} recommended time slots`,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    });

    // Tool 3: Book a slot
    const bookSlotTool = tool({
      name: 'book_time_slot',
      description: 'Book a specific time slot for a candidate',
      parameters: z.object({
        userId: z.string().describe('The user ID'),
        slotId: z.string().describe('The slot ID to book'),
        candidateName: z.string().describe('Candidate name'),
        candidateEmail: z.string().describe('Candidate email'),
      }),
      execute: async ({ userId: _userId, slotId, candidateName, candidateEmail }) => {
        try {
          const candidateInfo = {
            name: candidateName,
            email: candidateEmail,
          };

          // Verify slot is still available
          const isAvailable = await this.schedulingAdapter.verifySlot(slotId);

          if (!isAvailable) {
            return {
              success: false,
              message: 'That time slot is no longer available',
            };
          }

          // Book the slot
          const result = await this.schedulingAdapter.bookSlot(slotId, candidateInfo);

          if (result.success) {
            return {
              success: true,
              message: `Successfully scheduled interview for ${candidateName}`,
              meetingId: result.meetingId,
              calendarLinks: result.calendarLinks,
            };
          }

          return {
            success: false,
            message: 'Failed to book the slot',
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    });

    // Tool 4: Check availability
    const checkAvailabilityTool = tool({
      name: 'check_availability',
      description: 'Check availability for a given time range and criteria',
      parameters: z.object({
        userId: z.string().describe('The user ID'),
        entities: z.any().describe('Search criteria (date range, participants, etc.)'),
      }),
      execute: async ({ userId: _userId, entities }) => {
        try {
          const slots = await this.schedulingAdapter.findSlots(entities);

          return {
            success: true,
            count: slots.length,
            message: `Found ${slots.length} available time slots`,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    });

    // Tool 5: Cancel a slot
    const cancelSlotTool = tool({
      name: 'cancel_meeting',
      description: 'Cancel an existing interview or meeting',
      parameters: z.object({
        userId: z.string().describe('The user ID'),
        meetingId: z.string().describe('The meeting ID to cancel'),
      }),
      execute: async ({ userId: _userId, meetingId }) => {
        try {
          await this.schedulingAdapter.cancelSlot(meetingId);

          return {
            success: true,
            message: `Successfully cancelled interview ${meetingId}`,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    });

    // Tool 6: Learn user preferences
    const learnPreferencesTool = tool({
      name: 'learn_preferences',
      description: 'Learn scheduling preferences from historical data',
      parameters: z.object({
        userId: z.string().describe('The user ID'),
        history: z.array(z.any()).describe('Historical scheduling data'),
      }),
      execute: async ({ userId, history }) => {
        try {
          const preferences = await this.preferenceEngine.learnPreferences(userId, history);
          this.userPreferences.set(userId, preferences);
          this.schedulingHistory.set(userId, history);

          return {
            success: true,
            message: 'Successfully learned user preferences',
            preferences,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    });

    return [
      parseRequestTool,
      findSlotsTool,
      bookSlotTool,
      checkAvailabilityTool,
      cancelSlotTool,
      learnPreferencesTool,
    ];
  }

  /**
   * Process natural language message from user (main entry point)
   */
  async processMessage(
    userId: string,
    message: string
  ): Promise<AgentResponse> {
    try {
      // Use OpenAI Agents SDK to run the agent
      const input = `User ID: ${userId}\nMessage: ${message}\n\nPlease process this scheduling request. First parse the request to understand intent and entities, then take appropriate action.`;

      const result = await run(this.agent, input);

      // Get conversation context
      const context = this.activeConversations.get(userId);

      // Extract response data from agent output
      // The agent will have called tools and generated a natural language response
      const response: AgentResponse = {
        message: result.finalOutput || 'I processed your request.',
        confidence: 0.9, // Default confidence
      };

      // Update conversation state
      if (context) {
        context.updatedAt = new Date().toISOString();
        this.activeConversations.set(userId, context);
      }

      return response;
    } catch (error) {
      throw new AgentError(
        `Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PROCESSING_ERROR',
        { userId, message }
      );
    }
  }

  /**
   * Book a specific slot (legacy method for backward compatibility)
   */
  async bookSlot(
    userId: string,
    slotId: string,
    candidateInfo: { name: string; email: string }
  ): Promise<AgentResponse> {
    try {
      // Verify slot is still available
      const isAvailable = await this.schedulingAdapter.verifySlot(slotId);

      if (!isAvailable) {
        return {
          message: 'Sorry, that time slot is no longer available. Would you like to see other options?',
          confidence: 1.0,
          nextSteps: ['See alternatives'],
        };
      }

      // Book the slot
      const result = await this.schedulingAdapter.bookSlot(slotId, candidateInfo);

      if (result.success) {
        return {
          message: `Great! I've scheduled the interview for ${candidateInfo.name}. Calendar invites have been sent to all participants.${result.calendarLinks ? `\n\nMeeting link: ${result.calendarLinks[0]}` : ''}`,
          actions: [{
            type: 'booking_created',
            details: {
              meetingId: result.meetingId,
              candidate: candidateInfo,
              calendarLinks: result.calendarLinks,
            },
          }],
          confidence: 1.0,
        };
      }

      return {
        message: 'There was an issue booking the slot. Please try again or select a different time.',
        confidence: 0.5,
      };
    } catch (error) {
      throw new AgentError(
        `Failed to book slot: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BOOKING_ERROR',
        { userId, slotId, candidateInfo }
      );
    }
  }

  /**
   * Learn preferences from historical data (legacy method)
   */
  async learnPreferences(userId: string, history: SchedulingHistory[]): Promise<void> {
    try {
      const preferences = await this.preferenceEngine.learnPreferences(userId, history);
      this.userPreferences.set(userId, preferences);
      this.schedulingHistory.set(userId, history);
    } catch (error) {
      console.error('Failed to learn preferences:', error);
    }
  }

  /**
   * Simple parser without LLM (for MVP - can be enhanced later)
   */
  private async parseMessageWithoutLLM(
    message: string,
    _context: ConversationContext
  ): Promise<ParsedRequest> {
    // Simple rule-based parsing for MVP
    const lowerMessage = message.toLowerCase();

    let intent: ParsedRequest['intent'] = 'unknown';
    if (lowerMessage.includes('schedule') || lowerMessage.includes('book')) {
      intent = 'schedule';
    } else if (lowerMessage.includes('reschedule') || lowerMessage.includes('move')) {
      intent = 'reschedule';
    } else if (lowerMessage.includes('cancel')) {
      intent = 'cancel';
    } else if (lowerMessage.includes('available') || lowerMessage.includes('availability')) {
      intent = 'check_availability';
    }

    return {
      rawText: message,
      intent,
      entities: {},
      confidence: {
        intent: 0.7,
        entities: {},
        overall: 0.7,
      },
    };
  }

  /**
   * Get or create conversation context
   */
  private getOrCreateConversation(userId: string): ConversationContext {
    let context = this.activeConversations.get(userId);

    if (!context) {
      context = {
        conversationId: `conv-${Date.now()}`,
        userId,
        history: [],
        state: 'collecting_info',
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return context;
  }

  /**
   * Update conversation history
   */
  private updateConversationHistory(
    context: ConversationContext,
    message: string,
    parsed: ParsedRequest
  ): void {
    context.history.push({
      role: 'user',
      message,
      timestamp: new Date().toISOString(),
      intent: parsed.intent,
      entities: parsed.entities,
    });

    // Keep only last 10 messages for context
    if (context.history.length > 10) {
      context.history = context.history.slice(-10);
    }
  }

  /**
   * Reset conversation
   */
  resetConversation(userId: string): void {
    this.activeConversations.delete(userId);
  }

  /**
   * Get conversation state
   */
  getConversationState(userId: string): ConversationContext | undefined {
    return this.activeConversations.get(userId);
  }
}
