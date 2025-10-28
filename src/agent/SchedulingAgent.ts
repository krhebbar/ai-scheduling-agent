/**
 * Scheduling Agent
 *
 * Main AI agent class that orchestrates all components for intelligent scheduling.
 *
 * Author: Ravindra Kanchikare (krhebbar)
 * License: MIT
 */

import {
  AgentConfig,
  AgentResponse,
  ParsedRequest,
  SmartSlotRecommendation,
  ConversationContext,
  SchedulingPreferences,
  SchedulingHistory,
  AgentError,
} from '../types';

import { RequestParser } from '../nlu';
import { SlotRecommender, ConflictResolver, PreferenceEngine } from '../intelligence';
import { SchedulingAdapter } from '../integration';
import { OpenAILLMProvider } from '../llm/providers/openai';

/**
 * Scheduling Agent
 *
 * AI-powered scheduling assistant that understands natural language,
 * makes smart recommendations, and handles complex scheduling scenarios.
 *
 * Features:
 * - Natural language understanding
 * - Smart slot recommendations based on preferences
 * - Intelligent conflict resolution
 * - Multi-turn conversations
 * - Preference learning
 */
export class SchedulingAgent {
  private llmProvider: OpenAILLMProvider;
  private requestParser: RequestParser;
  private slotRecommender: SlotRecommender;
  private conflictResolver: ConflictResolver;
  private preferenceEngine: PreferenceEngine;
  private schedulingAdapter: SchedulingAdapter;

  // State management
  private activeConversations: Map<string, ConversationContext> = new Map();
  private userPreferences: Map<string, SchedulingPreferences> = new Map();
  private schedulingHistory: Map<string, SchedulingHistory[]> = new Map();

  constructor(private config: AgentConfig) {
    // Initialize LLM provider
    this.llmProvider = new OpenAILLMProvider({
      apiKey: config.llm.apiKey,
      model: config.llm.model,
      temperature: config.llm.temperature,
      maxTokens: config.llm.maxTokens,
    });

    // Initialize components
    this.requestParser = new RequestParser(this.llmProvider);
    this.slotRecommender = new SlotRecommender(this.llmProvider);
    this.conflictResolver = new ConflictResolver(this.llmProvider);
    this.preferenceEngine = new PreferenceEngine();
    this.schedulingAdapter = new SchedulingAdapter(
      undefined,
      config.scheduling.timezone
    );
  }

  /**
   * Process natural language message from user
   */
  async processMessage(
    userId: string,
    message: string
  ): Promise<AgentResponse> {
    try {
      // Get or create conversation context
      const context = this.getOrCreateConversation(userId);

      // Parse the message
      const parsed = await this.requestParser.parse(message, context);

      // Update conversation history
      this.updateConversationHistory(context, message, parsed);

      // Handle based on intent
      const response = await this.handleIntent(userId, parsed, context);

      // Update conversation state
      context.updatedAt = new Date().toISOString();
      this.activeConversations.set(userId, context);

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
   * Handle different intents
   */
  private async handleIntent(
    userId: string,
    parsed: ParsedRequest,
    context: ConversationContext
  ): Promise<AgentResponse> {
    switch (parsed.intent) {
      case 'schedule':
        return await this.handleSchedule(userId, parsed, context);

      case 'reschedule':
        return await this.handleReschedule(userId, parsed, context);

      case 'cancel':
        return await this.handleCancel(userId, parsed, context);

      case 'check_availability':
        return await this.handleCheckAvailability(userId, parsed, context);

      case 'get_details':
        return await this.handleGetDetails(userId, parsed, context);

      default:
        return await this.handleUnknown(userId, parsed, context);
    }
  }

  /**
   * Handle schedule intent
   */
  private async handleSchedule(
    userId: string,
    parsed: ParsedRequest,
    context: ConversationContext
  ): Promise<AgentResponse> {
    // Check if we have enough information
    if (parsed.clarifications && parsed.clarifications.length > 0) {
      context.state = 'collecting_info';
      context.pendingRequest = {
        intent: parsed.intent,
        entities: parsed.entities,
        missingInfo: parsed.clarifications,
      };

      return {
        message: await this.generateClarificationMessage(parsed),
        clarifications: parsed.clarifications,
        confidence: parsed.confidence.overall,
      };
    }

    // Find available slots
    context.state = 'recommending_slots';
    const slots = await this.schedulingAdapter.findSlots(parsed.entities);

    if (slots.length === 0) {
      return {
        message: 'I couldn\'t find any available slots matching your criteria. Would you like to try different dates or times?',
        confidence: 1.0,
        nextSteps: ['Try different dates', 'Adjust requirements'],
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
      5 // Top 5 recommendations
    );

    // Generate natural language response
    const message = await this.llmProvider.generateResponse(parsed, {
      recommendedSlots: recommendations,
    });

    return {
      message,
      recommendedSlots: recommendations,
      confidence: parsed.confidence.overall,
      nextSteps: ['Select a time slot', 'Request different options'],
    };
  }

  /**
   * Handle reschedule intent
   */
  private async handleReschedule(
    userId: string,
    parsed: ParsedRequest,
    context: ConversationContext
  ): Promise<AgentResponse> {
    if (!parsed.entities.meetingId) {
      return {
        message: 'Which interview would you like to reschedule? Please provide the meeting ID or describe the interview.',
        clarifications: ['Meeting ID or interview description'],
        confidence: parsed.confidence.overall,
      };
    }

    // Find new slots (similar to schedule)
    const slots = await this.schedulingAdapter.findSlots(parsed.entities);
    const recommendations = await this.slotRecommender.recommend(
      slots.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        interviewers: s.interviewers,
      })),
      3
    );

    const message = `I found ${recommendations.length} alternative times for rescheduling. Here are the best options:`;

    return {
      message,
      recommendedSlots: recommendations,
      confidence: parsed.confidence.overall,
      nextSteps: ['Select new time', 'Cancel request'],
    };
  }

  /**
   * Handle cancel intent
   */
  private async handleCancel(
    userId: string,
    parsed: ParsedRequest,
    context: ConversationContext
  ): Promise<AgentResponse> {
    if (!parsed.entities.meetingId) {
      return {
        message: 'Which interview would you like to cancel? Please provide the meeting ID.',
        clarifications: ['Meeting ID'],
        confidence: parsed.confidence.overall,
      };
    }

    await this.schedulingAdapter.cancelSlot(parsed.entities.meetingId);

    return {
      message: `I've cancelled the interview (${parsed.entities.meetingId}). All participants will be notified.`,
      actions: [{
        type: 'cancelled',
        details: { meetingId: parsed.entities.meetingId },
      }],
      confidence: 1.0,
    };
  }

  /**
   * Handle check availability intent
   */
  private async handleCheckAvailability(
    userId: string,
    parsed: ParsedRequest,
    context: ConversationContext
  ): Promise<AgentResponse> {
    const slots = await this.schedulingAdapter.findSlots(parsed.entities);

    const message = `I found ${slots.length} available time slots. Would you like me to recommend the best options?`;

    return {
      message,
      confidence: parsed.confidence.overall,
      nextSteps: ['See recommendations', 'Try different criteria'],
    };
  }

  /**
   * Handle get details intent
   */
  private async handleGetDetails(
    userId: string,
    parsed: ParsedRequest,
    context: ConversationContext
  ): Promise<AgentResponse> {
    return {
      message: 'Interview details retrieval is not yet implemented. Please provide a meeting ID.',
      confidence: 0.5,
    };
  }

  /**
   * Handle unknown intent
   */
  private async handleUnknown(
    userId: string,
    parsed: ParsedRequest,
    context: ConversationContext
  ): Promise<AgentResponse> {
    return {
      message: 'I\'m not sure what you\'d like me to do. I can help you schedule, reschedule, or cancel interviews. What would you like to do?',
      clarifications: ['Schedule new interview', 'Reschedule existing', 'Cancel interview', 'Check availability'],
      confidence: parsed.confidence.overall,
    };
  }

  /**
   * Book a specific slot
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
   * Learn preferences from historical data
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
   * Generate clarification message
   */
  private async generateClarificationMessage(parsed: ParsedRequest): Promise<string> {
    if (!parsed.clarifications || parsed.clarifications.length === 0) {
      return 'I need more information to help you schedule this interview.';
    }

    const questions = parsed.clarifications.slice(0, 2); // Ask max 2 questions at a time
    return `I'd like to help you schedule this interview. ${questions.join(' ')}`;
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
