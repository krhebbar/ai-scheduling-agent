/**
 * AI Scheduling Agent - Type Definitions
 *
 * Comprehensive types for the AI-powered scheduling agent system.
 *
 * Author: Ravindra Kanchikare (krhebber)
 * License: MIT
 */

/**
 * Scheduling intent types
 */
export type SchedulingIntent =
  | 'schedule'       // Create new interview/meeting
  | 'reschedule'     // Change existing interview time
  | 'cancel'         // Cancel interview
  | 'check_availability' // Query available time slots
  | 'get_details'    // Get interview information
  | 'modify'         // Modify interview details (not time)
  | 'unknown';       // Could not determine intent

/**
 * Entity types that can be extracted from natural language
 */
export interface ExtractedEntities {
  /** People mentioned (names, emails) */
  people?: string[];
  /** Interview/meeting type (technical, behavioral, panel, etc.) */
  interviewType?: string;
  /** Date/time information */
  datetime?: {
    date?: string;       // YYYY-MM-DD
    time?: string;       // HH:MM
    dateRange?: {
      start: string;
      end: string;
    };
    timeRange?: {
      start: string;     // morning, afternoon, evening, or HH:MM
      end?: string;
    };
    relative?: string;   // "next week", "tomorrow", "in 2 days"
  };
  /** Duration in minutes */
  duration?: number;
  /** Number of interviewers required */
  interviewerCount?: number;
  /** Timezone */
  timezone?: string;
  /** Meeting ID for reschedule/cancel operations */
  meetingId?: string;
  /** Location (virtual, office, specific room) */
  location?: string;
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Confidence scores for entity extraction
 */
export interface ConfidenceScores {
  intent: number;          // 0-1
  entities: {
    [key: string]: number; // Entity name → confidence score
  };
  overall: number;         // 0-1
}

/**
 * Natural language request parsed by NLU
 */
export interface ParsedRequest {
  /** Original user input */
  rawText: string;
  /** Detected intent */
  intent: SchedulingIntent;
  /** Extracted entities */
  entities: ExtractedEntities;
  /** Confidence scores */
  confidence: ConfidenceScores;
  /** Ambiguities or missing information */
  ambiguities?: string[];
  /** Suggested clarifications to ask user */
  clarifications?: string[];
}

/**
 * Time slot recommendation with AI scoring
 */
export interface SmartSlotRecommendation {
  /** Slot ID from scheduling engine */
  slotId: string;
  /** Start time (ISO 8601) */
  startTime: string;
  /** End time (ISO 8601) */
  endTime: string;
  /** Assigned interviewers */
  interviewers: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  /** AI confidence score (0-1) */
  score: number;
  /** Reasons for recommendation */
  reasons: string[];
  /** Factors considered */
  factors: {
    preferenceMatch?: number;    // Based on historical preferences
    loadBalance?: number;         // Interviewer load distribution
    timeOfDay?: number;           // Preferred time of day
    dayOfWeek?: number;           // Preferred day of week
    pastSuccess?: number;         // Similar slots success rate
    participantSatisfaction?: number; // Historical satisfaction
  };
  /** Alternative slots if this one is problematic */
  alternatives?: string[];
}

/**
 * Conflict resolution suggestion
 */
export interface ConflictResolution {
  /** Type of conflict */
  conflictType: 'double_booking' | 'load_exceeded' | 'outside_hours' | 'holiday' | 'preference_violation';
  /** Description of the conflict */
  description: string;
  /** Affected participants */
  affectedParticipants: string[];
  /** Suggested resolutions */
  suggestions: Array<{
    action: 'reschedule' | 'find_alternative' | 'reduce_duration' | 'change_participants';
    description: string;
    newSlot?: SmartSlotRecommendation;
    confidence: number;
  }>;
  /** Severity (1-5, 5 being critical) */
  severity: number;
}

/**
 * User/Interviewer preferences learned from history
 */
export interface SchedulingPreferences {
  userId: string;
  /** Preferred days of week (0 = Sunday, 6 = Saturday) */
  preferredDays?: number[];
  /** Preferred time ranges */
  preferredTimeRanges?: Array<{
    start: string; // HH:MM
    end: string;   // HH:MM
  }>;
  /** Avoided days/times */
  avoidedTimes?: Array<{
    dayOfWeek?: number;
    timeRange?: { start: string; end: string };
    reason?: string;
  }>;
  /** Preferred break duration between meetings */
  preferredBreakMinutes?: number;
  /** Max interviews per day */
  maxInterviewsPerDay?: number;
  /** Preferred meeting duration */
  preferredDuration?: number;
  /** Timezone preference */
  timezone?: string;
  /** Embedding vector for preference matching */
  preferenceEmbedding?: number[];
  /** Confidence in these preferences (0-1) */
  confidence?: number;
  /** Last updated timestamp */
  updatedAt?: string;
}

/**
 * Conversation context for multi-turn interactions
 */
export interface ConversationContext {
  /** Conversation ID */
  conversationId: string;
  /** User ID */
  userId: string;
  /** Conversation history */
  history: Array<{
    role: 'user' | 'agent';
    message: string;
    timestamp: string;
    intent?: SchedulingIntent;
    entities?: ExtractedEntities;
  }>;
  /** Current state */
  state: 'collecting_info' | 'recommending_slots' | 'confirming' | 'booking' | 'completed' | 'error';
  /** Partial scheduling request being built */
  pendingRequest?: {
    intent: SchedulingIntent;
    entities: ExtractedEntities;
    missingInfo: string[];
  };
  /** Metadata */
  metadata?: Record<string, any>;
  /** Started at */
  startedAt: string;
  /** Last updated */
  updatedAt: string;
}

/**
 * Agent response to user
 */
export interface AgentResponse {
  /** Response message to display */
  message: string;
  /** Recommended slots (if applicable) */
  recommendedSlots?: SmartSlotRecommendation[];
  /** Conflicts detected (if any) */
  conflicts?: ConflictResolution[];
  /** Follow-up questions */
  clarifications?: string[];
  /** Actions taken */
  actions?: Array<{
    type: 'slot_found' | 'booking_created' | 'rescheduled' | 'cancelled';
    details: Record<string, any>;
  }>;
  /** Confidence in response */
  confidence: number;
  /** Next steps for user */
  nextSteps?: string[];
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Scheduling agent configuration
 */
export interface AgentConfig {
  /** LLM provider config */
  llm: {
    provider: 'openai' | 'claude' | 'custom';
    apiKey: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
  /** Scheduling engine config */
  scheduling: {
    timezone: string;
    calendarProvider?: 'google' | 'outlook';
  };
  /** Vector search for preferences (optional) */
  vectorSearch?: {
    supabaseUrl: string;
    supabaseKey: string;
  };
  /** Preference learning settings */
  intelligence?: {
    enablePreferenceLearning: boolean;
    enableSmartRecommendations: boolean;
    minConfidenceThreshold: number;
  };
  /** Conversation settings */
  conversation?: {
    maxTurns: number;
    contextWindow: number;
    enableMultiTurn: boolean;
  };
}

/**
 * LLM provider interface
 */
export interface LLMProvider {
  name: string;
  /** Parse natural language into structured request */
  parseRequest(text: string, context?: ConversationContext): Promise<ParsedRequest>;
  /** Generate natural language response */
  generateResponse(request: ParsedRequest, data: any): Promise<string>;
  /** Extract entities with confidence scores */
  extractEntities(text: string): Promise<{ entities: ExtractedEntities; confidence: ConfidenceScores }>;
  /** Classify intent */
  classifyIntent(text: string): Promise<{ intent: SchedulingIntent; confidence: number }>;
}

/**
 * Scheduling request for the engine
 */
export interface SchedulingRequest {
  /** Request type */
  type: 'schedule' | 'reschedule' | 'cancel';
  /** Interview sessions */
  sessions?: Array<{
    name: string;
    duration: number;
    requiredInterviewers: number;
  }>;
  /** Available interviewers */
  interviewers?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  /** Date range to search */
  dateRange?: {
    start: string;
    end: string;
  };
  /** Candidate information */
  candidate?: {
    name: string;
    email: string;
    timezone?: string;
  };
  /** Existing meeting ID (for reschedule/cancel) */
  meetingId?: string;
  /** Preferences to consider */
  preferences?: SchedulingPreferences[];
}

/**
 * Historical scheduling data for preference learning
 */
export interface SchedulingHistory {
  /** Meeting ID */
  meetingId: string;
  /** Participants */
  participants: string[];
  /** Scheduled time */
  scheduledTime: string;
  /** Duration */
  duration: number;
  /** Day of week (0-6) */
  dayOfWeek: number;
  /** Hour of day (0-23) */
  hourOfDay: number;
  /** Was the meeting successful? */
  successful: boolean;
  /** Participant satisfaction (if available) */
  satisfaction?: number;
  /** Booking lead time (days before meeting) */
  leadTime?: number;
  /** Any rescheduling? */
  rescheduled?: boolean;
  /** Metadata */
  metadata?: Record<string, any>;
  /** Created at */
  createdAt: string;
}

/**
 * Error types
 */
export class AgentError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class NLUError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalText?: string
  ) {
    super(message);
    this.name = 'NLUError';
  }
}

export class SchedulingEngineError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'SchedulingEngineError';
  }
}

/**
 * Prompt template for LLM
 */
export interface PromptTemplate {
  name: string;
  template: string;
  variables: string[];
  examples?: Array<{
    input: string;
    output: string;
  }>;
}

/**
 * Batch scheduling request
 */
export interface BatchSchedulingRequest {
  requests: SchedulingRequest[];
  batchSize?: number;
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Slot finder options with AI enhancement
 */
export interface SmartSlotFinderOptions {
  /** Basic scheduling request */
  request: SchedulingRequest;
  /** Enable AI recommendations */
  enableSmartRecommendations?: boolean;
  /** Number of top recommendations */
  topN?: number;
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Consider historical preferences */
  usePreferences?: boolean;
  /** Preference weight (0-1) */
  preferenceWeight?: number;
}
