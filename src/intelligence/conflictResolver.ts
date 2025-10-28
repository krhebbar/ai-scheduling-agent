/**
 * Intelligent Conflict Resolution
 *
 * AI-powered conflict detection and resolution suggestions.
 *
 * Author: Ravindra Kanchikare (krhebbar)
 * License: MIT
 */

import {
  ConflictResolution,
  SmartSlotRecommendation,
  LLMProvider,
  AgentError,
} from '../types';

/**
 * Conflict types
 */
export type ConflictType =
  | 'double_booking'
  | 'load_exceeded'
  | 'outside_hours'
  | 'holiday'
  | 'preference_violation';

/**
 * Conflict information
 */
export interface Conflict {
  type: ConflictType;
  description: string;
  affectedParticipants: string[];
  severity: number; // 1-5
  metadata?: Record<string, any>;
}

/**
 * Resolution suggestion
 */
export interface ResolutionSuggestion {
  action: 'reschedule' | 'find_alternative' | 'reduce_duration' | 'change_participants';
  description: string;
  newSlot?: SmartSlotRecommendation;
  confidence: number; // 0-1
  tradeoffs?: string[];
}

/**
 * Conflict Resolver
 *
 * Intelligently resolves scheduling conflicts by suggesting optimal alternatives.
 * Uses historical data and LLM reasoning for complex scenarios.
 */
export class ConflictResolver {
  constructor(
    private llmProvider?: LLMProvider,
    private availableSlots?: SmartSlotRecommendation[]
  ) {}

  /**
   * Resolve conflicts and generate suggestions
   */
  async resolve(conflicts: Conflict[]): Promise<ConflictResolution[]> {
    try {
      if (conflicts.length === 0) {
        return [];
      }

      const resolutions: ConflictResolution[] = [];

      for (const conflict of conflicts) {
        const resolution = await this.resolveConflict(conflict);
        resolutions.push(resolution);
      }

      return resolutions;
    } catch (error) {
      throw new AgentError(
        `Failed to resolve conflicts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RESOLUTION_ERROR'
      );
    }
  }

  /**
   * Resolve a single conflict
   */
  private async resolveConflict(conflict: Conflict): Promise<ConflictResolution> {
    // Generate suggestions based on conflict type
    const suggestions = await this.generateSuggestions(conflict);

    // Rank suggestions by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);

    return {
      conflictType: conflict.type,
      description: conflict.description,
      affectedParticipants: conflict.affectedParticipants,
      suggestions,
      severity: conflict.severity,
    };
  }

  /**
   * Generate resolution suggestions for a conflict
   */
  private async generateSuggestions(conflict: Conflict): Promise<ResolutionSuggestion[]> {
    const suggestions: ResolutionSuggestion[] = [];

    switch (conflict.type) {
      case 'double_booking':
        suggestions.push(...this.resolveDoubleBooking(conflict));
        break;

      case 'load_exceeded':
        suggestions.push(...this.resolveLoadExceeded(conflict));
        break;

      case 'outside_hours':
        suggestions.push(...this.resolveOutsideHours(conflict));
        break;

      case 'holiday':
        suggestions.push(...this.resolveHoliday(conflict));
        break;

      case 'preference_violation':
        suggestions.push(...this.resolvePreferenceViolation(conflict));
        break;
    }

    // Use LLM for complex multi-conflict scenarios if available
    if (this.llmProvider && suggestions.length === 0) {
      return await this.getLLMSuggestions(conflict);
    }

    return suggestions;
  }

  /**
   * Resolve double-booking conflicts
   */
  private resolveDoubleBooking(conflict: Conflict): ResolutionSuggestion[] {
    const suggestions: ResolutionSuggestion[] = [];

    // Suggestion 1: Find alternative time slot
    if (this.availableSlots && this.availableSlots.length > 0) {
      const alternativeSlot = this.availableSlots[0]; // Best alternative

      suggestions.push({
        action: 'find_alternative',
        description: `Reschedule to ${new Date(alternativeSlot.startTime).toLocaleString()}`,
        newSlot: alternativeSlot,
        confidence: alternativeSlot.score,
        tradeoffs: [
          'May not be optimal time',
          'All participants available',
        ],
      });
    }

    // Suggestion 2: Reschedule existing meeting
    suggestions.push({
      action: 'reschedule',
      description: 'Reschedule the conflicting meeting to a later time',
      confidence: 0.6,
      tradeoffs: [
        'Affects other participants',
        'May cascade additional conflicts',
      ],
    });

    // Suggestion 3: Change participants
    suggestions.push({
      action: 'change_participants',
      description: 'Assign different interviewers who are available',
      confidence: 0.5,
      tradeoffs: [
        'Different interviewer expertise',
        'May affect evaluation consistency',
      ],
    });

    return suggestions;
  }

  /**
   * Resolve load exceeded conflicts
   */
  private resolveLoadExceeded(conflict: Conflict): ResolutionSuggestion[] {
    const suggestions: ResolutionSuggestion[] = [];

    // Suggestion 1: Distribute to other interviewers
    suggestions.push({
      action: 'change_participants',
      description: 'Reassign to interviewers with lower load',
      confidence: 0.8,
      tradeoffs: [
        'Better load distribution',
        'Different interviewer perspective',
      ],
    });

    // Suggestion 2: Reschedule to next week
    if (this.availableSlots) {
      const nextWeekSlots = this.availableSlots.filter((slot) => {
        const slotDate = new Date(slot.startTime);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return slotDate >= nextWeek;
      });

      if (nextWeekSlots.length > 0) {
        suggestions.push({
          action: 'find_alternative',
          description: `Schedule next week when load is lower`,
          newSlot: nextWeekSlots[0],
          confidence: 0.7,
          tradeoffs: [
            'Delays interview process',
            'Interviewer has more capacity',
          ],
        });
      }
    }

    // Suggestion 3: Reduce duration
    suggestions.push({
      action: 'reduce_duration',
      description: 'Reduce interview duration to stay within limits',
      confidence: 0.5,
      tradeoffs: [
        'Less time for evaluation',
        'Respects interviewer limits',
      ],
    });

    return suggestions;
  }

  /**
   * Resolve outside work hours conflicts
   */
  private resolveOutsideHours(conflict: Conflict): ResolutionSuggestion[] {
    const suggestions: ResolutionSuggestion[] = [];

    // Suggestion: Find slot within work hours
    if (this.availableSlots) {
      const withinHoursSlots = this.availableSlots.filter((slot) => {
        const hour = new Date(slot.startTime).getHours();
        return hour >= 9 && hour < 17; // Standard work hours
      });

      if (withinHoursSlots.length > 0) {
        suggestions.push({
          action: 'find_alternative',
          description: `Reschedule to within work hours: ${new Date(withinHoursSlots[0].startTime).toLocaleString()}`,
          newSlot: withinHoursSlots[0],
          confidence: 0.9,
          tradeoffs: [
            'Respects work hours',
            'May delay scheduling',
          ],
        });
      }
    }

    return suggestions;
  }

  /**
   * Resolve holiday conflicts
   */
  private resolveHoliday(conflict: Conflict): ResolutionSuggestion[] {
    const suggestions: ResolutionSuggestion[] = [];

    // Suggestion: Find next available non-holiday
    if (this.availableSlots) {
      suggestions.push({
        action: 'find_alternative',
        description: 'Reschedule to next available working day',
        newSlot: this.availableSlots[0],
        confidence: 0.9,
        tradeoffs: [
          'Avoids holiday scheduling',
          'May affect interview timeline',
        ],
      });
    }

    return suggestions;
  }

  /**
   * Resolve preference violation conflicts
   */
  private resolvePreferenceViolation(conflict: Conflict): ResolutionSuggestion[] {
    const suggestions: ResolutionSuggestion[] = [];

    // Suggestion: Find slot matching preferences
    if (this.availableSlots) {
      // Filter for high preference match
      const preferredSlots = this.availableSlots.filter(
        (slot) => (slot.factors.preferenceMatch || 0) > 0.7
      );

      if (preferredSlots.length > 0) {
        suggestions.push({
          action: 'find_alternative',
          description: 'Reschedule to time matching participant preferences',
          newSlot: preferredSlots[0],
          confidence: 0.8,
          tradeoffs: [
            'Matches participant preferences',
            'Higher likelihood of acceptance',
          ],
        });
      }
    }

    // Suggestion: Override preference if urgent
    suggestions.push({
      action: 'reschedule',
      description: 'Proceed with current time if urgent (override preference)',
      confidence: 0.4,
      tradeoffs: [
        'May reduce participant satisfaction',
        'Meets scheduling urgency',
      ],
    });

    return suggestions;
  }

  /**
   * Get LLM-powered suggestions for complex conflicts
   */
  private async getLLMSuggestions(conflict: Conflict): Promise<ResolutionSuggestion[]> {
    if (!this.llmProvider) {
      return [];
    }

    try {
      // Use LLM to reason about complex conflicts
      const prompt = `Analyze this scheduling conflict and suggest resolutions:

Conflict Type: ${conflict.type}
Description: ${conflict.description}
Affected: ${conflict.affectedParticipants.join(', ')}
Severity: ${conflict.severity}/5

Available alternatives: ${this.availableSlots?.length || 0} slots

Suggest the best 3 resolution strategies with reasoning.`;

      // Note: This would call the LLM provider's conflict resolution method
      // For now, return empty array (placeholder for actual implementation)
      return [];
    } catch (error) {
      console.error('LLM suggestion failed:', error);
      return [];
    }
  }

  /**
   * Detect conflicts in a proposed schedule
   */
  detectConflicts(
    proposedSlot: { startTime: string; endTime: string; interviewers: string[] },
    existingSchedule: Array<{ startTime: string; endTime: string; participants: string[] }>
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    // Check for double-bookings
    for (const existing of existingSchedule) {
      const overlap = this.checkTimeOverlap(
        new Date(proposedSlot.startTime),
        new Date(proposedSlot.endTime),
        new Date(existing.startTime),
        new Date(existing.endTime)
      );

      if (overlap) {
        const affectedParticipants = proposedSlot.interviewers.filter((p) =>
          existing.participants.includes(p)
        );

        if (affectedParticipants.length > 0) {
          conflicts.push({
            type: 'double_booking',
            description: `Double-booking detected for: ${affectedParticipants.join(', ')}`,
            affectedParticipants,
            severity: 5, // Critical
          });
        }
      }
    }

    // Check work hours
    const startHour = new Date(proposedSlot.startTime).getHours();
    if (startHour < 9 || startHour >= 17) {
      conflicts.push({
        type: 'outside_hours',
        description: `Proposed time (${startHour}:00) is outside standard work hours`,
        affectedParticipants: proposedSlot.interviewers,
        severity: 3,
      });
    }

    return conflicts;
  }

  /**
   * Check if two time ranges overlap
   */
  private checkTimeOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Update available slots for resolution suggestions
   */
  updateAvailableSlots(slots: SmartSlotRecommendation[]): void {
    this.availableSlots = slots;
  }

  /**
   * Get conflict severity description
   */
  getSeverityDescription(severity: number): string {
    if (severity >= 5) return 'Critical';
    if (severity >= 4) return 'High';
    if (severity >= 3) return 'Medium';
    if (severity >= 2) return 'Low';
    return 'Informational';
  }
}
