/**
 * OpenAI LLM Provider
 *
 * OpenAI GPT-4 integration for natural language understanding and response generation.
 *
 * Author: Ravindra Kanchikare (krhebbar)
 * License: MIT
 */

import OpenAI from 'openai';
import {
  LLMProvider,
  ParsedRequest,
  SchedulingIntent,
  ExtractedEntities,
  ConfidenceScores,
  ConversationContext,
  NLUError,
} from '../../types';
import {
  INTENT_CLASSIFICATION_PROMPT,
  ENTITY_EXTRACTION_PROMPT,
  RESPONSE_GENERATION_PROMPT,
  FUNCTION_SCHEMAS,
  fillTemplate,
} from '../promptTemplates';

/**
 * OpenAI provider configuration
 */
export interface OpenAIProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  organization?: string;
}

/**
 * OpenAI LLM Provider
 *
 * Uses GPT-4 for natural language understanding and generation.
 * Supports function calling for structured outputs.
 */
export class OpenAILLMProvider implements LLMProvider {
  public readonly name = 'openai';
  private client: OpenAI;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: OpenAIProviderConfig) {
    if (!config.apiKey) {
      throw new NLUError('OpenAI API key is required', 'MISSING_API_KEY');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
    });

    this.model = config.model || 'gpt-4-turbo-preview';
    this.temperature = config.temperature ?? 0.1; // Low temperature for consistent parsing
    this.maxTokens = config.maxTokens || 1500;
  }

  /**
   * Parse natural language request into structured format
   */
  async parseRequest(
    text: string,
    context?: ConversationContext
  ): Promise<ParsedRequest> {
    try {
      // Step 1: Classify intent
      const { intent, confidence: intentConfidence } = await this.classifyIntent(text);

      // Step 2: Extract entities
      const {
        entities,
        confidence: entityConfidence,
      } = await this.extractEntities(text, context);

      // Step 3: Calculate overall confidence
      const overallConfidence = (intentConfidence + entityConfidence.overall) / 2;

      // Step 4: Identify ambiguities
      const ambiguities: string[] = [];
      const clarifications: string[] = [];

      if (intentConfidence < 0.7) {
        ambiguities.push('Intent is unclear');
        clarifications.push('Could you clarify what you would like to do?');
      }

      if (!entities.datetime && intent === 'schedule') {
        ambiguities.push('No date/time specified');
        clarifications.push('When would you like to schedule this?');
      }

      if (!entities.people && intent === 'schedule') {
        ambiguities.push('No participants specified');
        clarifications.push('Who should attend this interview?');
      }

      return {
        rawText: text,
        intent,
        entities,
        confidence: {
          intent: intentConfidence,
          entities: entityConfidence.entities,
          overall: overallConfidence,
        },
        ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
        clarifications: clarifications.length > 0 ? clarifications : undefined,
      };
    } catch (error) {
      throw new NLUError(
        `Failed to parse request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PARSE_ERROR',
        text
      );
    }
  }

  /**
   * Generate natural language response
   */
  async generateResponse(request: ParsedRequest, data: any): Promise<string> {
    try {
      const prompt = fillTemplate(RESPONSE_GENERATION_PROMPT.template, {
        userMessage: request.rawText,
        intent: request.intent,
        entities: JSON.stringify(request.entities, null, 2),
        recommendedSlots: data.recommendedSlots || [],
        conflicts: data.conflicts || [],
        clarifications: request.clarifications || [],
      });

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a friendly and professional scheduling assistant.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7, // Higher temperature for more natural responses
        max_tokens: this.maxTokens,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new NLUError('No response generated', 'EMPTY_RESPONSE');
      }

      return response.trim();
    } catch (error) {
      throw new NLUError(
        `Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GENERATION_ERROR'
      );
    }
  }

  /**
   * Extract entities from text using function calling
   */
  async extractEntities(
    text: string,
    context?: ConversationContext
  ): Promise<{ entities: ExtractedEntities; confidence: ConfidenceScores }> {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().slice(0, 5);

      const conversationContext = context
        ? context.history.slice(-3).map((h) => `${h.role}: ${h.message}`).join('\n')
        : '';

      const prompt = fillTemplate(ENTITY_EXTRACTION_PROMPT.template, {
        userMessage: text,
        currentDate,
        currentTime,
        defaultTimezone: 'UTC',
        conversationContext,
      });

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting scheduling information from natural language.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new NLUError('No response from OpenAI', 'EMPTY_RESPONSE');
      }

      const parsed = JSON.parse(responseContent);

      return {
        entities: parsed.entities || {},
        confidence: {
          intent: 0, // Not used here
          entities: parsed.confidence || {},
          overall: parsed.confidence?.overall || 0.5,
        },
      };
    } catch (error) {
      if (error instanceof NLUError) throw error;

      throw new NLUError(
        `Failed to extract entities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXTRACTION_ERROR',
        text
      );
    }
  }

  /**
   * Classify intent using function calling
   */
  async classifyIntent(text: string): Promise<{ intent: SchedulingIntent; confidence: number }> {
    try {
      const prompt = fillTemplate(INTENT_CLASSIFICATION_PROMPT.template, {
        userMessage: text,
      });

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at understanding scheduling requests.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.temperature,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new NLUError('No response from OpenAI', 'EMPTY_RESPONSE');
      }

      const parsed = JSON.parse(responseContent);

      return {
        intent: (parsed.intent as SchedulingIntent) || 'unknown',
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      if (error instanceof NLUError) throw error;

      throw new NLUError(
        `Failed to classify intent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CLASSIFICATION_ERROR',
        text
      );
    }
  }

  /**
   * Parse with function calling (alternative approach)
   */
  async parseWithFunctionCalling(text: string): Promise<ParsedRequest> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert scheduling assistant that parses natural language requests.',
          },
          {
            role: 'user',
            content: `Parse this scheduling request: "${text}"`,
          },
        ],
        functions: [FUNCTION_SCHEMAS.parseSchedulingRequest as any],
        function_call: { name: 'parseSchedulingRequest' },
        temperature: this.temperature,
      });

      const functionCall = completion.choices[0]?.message?.function_call;
      if (!functionCall || !functionCall.arguments) {
        throw new NLUError('No function call in response', 'NO_FUNCTION_CALL');
      }

      const parsed = JSON.parse(functionCall.arguments);

      return {
        rawText: text,
        intent: parsed.intent || 'unknown',
        entities: parsed.entities || {},
        confidence: {
          intent: parsed.confidence || 0.5,
          entities: {},
          overall: parsed.confidence || 0.5,
        },
        ambiguities: parsed.ambiguities,
        clarifications: parsed.clarifications,
      };
    } catch (error) {
      throw new NLUError(
        `Failed to parse with function calling: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FUNCTION_CALL_ERROR',
        text
      );
    }
  }

  /**
   * Generate slot recommendations using LLM
   */
  async recommendSlots(
    availableSlots: any[],
    preferences: any[],
    historicalData: any
  ): Promise<any[]> {
    try {
      const prompt = `You are an AI that recommends optimal interview time slots.

Available slots: ${JSON.stringify(availableSlots, null, 2)}
Preferences: ${JSON.stringify(preferences, null, 2)}
Historical data: ${JSON.stringify(historicalData, null, 2)}

Rank these slots considering participant preferences, load balance, time preferences, and historical success.
Return top 5 recommendations with scores and reasoning.

Response format:
{
  "rankings": [
    {
      "slotId": "...",
      "score": 0.0-1.0,
      "reasons": ["..."],
      "factors": { "preferenceMatch": 0.85, "loadBalance": 0.90 }
    }
  ]
}`;

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are an AI slot recommendation engine.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new NLUError('No recommendations generated', 'EMPTY_RESPONSE');
      }

      const parsed = JSON.parse(response);
      return parsed.rankings || [];
    } catch (error) {
      throw new NLUError(
        `Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RECOMMENDATION_ERROR'
      );
    }
  }
}

/**
 * Create OpenAI provider
 */
export function createOpenAIProvider(config: OpenAIProviderConfig): OpenAILLMProvider {
  return new OpenAILLMProvider(config);
}
