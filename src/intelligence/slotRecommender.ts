/**
 * Smart Slot Recommender
 *
 * AI-powered slot recommendation using historical data and preferences.
 *
 * Author: Ravindra Kanchikare (krhebbar)
 * License: MIT
 */

import {
  SmartSlotRecommendation,
  SchedulingPreferences,
  SchedulingHistory,
  LLMProvider,
  AgentError,
} from '../types';

/**
 * Slot scoring factors
 */
interface ScoringFactors {
  preferenceMatch: number;    // 0-1
  loadBalance: number;         // 0-1
  timeOfDay: number;           // 0-1
  dayOfWeek: number;           // 0-1
  pastSuccess: number;         // 0-1
  participantSatisfaction: number; // 0-1
}

/**
 * Raw slot from scheduling engine
 */
interface RawSlot {
  id: string;
  startTime: string;
  endTime: string;
  interviewers: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  loadInfo?: {
    currentLoad: number;
    maxLoad: number;
  };
}

/**
 * Smart Slot Recommender
 *
 * Uses ML and historical data to recommend optimal interview slots.
 * Combines preference matching, load balancing, and success patterns.
 */
export class SlotRecommender {
  constructor(
    private llmProvider?: LLMProvider,
    private preferences?: SchedulingPreferences[],
    private history?: SchedulingHistory[]
  ) {}

  /**
   * Recommend best slots from available options
   */
  async recommend(
    availableSlots: RawSlot[],
    topN: number = 5
  ): Promise<SmartSlotRecommendation[]> {
    try {
      if (availableSlots.length === 0) {
        return [];
      }

      // Score all slots
      const scoredSlots = await Promise.all(
        availableSlots.map((slot) => this.scoreSlot(slot))
      );

      // Sort by score (descending)
      scoredSlots.sort((a, b) => b.score - a.score);

      // Return top N
      return scoredSlots.slice(0, topN);
    } catch (error) {
      throw new AgentError(
        `Failed to recommend slots: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RECOMMENDATION_ERROR'
      );
    }
  }

  /**
   * Score a single slot
   */
  private async scoreSlot(slot: RawSlot): Promise<SmartSlotRecommendation> {
    // Calculate individual factors
    const factors = await this.calculateFactors(slot);

    // Weighted combination (configurable weights)
    const weights = {
      preferenceMatch: 0.30,
      loadBalance: 0.25,
      timeOfDay: 0.15,
      dayOfWeek: 0.10,
      pastSuccess: 0.15,
      participantSatisfaction: 0.05,
    };

    const score =
      (factors.preferenceMatch * weights.preferenceMatch) +
      (factors.loadBalance * weights.loadBalance) +
      (factors.timeOfDay * weights.timeOfDay) +
      (factors.dayOfWeek * weights.dayOfWeek) +
      (factors.pastSuccess * weights.pastSuccess) +
      (factors.participantSatisfaction * weights.participantSatisfaction);

    // Generate reasons
    const reasons = this.generateReasons(factors, slot);

    return {
      slotId: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      interviewers: slot.interviewers,
      score,
      reasons,
      factors: {
        preferenceMatch: factors.preferenceMatch,
        loadBalance: factors.loadBalance,
        timeOfDay: factors.timeOfDay,
        dayOfWeek: factors.dayOfWeek,
        pastSuccess: factors.pastSuccess,
        participantSatisfaction: factors.participantSatisfaction,
      },
    };
  }

  /**
   * Calculate scoring factors for a slot
   */
  private async calculateFactors(slot: RawSlot): Promise<ScoringFactors> {
    const slotDate = new Date(slot.startTime);
    const dayOfWeek = slotDate.getDay();
    const hourOfDay = slotDate.getHours();

    return {
      preferenceMatch: this.scorePreferenceMatch(dayOfWeek, hourOfDay),
      loadBalance: this.scoreLoadBalance(slot),
      timeOfDay: this.scoreTimeOfDay(hourOfDay),
      dayOfWeek: this.scoreDayOfWeek(dayOfWeek),
      pastSuccess: this.scorePastSuccess(dayOfWeek, hourOfDay),
      participantSatisfaction: this.scoreParticipantSatisfaction(slot.interviewers),
    };
  }

  /**
   * Score based on participant preferences
   */
  private scorePreferenceMatch(dayOfWeek: number, hourOfDay: number): number {
    if (!this.preferences || this.preferences.length === 0) {
      return 0.5; // Neutral score if no preferences
    }

    let totalScore = 0;
    let count = 0;

    for (const pref of this.preferences) {
      let score = 0;

      // Check preferred days
      if (pref.preferredDays && pref.preferredDays.includes(dayOfWeek)) {
        score += 0.5;
      }

      // Check preferred time ranges
      if (pref.preferredTimeRanges) {
        for (const range of pref.preferredTimeRanges) {
          const startHour = parseInt(range.start.split(':')[0]);
          const endHour = parseInt(range.end.split(':')[0]);

          if (hourOfDay >= startHour && hourOfDay < endHour) {
            score += 0.5;
            break;
          }
        }
      }

      totalScore += Math.min(score, 1.0);
      count++;
    }

    return count > 0 ? totalScore / count : 0.5;
  }

  /**
   * Score based on load distribution
   */
  private scoreLoadBalance(slot: RawSlot): number {
    if (!slot.loadInfo) {
      return 0.7; // Default good score if no load info
    }

    const { currentLoad, maxLoad } = slot.loadInfo;
    const utilization = currentLoad / maxLoad;

    // Prefer slots with lower utilization (better load balance)
    // 0% utilization = 1.0 score, 100% utilization = 0.0 score
    return 1.0 - utilization;
  }

  /**
   * Score based on time of day preferences
   */
  private scoreTimeOfDay(hourOfDay: number): number {
    // General preferences (can be customized)
    // Early morning (6-8): 0.3
    // Morning (9-11): 0.9
    // Lunch (12-13): 0.4
    // Afternoon (14-16): 0.8
    // Late afternoon (17-18): 0.5
    // Evening (19+): 0.2

    if (hourOfDay >= 9 && hourOfDay < 12) return 0.9;  // Best
    if (hourOfDay >= 14 && hourOfDay < 17) return 0.8; // Good
    if (hourOfDay >= 17 && hourOfDay < 19) return 0.5; // Okay
    if (hourOfDay >= 12 && hourOfDay < 14) return 0.4; // Lunch time
    if (hourOfDay >= 6 && hourOfDay < 9) return 0.3;   // Too early
    return 0.2; // Too late
  }

  /**
   * Score based on day of week
   */
  private scoreDayOfWeek(dayOfWeek: number): number {
    // General preferences
    // Monday: 0.6 (Monday blues)
    // Tuesday-Thursday: 0.9 (Best days)
    // Friday: 0.7 (Pre-weekend)
    // Weekend: 0.1 (Not ideal)

    if (dayOfWeek >= 2 && dayOfWeek <= 4) return 0.9; // Tue-Thu
    if (dayOfWeek === 5) return 0.7; // Friday
    if (dayOfWeek === 1) return 0.6; // Monday
    return 0.1; // Weekend
  }

  /**
   * Score based on historical success at this time
   */
  private scorePastSuccess(dayOfWeek: number, hourOfDay: number): number {
    if (!this.history || this.history.length === 0) {
      return 0.5; // Neutral if no history
    }

    // Filter history for similar times
    const similarSlots = this.history.filter(
      (h) => h.dayOfWeek === dayOfWeek && Math.abs(h.hourOfDay - hourOfDay) <= 1
    );

    if (similarSlots.length === 0) {
      return 0.5; // No data for this time
    }

    // Calculate success rate
    const successCount = similarSlots.filter((h) => h.successful).length;
    return successCount / similarSlots.length;
  }

  /**
   * Score based on participant satisfaction
   */
  private scoreParticipantSatisfaction(
    interviewers: Array<{ id: string; name: string; email: string }>
  ): number {
    if (!this.history || this.history.length === 0) {
      return 0.5;
    }

    // Find historical satisfaction for these interviewers
    let totalSatisfaction = 0;
    let count = 0;

    for (const interviewer of interviewers) {
      const interviewerHistory = this.history.filter((h) =>
        h.participants.includes(interviewer.email)
      );

      for (const record of interviewerHistory) {
        if (record.satisfaction) {
          totalSatisfaction += record.satisfaction / 5; // Normalize to 0-1
          count++;
        }
      }
    }

    return count > 0 ? totalSatisfaction / count : 0.5;
  }

  /**
   * Generate human-readable reasons for recommendation
   */
  private generateReasons(factors: ScoringFactors, slot: RawSlot): string[] {
    const reasons: string[] = [];

    // Preference match
    if (factors.preferenceMatch > 0.7) {
      reasons.push('Matches participant time preferences');
    }

    // Load balance
    if (factors.loadBalance > 0.7) {
      reasons.push('Good interviewer load distribution');
    }

    // Time of day
    if (factors.timeOfDay > 0.8) {
      reasons.push('Optimal time of day for interviews');
    }

    // Day of week
    if (factors.dayOfWeek > 0.8) {
      reasons.push('Preferred day of week');
    }

    // Past success
    if (factors.pastSuccess > 0.7) {
      reasons.push(`${(factors.pastSuccess * 100).toFixed(0)}% historical success rate`);
    }

    // Satisfaction
    if (factors.participantSatisfaction > 0.7) {
      reasons.push('High interviewer satisfaction history');
    }

    // If no strong reasons, add generic one
    if (reasons.length === 0) {
      reasons.push('Available slot with acceptable conditions');
    }

    return reasons;
  }

  /**
   * Update preferences and history for future recommendations
   */
  updateData(
    preferences?: SchedulingPreferences[],
    history?: SchedulingHistory[]
  ): void {
    if (preferences) {
      this.preferences = preferences;
    }
    if (history) {
      this.history = history;
    }
  }

  /**
   * Get recommendation explanation
   */
  explainRecommendation(recommendation: SmartSlotRecommendation): string {
    const parts: string[] = [];

    parts.push(`Score: ${(recommendation.score * 100).toFixed(0)}%`);
    parts.push(`Time: ${new Date(recommendation.startTime).toLocaleString()}`);
    parts.push(`Reasons: ${recommendation.reasons.join(', ')}`);

    return parts.join('\n');
  }
}
