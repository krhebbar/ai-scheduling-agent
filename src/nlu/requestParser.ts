/**
 * Request Parser
 *
 * Combines intent recognition and entity extraction into complete request parsing.
 *
 * Author: Ravindra Kanchikare (krhebbar)
 * License: MIT
 */

import { ParsedRequest, ConversationContext, LLMProvider, NLUError } from '../types';
import { IntentRecognizer } from './intentRecognizer';
import { EntityExtractor } from './entityExtractor';

/**
 * Request Parser
 *
 * Main entry point for natural language understanding.
 * Combines intent recognition and entity extraction.
 */
export class RequestParser {
  private intentRecognizer: IntentRecognizer;
  private entityExtractor: EntityExtractor;

  constructor(private llmProvider: LLMProvider) {
    this.intentRecognizer = new IntentRecognizer(llmProvider);
    this.entityExtractor = new EntityExtractor(llmProvider);
  }

  /**
   * Parse natural language request into structured format
   */
  async parse(
    message: string,
    context?: ConversationContext
  ): Promise<ParsedRequest> {
    try {
      // Validate input
      if (!message || message.trim().length === 0) {
        throw new NLUError('Message cannot be empty', 'EMPTY_MESSAGE');
      }

      // Option 1: Use LLM's combined parsing (faster, single API call)
      if (this.shouldUseCombinedParsing(message)) {
        return await this.llmProvider.parseRequest(message, context);
      }

      // Option 2: Separate intent and entity extraction (more granular control)
      return await this.parseStepByStep(message, context);
    } catch (error) {
      if (error instanceof NLUError) {
        throw error;
      }

      throw new NLUError(
        `Failed to parse request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PARSE_FAILED',
        message
      );
    }
  }

  /**
   * Parse request step-by-step (intent → entities)
   */
  private async parseStepByStep(
    message: string,
    context?: ConversationContext
  ): Promise<ParsedRequest> {
    // Step 1: Recognize intent
    const intentResult = await this.intentRecognizer.recognize(message, context);

    // Step 2: Extract entities
    const entityResult = await this.entityExtractor.extract(message, context);

    // Step 3: Validate completeness
    const validation = this.entityExtractor.validateCompleteness(
      entityResult.entities,
      intentResult.intent
    );

    // Step 4: Generate clarifications for missing info
    const clarifications: string[] = [];
    if (!validation.complete) {
      clarifications.push(
        ...this.generateClarificationQuestions(validation.missing, intentResult.intent)
      );
    }

    // Step 5: Combine results
    return {
      rawText: message,
      intent: intentResult.intent,
      entities: entityResult.entities,
      confidence: {
        intent: intentResult.confidence,
        entities: entityResult.confidence.entities,
        overall: (intentResult.confidence + entityResult.confidence.overall) / 2,
      },
      ambiguities: entityResult.ambiguities,
      clarifications: clarifications.length > 0 ? clarifications : undefined,
    };
  }

  /**
   * Decide whether to use combined parsing or step-by-step
   */
  private shouldUseCombinedParsing(message: string): boolean {
    // Use combined parsing for short, clear messages
    // Use step-by-step for complex messages or when debugging
    return message.split(' ').length <= 20; // Simple heuristic
  }

  /**
   * Generate clarification questions for missing information
   */
  private generateClarificationQuestions(missing: string[], intent: string): string[] {
    const questions: string[] = [];

    for (const field of missing) {
      switch (field) {
        case 'participants':
          questions.push('Who should attend this interview?');
          break;
        case 'date':
          questions.push('When would you like to schedule this?');
          break;
        case 'time':
          questions.push('What time works best?');
          break;
        case 'interview type':
          questions.push('What type of interview is this? (e.g., technical, behavioral)');
          break;
        case 'duration':
          questions.push('How long should the interview be?');
          break;
        case 'meeting ID or reference':
          questions.push('Which interview would you like to ' + intent + '?');
          break;
        default:
          questions.push(`Please provide: ${field}`);
      }
    }

    return questions;
  }

  /**
   * Parse multiple requests in batch
   */
  async parseBatch(
    messages: string[],
    context?: ConversationContext
  ): Promise<ParsedRequest[]> {
    const results: ParsedRequest[] = [];

    for (const message of messages) {
      const result = await this.parse(message, context);
      results.push(result);
    }

    return results;
  }

  /**
   * Check if parsed request is ready for action
   */
  isReadyForAction(parsed: ParsedRequest): boolean {
    // Check confidence threshold
    if (parsed.confidence.overall < 0.7) {
      return false;
    }

    // Check if critical information is present
    if (parsed.intent === 'schedule') {
      const { entities } = parsed;
      return !!(
        entities.people &&
        entities.people.length > 0 &&
        (entities.datetime?.date || entities.datetime?.relative)
      );
    }

    if (parsed.intent === 'reschedule' || parsed.intent === 'cancel') {
      return !!parsed.entities.meetingId;
    }

    // Other intents (check_availability, get_details) can proceed with lower requirements
    return true;
  }

  /**
   * Get human-readable summary of parsed request
   */
  getSummary(parsed: ParsedRequest): string {
    const { intent, entities } = parsed;

    const parts: string[] = [];

    // Intent
    parts.push(`Intent: ${intent}`);

    // People
    if (entities.people && entities.people.length > 0) {
      parts.push(`With: ${entities.people.join(', ')}`);
    }

    // Type
    if (entities.interviewType) {
      parts.push(`Type: ${entities.interviewType}`);
    }

    // Date/Time
    if (entities.datetime) {
      if (entities.datetime.date) {
        parts.push(`Date: ${entities.datetime.date}`);
      }
      if (entities.datetime.time) {
        parts.push(`Time: ${entities.datetime.time}`);
      }
      if (entities.datetime.relative) {
        parts.push(`When: ${entities.datetime.relative}`);
      }
    }

    // Duration
    if (entities.duration) {
      parts.push(`Duration: ${entities.duration} minutes`);
    }

    // Confidence
    parts.push(`Confidence: ${(parsed.confidence.overall * 100).toFixed(0)}%`);

    return parts.join(' | ');
  }
}

/**
 * Create request parser with LLM provider
 */
export function createRequestParser(llmProvider: LLMProvider): RequestParser {
  return new RequestParser(llmProvider);
}
