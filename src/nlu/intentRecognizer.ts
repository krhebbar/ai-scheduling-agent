/**
 * Intent Recognition
 *
 * Classifies user messages into scheduling intents using LLM.
 *
 * Author: Ravindra Kanchikare (krhebber)
 * License: MIT
 */

import { LLMProvider, SchedulingIntent, ConversationContext, NLUError } from '../types';

/**
 * Intent Recognition Result
 */
export interface IntentRecognitionResult {
  intent: SchedulingIntent;
  confidence: number;
  reasoning?: string;
}

/**
 * Intent Recognizer
 *
 * Uses LLM to classify user messages into scheduling intents.
 * Supports context-aware recognition for multi-turn conversations.
 */
export class IntentRecognizer {
  constructor(private llmProvider: LLMProvider) {}

  /**
   * Recognize intent from user message
   */
  async recognize(
    message: string,
    context?: ConversationContext
  ): Promise<IntentRecognitionResult> {
    try {
      if (!message || message.trim().length === 0) {
        throw new NLUError('Message cannot be empty', 'EMPTY_MESSAGE');
      }

      // Use LLM to classify intent
      const result = await this.llmProvider.classifyIntent(message);

      // Apply context-based adjustments
      if (context) {
        return this.applyContextualAdjustments(result, context);
      }

      return result;
    } catch (error) {
      if (error instanceof NLUError) {
        throw error;
      }

      throw new NLUError(
        `Failed to recognize intent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RECOGNITION_FAILED',
        message
      );
    }
  }

  /**
   * Apply contextual adjustments based on conversation history
   */
  private applyContextualAdjustments(
    result: IntentRecognitionResult,
    context: ConversationContext
  ): IntentRecognitionResult {
    // If confidence is low, check context for hints
    if (result.confidence < 0.7 && context.history.length > 0) {
      const lastIntent = context.history[context.history.length - 1]?.intent;

      // If user is in the middle of scheduling, assume continuation
      if (
        lastIntent === 'schedule' &&
        (context.state === 'collecting_info' || context.state === 'recommending_slots')
      ) {
        // Ambiguous messages like "yes", "sure", "that works" likely mean confirmation
        if (this.isConfirmationPhrase(result.intent)) {
          return {
            ...result,
            confidence: Math.min(result.confidence + 0.2, 1.0),
          };
        }
      }

      // If previously checking availability, follow-up might be schedule
      if (lastIntent === 'check_availability' && result.intent === 'unknown') {
        return {
          intent: 'schedule',
          confidence: 0.6,
          reasoning: 'Inferred from context: following availability check',
        };
      }
    }

    return result;
  }

  /**
   * Check if intent represents a confirmation
   */
  private isConfirmationPhrase(intent: SchedulingIntent): boolean {
    const confirmationIntents: SchedulingIntent[] = ['schedule', 'modify'];
    return confirmationIntents.includes(intent);
  }

  /**
   * Batch recognize intents for multiple messages
   */
  async recognizeBatch(
    messages: string[]
  ): Promise<IntentRecognitionResult[]> {
    const results: IntentRecognitionResult[] = [];

    for (const message of messages) {
      const result = await this.recognize(message);
      results.push(result);
    }

    return results;
  }

  /**
   * Get intent confidence threshold for actions
   */
  getConfidenceThreshold(intent: SchedulingIntent): number {
    // Different intents require different confidence levels
    const thresholds: Record<SchedulingIntent, number> = {
      schedule: 0.7,      // High confidence needed for scheduling
      reschedule: 0.7,    // High confidence for modifications
      cancel: 0.8,        // Very high confidence for destructive actions
      check_availability: 0.6, // Lower confidence for queries
      get_details: 0.6,
      modify: 0.7,
      unknown: 0.0,
    };

    return thresholds[intent] || 0.7;
  }

  /**
   * Check if intent is actionable (meets confidence threshold)
   */
  isActionable(result: IntentRecognitionResult): boolean {
    const threshold = this.getConfidenceThreshold(result.intent);
    return result.confidence >= threshold;
  }
}
