/**
 * Scheduling Engine Adapter
 *
 * Integration adapter for interview-scheduling-engine.
 * Wraps the scheduling engine with agent-friendly interface.
 *
 * Author: Ravindra Kanchikare (krhebbar)
 * License: MIT
 */

import {
  SchedulingRequest,
  ExtractedEntities,
  AgentError,
  SchedulingEngineError,
} from '../types';

/**
 * Scheduling engine mock interface
 * In production, this would import from 'interview-scheduling-engine'
 */
interface SchedulingEngine {
  findSlots(options: any): Promise<any[]>;
  bookSlot(options: any): Promise<any>;
  cancelSlot(slotId: string): Promise<void>;
  verifySlot(slotId: string): Promise<boolean>;
}

/**
 * Slot result from scheduling engine
 */
export interface EngineSlot {
  id: string;
  startTime: string;
  endTime: string;
  interviewers: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  sessions: Array<{
    name: string;
    duration: number;
  }>;
  loadInfo?: {
    currentLoad: number;
    maxLoad: number;
  };
}

/**
 * Scheduling Adapter
 *
 * Adapts AI agent requests to interview-scheduling-engine API.
 * Handles entity mapping and response transformation.
 */
export class SchedulingAdapter {
  constructor(
    private schedulingEngine?: SchedulingEngine,
    private defaultTimezone: string = 'UTC'
  ) {}

  /**
   * Find available slots based on extracted entities
   */
  async findSlots(entities: ExtractedEntities): Promise<EngineSlot[]> {
    try {
      // Transform entities to scheduling engine format
      const options = this.entitiesToEngineOptions(entities);

      // For now, return mock data (in production, call actual engine)
      if (this.schedulingEngine) {
        const slots = await this.schedulingEngine.findSlots(options);
        return this.transformEngineSlots(slots);
      }

      // Mock response for demonstration
      return this.getMockSlots(entities);
    } catch (error) {
      throw new SchedulingEngineError(
        `Failed to find slots: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FIND_SLOTS_ERROR'
      );
    }
  }

  /**
   * Book a specific slot
   */
  async bookSlot(
    slotId: string,
    candidateInfo: { name: string; email: string }
  ): Promise<{
    success: boolean;
    meetingId?: string;
    calendarLinks?: string[];
  }> {
    try {
      if (this.schedulingEngine) {
        const result = await this.schedulingEngine.bookSlot({
          slotId,
          candidateEmail: candidateInfo.email,
          candidateName: candidateInfo.name,
          createCalendarEvents: true,
          sendNotifications: true,
        });

        return {
          success: true,
          meetingId: result.id,
          calendarLinks: result.calendarLinks,
        };
      }

      // Mock booking
      return {
        success: true,
        meetingId: `meeting-${Date.now()}`,
        calendarLinks: ['https://meet.google.com/abc-defg-hij'],
      };
    } catch (error) {
      throw new SchedulingEngineError(
        `Failed to book slot: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BOOK_SLOT_ERROR'
      );
    }
  }

  /**
   * Cancel a scheduled interview
   */
  async cancelSlot(meetingId: string): Promise<void> {
    try {
      if (this.schedulingEngine) {
        await this.schedulingEngine.cancelSlot(meetingId);
        return;
      }

      // Mock cancellation
      console.log(`Cancelled meeting: ${meetingId}`);
    } catch (error) {
      throw new SchedulingEngineError(
        `Failed to cancel slot: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CANCEL_SLOT_ERROR'
      );
    }
  }

  /**
   * Verify a slot is still available
   */
  async verifySlot(slotId: string): Promise<boolean> {
    try {
      if (this.schedulingEngine) {
        return await this.schedulingEngine.verifySlot(slotId);
      }

      // Mock verification (always available)
      return true;
    } catch (error) {
      throw new SchedulingEngineError(
        `Failed to verify slot: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'VERIFY_SLOT_ERROR'
      );
    }
  }

  /**
   * Transform extracted entities to scheduling engine options
   */
  private entitiesToEngineOptions(entities: ExtractedEntities): any {
    const options: any = {
      sessions: [],
      interviewers: [],
      dateRange: {},
      timezone: entities.timezone || this.defaultTimezone,
    };

    // Build sessions from entities
    if (entities.interviewType) {
      options.sessions.push({
        name: entities.interviewType,
        duration: entities.duration || 60,
        requiredInterviewers: entities.interviewerCount || 1,
      });
    }

    // Build date range
    if (entities.datetime?.date) {
      const startDate = new Date(entities.datetime.date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14); // 2-week window

      options.dateRange = {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      };
    }

    // Add interviewers if specified
    if (entities.people) {
      options.interviewers = entities.people.map((person, index) => ({
        id: `interviewer-${index}`,
        name: person.split('@')[0], // Extract name from email
        email: person,
      }));
    }

    return options;
  }

  /**
   * Transform scheduling engine slots to adapter format
   */
  private transformEngineSlots(slots: any[]): EngineSlot[] {
    return slots.map((slot) => ({
      id: slot.id || `slot-${Date.now()}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      interviewers: slot.interviewers || [],
      sessions: slot.sessions || [],
      loadInfo: slot.loadInfo,
    }));
  }

  /**
   * Generate mock slots for demonstration
   */
  private getMockSlots(entities: ExtractedEntities): EngineSlot[] {
    const baseDate = entities.datetime?.date
      ? new Date(entities.datetime.date)
      : new Date();

    const duration = entities.duration || 60;
    const slots: EngineSlot[] = [];

    // Generate 5 mock slots over the next week
    for (let i = 0; i < 5; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);

      // Set to 2 PM
      date.setHours(14, 0, 0, 0);

      const endTime = new Date(date);
      endTime.setMinutes(endTime.getMinutes() + duration);

      slots.push({
        id: `slot-${i + 1}`,
        startTime: date.toISOString(),
        endTime: endTime.toISOString(),
        interviewers: [
          {
            id: `int-${i + 1}`,
            name: `Interviewer ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
            email: `interviewer${i + 1}@company.com`,
          },
        ],
        sessions: [
          {
            name: entities.interviewType || 'Technical Interview',
            duration,
          },
        ],
        loadInfo: {
          currentLoad: i * 2, // Increasing load
          maxLoad: 10,
        },
      });
    }

    return slots;
  }

  /**
   * Set scheduling engine instance (for production use)
   */
  setEngine(engine: SchedulingEngine): void {
    this.schedulingEngine = engine;
  }

  /**
   * Check if scheduling engine is configured
   */
  isEngineConfigured(): boolean {
    return !!this.schedulingEngine;
  }
}
