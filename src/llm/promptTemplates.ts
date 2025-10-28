/**
 * LLM Prompt Templates
 *
 * Optimized prompts for scheduling agent natural language understanding
 * and response generation.
 *
 * Author: Ravindra Kanchikare (krhebbar)
 * License: MIT
 */

import { PromptTemplate } from '../types';

/**
 * Intent classification prompt
 */
export const INTENT_CLASSIFICATION_PROMPT: PromptTemplate = {
  name: 'intent_classification',
  template: `You are an expert at understanding scheduling requests.

Classify the user's intent into one of these categories:
- schedule: User wants to create a new interview or meeting
- reschedule: User wants to change an existing interview time
- cancel: User wants to cancel an interview
- check_availability: User wants to know available time slots
- get_details: User wants information about an existing interview
- modify: User wants to change interview details (not the time)
- unknown: Intent is unclear

User message: "{{userMessage}}"

{{#if conversationContext}}
Previous context:
{{conversationContext}}
{{/if}}

Respond with a JSON object:
{
  "intent": "<intent_category>",
  "confidence": <0.0-1.0>,
  "reasoning": "<brief explanation>"
}`,
  variables: ['userMessage', 'conversationContext'],
  examples: [
    {
      input: 'Schedule a technical interview with John next Tuesday',
      output: '{"intent": "schedule", "confidence": 0.95, "reasoning": "Clear request to create new interview with specific person and date"}',
    },
    {
      input: 'Can we move the interview to Wednesday?',
      output: '{"intent": "reschedule", "confidence": 0.90, "reasoning": "Request to change time of existing interview"}',
    },
  ],
};

/**
 * Entity extraction prompt
 */
export const ENTITY_EXTRACTION_PROMPT: PromptTemplate = {
  name: 'entity_extraction',
  template: `You are an expert at extracting scheduling information from natural language.

Extract the following entities from the user's message:
- people: Names or email addresses mentioned
- interviewType: Type of interview (technical, behavioral, panel, system design, etc.)
- datetime: Date and time information
  - date: Specific date in YYYY-MM-DD format
  - time: Specific time in HH:MM format
  - dateRange: Start and end dates
  - timeRange: Start and end times or time of day (morning, afternoon, evening)
  - relative: Relative time expressions ("tomorrow", "next week", "in 2 days")
- duration: Meeting duration in minutes
- interviewerCount: Number of interviewers needed
- timezone: Timezone mentioned
- meetingId: Interview or meeting ID (for reschedule/cancel)
- location: Meeting location (virtual, office, room name)

User message: "{{userMessage}}"
Current date: {{currentDate}}
Current time: {{currentTime}}
Default timezone: {{defaultTimezone}}

{{#if conversationContext}}
Previous context:
{{conversationContext}}
{{/if}}

Respond with a JSON object containing extracted entities and confidence scores:
{
  "entities": {
    "people": ["name1", "email@example.com"],
    "interviewType": "technical",
    "datetime": {
      "date": "2024-02-06",
      "time": "14:00",
      "relative": "next Tuesday"
    },
    "duration": 60
  },
  "confidence": {
    "people": 0.95,
    "interviewType": 0.90,
    "datetime": 0.85,
    "overall": 0.90
  },
  "ambiguities": ["Time zone not specified, assuming UTC"],
  "clarifications": ["Would you like to specify a time?"]
}

Rules:
- Convert relative dates to absolute dates based on current date
- Default to 60 minutes if duration not specified
- Mark ambiguous entities with lower confidence
- Suggest clarifications for missing critical information`,
  variables: ['userMessage', 'currentDate', 'currentTime', 'defaultTimezone', 'conversationContext'],
  examples: [
    {
      input: 'Schedule a technical interview with alice@company.com next Tuesday at 2pm for 90 minutes',
      output: `{
  "entities": {
    "people": ["alice@company.com"],
    "interviewType": "technical",
    "datetime": {"date": "2024-02-06", "time": "14:00"},
    "duration": 90
  },
  "confidence": {"people": 1.0, "interviewType": 0.95, "datetime": 0.90, "duration": 0.95, "overall": 0.95}
}`,
    },
  ],
};

/**
 * Response generation prompt
 */
export const RESPONSE_GENERATION_PROMPT: PromptTemplate = {
  name: 'response_generation',
  template: `You are a friendly and professional scheduling assistant.

Generate a natural, conversational response based on the context below.

User request: "{{userMessage}}"
Detected intent: {{intent}}
Extracted entities: {{entities}}

{{#if recommendedSlots}}
Recommended time slots:
{{#each recommendedSlots}}
{{@index}}. {{this.startTime}} - {{this.endTime}} ({{this.score}} confidence)
   Interviewers: {{join this.interviewers.name ", "}}
   Reasons: {{join this.reasons ", "}}
{{/each}}
{{/if}}

{{#if conflicts}}
Conflicts detected:
{{#each conflicts}}
- {{this.description}} ({{this.severity}}/5 severity)
  Suggestions: {{join this.suggestions.description ", "}}
{{/each}}
{{/if}}

{{#if clarifications}}
Missing information: {{join clarifications ", "}}
{{/if}}

Generate a response that:
1. Confirms what you understood from the user
2. Presents recommendations clearly with reasoning
3. Asks for clarification if needed
4. Maintains a professional but friendly tone
5. Provides clear next steps

Response:`,
  variables: ['userMessage', 'intent', 'entities', 'recommendedSlots', 'conflicts', 'clarifications'],
};

/**
 * Slot recommendation prompt
 */
export const SLOT_RECOMMENDATION_PROMPT: PromptTemplate = {
  name: 'slot_recommendation',
  template: `You are an AI that recommends optimal interview time slots.

Available slots from scheduling engine:
{{#each availableSlots}}
{{@index}}. {{this.startTime}} - {{this.endTime}}
   Interviewers: {{join this.interviewers ", "}}
   Load: {{this.loadInfo}}
{{/each}}

Historical preferences:
{{#if preferences}}
{{#each preferences}}
- {{this.userId}}: Prefers {{join this.preferredDays ", "}} at {{join this.preferredTimeRanges ", "}}
{{/each}}
{{/if}}

Historical data:
- Similar interviews scheduled: {{historicalData.count}}
- Success rate by day: {{historicalData.successByDay}}
- Success rate by time: {{historicalData.successByTime}}
- Average satisfaction: {{historicalData.avgSatisfaction}}

Rank the slots from best to worst, considering:
1. Participant preferences (40% weight)
2. Interviewer load balance (25% weight)
3. Time of day preferences (15% weight)
4. Historical success rate (15% weight)
5. Day of week preferences (5% weight)

For each slot, provide:
{
  "slotId": "slot-123",
  "score": 0.0-1.0,
  "reasons": ["matches preferred time", "balanced load"],
  "factors": {
    "preferenceMatch": 0.85,
    "loadBalance": 0.90,
    "timeOfDay": 0.75,
    "pastSuccess": 0.80
  }
}

Return top {{topN}} recommendations as JSON array.`,
  variables: ['availableSlots', 'preferences', 'historicalData', 'topN'],
};

/**
 * Conflict resolution prompt
 */
export const CONFLICT_RESOLUTION_PROMPT: PromptTemplate = {
  name: 'conflict_resolution',
  template: `You are an expert at resolving scheduling conflicts.

Conflict details:
{{#each conflicts}}
Type: {{this.type}}
Description: {{this.description}}
Affected: {{join this.affectedParticipants ", "}}
Severity: {{this.severity}}/5
{{/each}}

Original request:
Intent: {{intent}}
Requested: {{requestedTime}}
Duration: {{duration}} minutes
Participants: {{join participants ", "}}

Available alternatives:
{{#each alternatives}}
{{@index}}. {{this.startTime}} - {{this.endTime}}
   Interviewers: {{join this.interviewers ", "}}
   Conflicts: {{this.conflictCount}}
{{/each}}

Suggest the best resolution strategy:
1. Analyze the severity and type of conflicts
2. Propose specific actions (reschedule, find alternative, reduce duration, change participants)
3. Rank alternative slots
4. Explain trade-offs

Response format:
{
  "recommendedAction": "reschedule | find_alternative | reduce_duration | change_participants",
  "suggestions": [
    {
      "action": "...",
      "description": "...",
      "newSlot": {...},
      "confidence": 0.0-1.0,
      "tradeoffs": ["...", "..."]
    }
  ],
  "reasoning": "..."
}`,
  variables: ['conflicts', 'intent', 'requestedTime', 'duration', 'participants', 'alternatives'],
};

/**
 * Multi-turn conversation prompt
 */
export const CONVERSATION_PROMPT: PromptTemplate = {
  name: 'conversation',
  template: `You are a scheduling assistant having a multi-turn conversation.

Conversation history:
{{#each conversationHistory}}
{{this.role}}: {{this.message}}
{{/each}}

Current state: {{currentState}}

{{#if pendingRequest}}
Pending request:
Intent: {{pendingRequest.intent}}
Collected: {{json pendingRequest.entities}}
Missing: {{join pendingRequest.missingInfo ", "}}
{{/if}}

User's latest message: "{{latestMessage}}"

Tasks:
1. Understand the message in the context of the conversation
2. Update the pending request with new information
3. Determine what's still missing
4. Generate appropriate response

Rules:
- Remember context from previous turns
- Ask follow-up questions naturally
- Confirm understanding before taking action
- Be concise but friendly

Response:
{
  "updatedEntities": {...},
  "stillMissing": [...],
  "nextState": "collecting_info | recommending_slots | confirming | booking | completed",
  "message": "your natural language response"
}`,
  variables: ['conversationHistory', 'currentState', 'pendingRequest', 'latestMessage'],
};

/**
 * Preference learning prompt
 */
export const PREFERENCE_LEARNING_PROMPT: PromptTemplate = {
  name: 'preference_learning',
  template: `You are an AI that learns scheduling preferences from historical data.

User: {{userId}}

Historical scheduling data (last {{historyCount}} meetings):
{{#each schedulingHistory}}
{{@index}}. {{this.scheduledTime}} ({{this.dayOfWeek}}, {{this.hourOfDay}}:00)
   Duration: {{this.duration}}min
   Success: {{this.successful}}
   {{#if this.satisfaction}}Satisfaction: {{this.satisfaction}}/5{{/if}}
   {{#if this.rescheduled}}(was rescheduled){{/if}}
{{/each}}

Analyze the data and extract preferences:
1. Preferred days of week (based on frequency and success rate)
2. Preferred time ranges (based on booking patterns)
3. Avoided times (based on cancellations/rescheduling)
4. Preferred meeting duration
5. Preferred break duration between meetings
6. Any other patterns

Return:
{
  "preferredDays": [1, 2, 4],  // Monday, Tuesday, Thursday
  "preferredTimeRanges": [
    {"start": "09:00", "end": "11:00"},
    {"start": "14:00", "end": "16:00"}
  ],
  "avoidedTimes": [
    {"dayOfWeek": 5, "reason": "High reschedule rate"}
  ],
  "preferredDuration": 60,
  "preferredBreakMinutes": 15,
  "confidence": 0.0-1.0,
  "reasoning": "..."
}`,
  variables: ['userId', 'historyCount', 'schedulingHistory'],
};

/**
 * Function calling schema for OpenAI
 */
export const FUNCTION_SCHEMAS = {
  parseSchedulingRequest: {
    name: 'parseSchedulingRequest',
    description: 'Parse a natural language scheduling request and extract structured information',
    parameters: {
      type: 'object',
      properties: {
        intent: {
          type: 'string',
          enum: ['schedule', 'reschedule', 'cancel', 'check_availability', 'get_details', 'modify', 'unknown'],
          description: 'The scheduling intent',
        },
        entities: {
          type: 'object',
          properties: {
            people: {
              type: 'array',
              items: { type: 'string' },
              description: 'Names or emails of people involved',
            },
            interviewType: {
              type: 'string',
              description: 'Type of interview (technical, behavioral, etc.)',
            },
            datetime: {
              type: 'object',
              properties: {
                date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
                time: { type: 'string', description: 'Time in HH:MM format' },
                relative: { type: 'string', description: 'Relative time expression' },
              },
            },
            duration: { type: 'number', description: 'Duration in minutes' },
            interviewerCount: { type: 'number', description: 'Number of interviewers needed' },
          },
        },
        confidence: {
          type: 'number',
          description: 'Confidence score 0-1',
        },
        ambiguities: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of ambiguous or unclear aspects',
        },
        clarifications: {
          type: 'array',
          items: { type: 'string' },
          description: 'Suggested questions to clarify',
        },
      },
      required: ['intent', 'entities', 'confidence'],
    },
  },

  recommendSlots: {
    name: 'recommendSlots',
    description: 'Recommend optimal time slots based on preferences and historical data',
    parameters: {
      type: 'object',
      properties: {
        rankings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slotId: { type: 'string' },
              score: { type: 'number', description: 'Score 0-1' },
              reasons: {
                type: 'array',
                items: { type: 'string' },
                description: 'Reasons for recommendation',
              },
              factors: {
                type: 'object',
                description: 'Individual factor scores',
              },
            },
            required: ['slotId', 'score', 'reasons'],
          },
        },
      },
      required: ['rankings'],
    },
  },
};

/**
 * Helper to fill template variables
 */
export function fillTemplate(template: string, variables: Record<string, any>): string {
  let result = template;

  // Simple variable replacement
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value ?? ''));
  }

  // Handle conditionals {{#if var}}...{{/if}}
  result = result.replace(/{{#if (\w+)}}(.*?){{\/if}}/gs, (_, varName, content) => {
    return variables[varName] ? content : '';
  });

  // Handle loops {{#each array}}...{{/each}}
  result = result.replace(/{{#each (\w+)}}(.*?){{\/each}}/gs, (_, varName, content) => {
    const array = variables[varName];
    if (!Array.isArray(array)) return '';

    return array
      .map((item, index) => {
        let itemContent = content;
        itemContent = itemContent.replace(/{{@index}}/g, String(index + 1));
        itemContent = itemContent.replace(/{{this\.(\w+)}}/g, (__, prop) => String(item[prop] ?? ''));
        return itemContent;
      })
      .join('\n');
  });

  return result;
}
