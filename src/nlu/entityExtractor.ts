/**
 * Entity Extraction
 *
 * Extracts structured entities from natural language using LLM.
 *
 * Author: Ravindra Kanchikare (krhebbar)
 * License: MIT
 */

import { LLMProvider, ExtractedEntities, ConfidenceScores, ConversationContext, NLUError } from '../types';

/**
 * Entity extraction result
 */
export interface EntityExtractionResult {
  entities: ExtractedEntities;
  confidence: ConfidenceScores;
  ambiguities?: string[];
  clarifications?: string[];
}

/**
 * Entity Extractor
 *
 * Extracts scheduling entities (people, dates, times, etc.) from natural language.
 * Uses LLM for flexible parsing and context-aware extraction.
 */
export class EntityExtractor {
  constructor(private llmProvider: LLMProvider) {}

  /**
   * Extract entities from user message
   */
  async extract(
    message: string,
    context?: ConversationContext
  ): Promise<EntityExtractionResult> {
    try {
      if (!message || message.trim().length === 0) {
        throw new NLUError('Message cannot be empty', 'EMPTY_MESSAGE');
      }

      // Use LLM to extract entities
      const result = await this.llmProvider.extractEntities(message, context);

      // Post-process and validate entities
      const processedEntities = this.postProcessEntities(result.entities);

      // Merge with context if available
      if (context?.pendingRequest) {
        return this.mergeWithContext(
          { entities: processedEntities, confidence: result.confidence },
          context
        );
      }

      return {
        entities: processedEntities,
        confidence: result.confidence,
      };
    } catch (error) {
      if (error instanceof NLUError) {
        throw error;
      }

      throw new NLUError(
        `Failed to extract entities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXTRACTION_FAILED',
        message
      );
    }
  }

  /**
   * Post-process and validate extracted entities
   */
  private postProcessEntities(entities: ExtractedEntities): ExtractedEntities {
    const processed: ExtractedEntities = { ...entities };

    // Normalize dates
    if (processed.datetime?.date) {
      processed.datetime.date = this.normalizeDate(processed.datetime.date);
    }

    // Normalize times
    if (processed.datetime?.time) {
      processed.datetime.time = this.normalizeTime(processed.datetime.time);
    }

    // Convert relative dates to absolute
    if (processed.datetime?.relative && !processed.datetime?.date) {
      processed.datetime.date = this.convertRelativeDate(processed.datetime.relative);
    }

    // Default duration to 60 minutes if not specified
    if (!processed.duration && entities.interviewType) {
      processed.duration = this.getDefaultDuration(entities.interviewType);
    }

    // Clean up email addresses
    if (processed.people) {
      processed.people = processed.people.map((p) => p.trim().toLowerCase());
    }

    return processed;
  }

  /**
   * Normalize date to YYYY-MM-DD format
   */
  private normalizeDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr; // Return as-is if invalid
      }

      return date.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  }

  /**
   * Normalize time to HH:MM format
   */
  private normalizeTime(timeStr: string): string {
    try {
      // Handle various time formats (2pm, 14:00, 2:00 PM, etc.)
      const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (!match) return timeStr;

      let hours = parseInt(match[1]);
      const minutes = match[2] || '00';
      const meridiem = match[3]?.toLowerCase();

      // Convert to 24-hour format
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    } catch {
      return timeStr;
    }
  }

  /**
   * Convert relative date expressions to absolute dates
   */
  private convertRelativeDate(relative: string): string {
    const now = new Date();
    const lowerRelative = relative.toLowerCase();

    // Tomorrow
    if (lowerRelative.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    // Next week
    if (lowerRelative.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
    }

    // Next Monday, Tuesday, etc.
    const dayMatch = lowerRelative.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
    if (dayMatch) {
      const targetDay = this.getDayOfWeek(dayMatch[1]);
      const currentDay = now.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next week

      const nextDate = new Date(now);
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      return nextDate.toISOString().split('T')[0];
    }

    // In N days
    const inDaysMatch = lowerRelative.match(/in\s+(\d+)\s+days?/);
    if (inDaysMatch) {
      const days = parseInt(inDaysMatch[1]);
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + days);
      return futureDate.toISOString().split('T')[0];
    }

    return relative; // Return as-is if can't parse
  }

  /**
   * Get day of week number (0 = Sunday, 6 = Saturday)
   */
  private getDayOfWeek(dayName: string): number {
    const days: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    return days[dayName.toLowerCase()] || 0;
  }

  /**
   * Get default duration based on interview type
   */
  private getDefaultDuration(interviewType: string): number {
    const durations: Record<string, number> = {
      phone: 30,
      screening: 30,
      technical: 60,
      coding: 60,
      'system design': 90,
      behavioral: 45,
      panel: 90,
      onsite: 240,
    };

    const type = interviewType.toLowerCase();
    return durations[type] || 60; // Default to 60 minutes
  }

  /**
   * Merge extracted entities with conversation context
   */
  private mergeWithContext(
    result: EntityExtractionResult,
    context: ConversationContext
  ): EntityExtractionResult {
    if (!context.pendingRequest) {
      return result;
    }

    const merged: ExtractedEntities = {
      ...context.pendingRequest.entities,
      ...result.entities,
    };

    // Merge people arrays
    if (context.pendingRequest.entities.people && result.entities.people) {
      merged.people = [
        ...new Set([
          ...context.pendingRequest.entities.people,
          ...result.entities.people,
        ]),
      ];
    }

    // Merge datetime information
    if (context.pendingRequest.entities.datetime && result.entities.datetime) {
      merged.datetime = {
        ...context.pendingRequest.entities.datetime,
        ...result.entities.datetime,
      };
    }

    return {
      entities: merged,
      confidence: result.confidence,
    };
  }

  /**
   * Validate entities completeness for a given intent
   */
  validateCompleteness(
    entities: ExtractedEntities,
    intent: string
  ): { complete: boolean; missing: string[] } {
    const missing: string[] = [];

    if (intent === 'schedule') {
      if (!entities.people || entities.people.length === 0) {
        missing.push('participants');
      }
      if (!entities.datetime?.date && !entities.datetime?.relative) {
        missing.push('date');
      }
      if (!entities.interviewType) {
        missing.push('interview type');
      }
    }

    if (intent === 'reschedule' || intent === 'cancel') {
      if (!entities.meetingId) {
        missing.push('meeting ID or reference');
      }
    }

    return {
      complete: missing.length === 0,
      missing,
    };
  }

  /**
   * Extract entities from multiple messages (batch)
   */
  async extractBatch(messages: string[]): Promise<EntityExtractionResult[]> {
    const results: EntityExtractionResult[] = [];

    for (const message of messages) {
      const result = await this.extract(message);
      results.push(result);
    }

    return results;
  }

  /**
   * Get confidence level description
   */
  getConfidenceDescription(confidence: number): string {
    if (confidence >= 0.9) return 'very high';
    if (confidence >= 0.75) return 'high';
    if (confidence >= 0.6) return 'moderate';
    if (confidence >= 0.4) return 'low';
    return 'very low';
  }
}
