/**
 * Preference Learning Engine
 *
 * Learns user scheduling preferences from historical data.
 *
 * Author: Ravindra Kanchikare (krhebbar)
 * License: MIT
 */

import {
  SchedulingPreferences,
  SchedulingHistory,
  AgentError,
} from '../types';

/**
 * Preference Learning Engine
 *
 * Analyzes historical scheduling data to learn and predict user preferences.
 * Uses statistical analysis and pattern recognition.
 */
export class PreferenceEngine {
  /**
   * Learn preferences from historical scheduling data
   */
  async learnPreferences(
    userId: string,
    history: SchedulingHistory[]
  ): Promise<SchedulingPreferences> {
    try {
      if (history.length === 0) {
        return this.getDefaultPreferences(userId);
      }

      // Analyze patterns
      const preferredDays = this.analyzePreferredDays(history);
      const preferredTimeRanges = this.analyzePreferredTimes(history);
      const avoidedTimes = this.analyzeAvoidedTimes(history);
      const preferredDuration = this.analyzePreferredDuration(history);
      const preferredBreak = this.analyzePreferredBreak(history);

      // Calculate confidence based on data volume
      const confidence = Math.min(history.length / 20, 1.0); // Confidence increases with more data

      return {
        userId,
        preferredDays,
        preferredTimeRanges,
        avoidedTimes,
        preferredBreakMinutes: preferredBreak,
        preferredDuration,
        confidence,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new AgentError(
        `Failed to learn preferences: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PREFERENCE_LEARNING_ERROR'
      );
    }
  }

  /**
   * Analyze preferred days of week
   */
  private analyzePreferredDays(history: SchedulingHistory[]): number[] {
    // Count frequency of each day
    const dayCounts: Record<number, number> = {};

    for (const record of history) {
      if (record.successful) {
        dayCounts[record.dayOfWeek] = (dayCounts[record.dayOfWeek] || 0) + 1;
      }
    }

    // Get days with above-average frequency
    const totalCount = Object.values(dayCounts).reduce((sum, count) => sum + count, 0);
    const averageCount = totalCount / 7;

    const preferredDays = Object.entries(dayCounts)
      .filter(([_, count]) => count > averageCount)
      .map(([day, _]) => parseInt(day))
      .sort();

    return preferredDays.length > 0 ? preferredDays : [1, 2, 3, 4]; // Default to Mon-Thu
  }

  /**
   * Analyze preferred time ranges
   */
  private analyzePreferredTimes(history: SchedulingHistory[]): Array<{ start: string; end: string }> {
    // Group by hour of day
    const hourCounts: Record<number, number> = {};

    for (const record of history) {
      if (record.successful) {
        hourCounts[record.hourOfDay] = (hourCounts[record.hourOfDay] || 0) + 1;
      }
    }

    // Find peak hours
    const sortedHours = Object.entries(hourCounts)
      .sort(([_, a], [__, b]) => b - a)
      .map(([hour, _]) => parseInt(hour));

    if (sortedHours.length === 0) {
      return [{ start: '09:00', end: '17:00' }]; // Default work hours
    }

    // Group consecutive hours into ranges
    const ranges: Array<{ start: string; end: string }> = [];
    let currentRange: number[] = [sortedHours[0]];

    for (let i = 1; i < sortedHours.length; i++) {
      if (sortedHours[i] === currentRange[currentRange.length - 1] + 1) {
        currentRange.push(sortedHours[i]);
      } else {
        ranges.push(this.formatTimeRange(currentRange));
        currentRange = [sortedHours[i]];
      }
    }

    if (currentRange.length > 0) {
      ranges.push(this.formatTimeRange(currentRange));
    }

    return ranges.slice(0, 3); // Top 3 time ranges
  }

  /**
   * Format hour array into time range
   */
  private formatTimeRange(hours: number[]): { start: string; end: string } {
    const start = Math.min(...hours);
    const end = Math.max(...hours) + 1; // End is exclusive

    return {
      start: `${start.toString().padStart(2, '0')}:00`,
      end: `${end.toString().padStart(2, '0')}:00`,
    };
  }

  /**
   * Analyze avoided times (frequently rescheduled or cancelled)
   */
  private analyzeAvoidedTimes(history: SchedulingHistory[]): Array<{
    dayOfWeek?: number;
    timeRange?: { start: string; end: string };
    reason?: string;
  }> {
    const avoided: Array<{
      dayOfWeek?: number;
      timeRange?: { start: string; end: string };
      reason?: string;
    }> = [];

    // Find days with high reschedule rate
    const dayRescheduleRates: Record<number, { total: number; rescheduled: number }> = {};

    for (const record of history) {
      const day = record.dayOfWeek;
      if (!dayRescheduleRates[day]) {
        dayRescheduleRates[day] = { total: 0, rescheduled: 0 };
      }

      dayRescheduleRates[day].total++;
      if (record.rescheduled) {
        dayRescheduleRates[day].rescheduled++;
      }
    }

    // Identify days with >40% reschedule rate
    for (const [day, stats] of Object.entries(dayRescheduleRates)) {
      const rate = stats.rescheduled / stats.total;
      if (rate > 0.4 && stats.total >= 3) {
        avoided.push({
          dayOfWeek: parseInt(day),
          reason: `High reschedule rate (${(rate * 100).toFixed(0)}%)`,
        });
      }
    }

    return avoided;
  }

  /**
   * Analyze preferred meeting duration
   */
  private analyzePreferredDuration(history: SchedulingHistory[]): number {
    if (history.length === 0) return 60;

    // Calculate mode (most common duration)
    const durationCounts: Record<number, number> = {};

    for (const record of history) {
      if (record.successful) {
        durationCounts[record.duration] = (durationCounts[record.duration] || 0) + 1;
      }
    }

    const sortedDurations = Object.entries(durationCounts)
      .sort(([_, a], [__, b]) => b - a);

    return sortedDurations.length > 0 ? parseInt(sortedDurations[0][0]) : 60;
  }

  /**
   * Analyze preferred break duration between meetings
   */
  private analyzePreferredBreak(history: SchedulingHistory[]): number {
    // This would require analyzing gaps between consecutive meetings
    // For now, return default
    return 15; // 15 minutes default
  }

  /**
   * Get default preferences for new users
   */
  private getDefaultPreferences(userId: string): SchedulingPreferences {
    return {
      userId,
      preferredDays: [1, 2, 3, 4], // Mon-Thu
      preferredTimeRanges: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '17:00' },
      ],
      preferredBreakMinutes: 15,
      maxInterviewsPerDay: 4,
      preferredDuration: 60,
      timezone: 'UTC',
      confidence: 0.3, // Low confidence for defaults
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Merge learned preferences with existing ones
   */
  mergePreferences(
    existing: SchedulingPreferences,
    learned: SchedulingPreferences
  ): SchedulingPreferences {
    // Prefer learned if confidence is higher
    if (learned.confidence && existing.confidence && learned.confidence > existing.confidence) {
      return learned;
    }

    // Otherwise, merge intelligently
    return {
      ...existing,
      preferredDays: learned.preferredDays || existing.preferredDays,
      preferredTimeRanges: learned.preferredTimeRanges || existing.preferredTimeRanges,
      preferredDuration: learned.preferredDuration || existing.preferredDuration,
      confidence: Math.max(learned.confidence || 0, existing.confidence || 0),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Check if a time slot matches user preferences
   */
  matchesPreferences(
    slotTime: Date,
    preferences: SchedulingPreferences
  ): { matches: boolean; score: number; reasons: string[] } {
    const dayOfWeek = slotTime.getDay();
    const hourOfDay = slotTime.getHours();
    const minuteOfDay = hourOfDay * 60 + slotTime.getMinutes();

    let score = 0;
    const reasons: string[] = [];

    // Check preferred days
    if (preferences.preferredDays && preferences.preferredDays.includes(dayOfWeek)) {
      score += 0.5;
      reasons.push('Matches preferred day');
    }

    // Check preferred time ranges
    if (preferences.preferredTimeRanges) {
      for (const range of preferences.preferredTimeRanges) {
        const startMinutes = this.timeToMinutes(range.start);
        const endMinutes = this.timeToMinutes(range.end);

        if (minuteOfDay >= startMinutes && minuteOfDay < endMinutes) {
          score += 0.5;
          reasons.push('Within preferred time range');
          break;
        }
      }
    }

    return {
      matches: score >= 0.5,
      score,
      reasons,
    };
  }

  /**
   * Convert time string (HH:MM) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
