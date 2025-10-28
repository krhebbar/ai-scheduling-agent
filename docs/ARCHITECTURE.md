# Architecture Documentation

This document provides a technical overview of the AI Scheduling Agent architecture, design decisions, and implementation details.

## System Overview

The AI Scheduling Agent is an intelligent meeting scheduler that combines natural language understanding with production-tested scheduling algorithms. It adds an AI layer on top of constraint-based scheduling to enable conversational interactions and smart recommendations.

### Design Principles

1. **Separation of Concerns** - NLU, intelligence, and scheduling are separate modules
2. **Extensibility** - Pluggable LLM providers and scheduling engines
3. **Type Safety** - Comprehensive TypeScript types throughout
4. **Production-Ready** - Built on proven scheduling algorithms
5. **Developer-Friendly** - Clean APIs and extensive documentation

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  (Chat, Slack, API, CLI - integrations use SchedulingAgent)      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SchedulingAgent                              │
│  • processMessage()  • bookSlot()  • learnPreferences()          │
│  Orchestrates: NLU → Intelligence → Scheduling → Response        │
└──┬──────────┬────────────┬─────────────┬────────────────────────┘
   │          │            │             │
   ▼          ▼            ▼             ▼
┌────────┐ ┌─────────┐ ┌────────────┐ ┌──────────────┐
│  NLU   │ │Intelligence│ │Integration│ │     LLM      │
│        │ │            │ │           │ │              │
│ Intent │ │   Slot    │ │ Scheduling│ │   OpenAI     │
│Recogn. │ │Recommender│ │  Adapter  │ │   Provider   │
│        │ │           │ │           │ │              │
│Entity  │ │ Conflict  │ │           │ │   Prompt     │
│Extract.│ │ Resolver  │ │           │ │  Templates   │
│        │ │           │ │           │ │              │
│Request │ │Preference │ │           │ │              │
│Parser  │ │  Engine   │ │           │ │              │
└────────┘ └─────────┘ └─────┬──────┘ └──────────────┘
                             │
                             ▼
                   ┌────────────────────┐
                   │ Scheduling Engine  │
                   │ (interview-        │
                   │  scheduling-engine)│
                   └────────────────────┘
```

## Component Details

### 1. Natural Language Understanding (NLU)

**Location:** `src/nlu/`

**Responsibilities:**
- Parse natural language into structured data
- Recognize user intents (schedule, reschedule, cancel, etc.)
- Extract entities (people, dates, times, meeting types)
- Handle ambiguous or incomplete requests

**Key Classes:**

#### `IntentRecognizer`
Classifies user messages into scheduling intents.

```typescript
const result = await intentRecognizer.recognize(
  "Schedule interview with Alice next Tuesday"
);
// { intent: 'schedule', confidence: 0.95 }
```

**Implementation:** Uses LLM with optimized prompt template for classification.

#### `EntityExtractor`
Extracts structured entities from natural language.

```typescript
const result = await entityExtractor.extract(
  "Technical interview with bob@company.com at 2pm"
);
// {
//   entities: {
//     people: ['bob@company.com'],
//     interviewType: 'technical',
//     datetime: { time: '14:00' }
//   },
//   confidence: { overall: 0.89 }
// }
```

**Features:**
- Relative date conversion ("next Tuesday" → "2024-02-06")
- Time normalization ("2pm" → "14:00")
- Default inference (technical interview → 60 minutes)

#### `RequestParser`
Combines intent and entities into complete parsed request.

```typescript
const parsed = await requestParser.parse(message, context);
// Returns: ParsedRequest with intent, entities, confidence, clarifications
```

### 2. Intelligence Layer

**Location:** `src/intelligence/`

**Responsibilities:**
- Score and rank available time slots
- Learn user preferences from historical data
- Detect and resolve scheduling conflicts
- Provide reasoning for recommendations

#### `SlotRecommender`

ML-powered slot recommendation using weighted scoring.

**Scoring Algorithm:**
```
score = (0.30 × preferenceMatch) +
        (0.25 × loadBalance) +
        (0.15 × timeOfDay) +
        (0.15 × pastSuccess) +
        (0.10 × dayOfWeek) +
        (0.05 × participantSatisfaction)
```

**Implementation:**
```typescript
const recommendations = await slotRecommender.recommend(availableSlots, 5);
// Returns: Top 5 slots with scores, reasons, and factor breakdowns
```

#### `ConflictResolver`

Intelligent conflict detection and resolution.

**Conflict Types:**
1. Double-booking (severity: 5/5)
2. Load exceeded (severity: 4/5)
3. Outside work hours (severity: 3/5)
4. Holiday (severity: 3/5)
5. Preference violation (severity: 2/5)

**Resolution Strategy:**
```typescript
const resolutions = await conflictResolver.resolve(conflicts);
// For each conflict, provides 2-3 resolution suggestions with:
// - Action type (reschedule, find_alternative, etc.)
// - Alternative slots
// - Confidence scores
// - Trade-off analysis
```

#### `PreferenceEngine`

Learns scheduling preferences from historical data.

**Learning Algorithm:**
```typescript
const preferences = await preferenceEngine.learnPreferences(userId, history);
// Analyzes:
// - Preferred days of week (frequency + success rate)
// - Preferred time ranges (peak booking hours)
// - Avoided times (high reschedule rate)
// - Typical meeting duration
```

**Pattern Recognition:**
- Day-of-week preferences (e.g., 70% of meetings on Tue-Thu)
- Time-of-day patterns (e.g., 85% between 10 AM - 4 PM)
- Success indicators (completion rate, satisfaction scores)

### 3. LLM Integration

**Location:** `src/llm/`

**Responsibilities:**
- Communicate with LLM providers (OpenAI, etc.)
- Manage prompt templates
- Parse LLM responses
- Handle errors and retries

#### `OpenAILLMProvider`

GPT-4 integration for natural language understanding.

**Features:**
- Function calling for structured outputs
- JSON mode for reliable parsing
- Configurable temperature and max tokens
- Retry logic for transient failures

**Prompt Templates:**

All prompts are optimized for:
- Token efficiency (shorter = cheaper)
- Clear instructions (better accuracy)
- Structured output (easier parsing)
- Few-shot examples (improved performance)

Key prompts:
1. `INTENT_CLASSIFICATION_PROMPT` - Classify user intent
2. `ENTITY_EXTRACTION_PROMPT` - Extract scheduling entities
3. `RESPONSE_GENERATION_PROMPT` - Generate natural responses
4. `SLOT_RECOMMENDATION_PROMPT` - ML-powered slot ranking
5. `CONFLICT_RESOLUTION_PROMPT` - Resolve conflicts
6. `CONVERSATION_PROMPT` - Multi-turn context handling
7. `PREFERENCE_LEARNING_PROMPT` - Learn from history

**Template System:**
```typescript
const filled = fillTemplate(PROMPT.template, {
  userMessage: "...",
  currentDate: "2024-02-05",
  // ...
});
```

### 4. Integration Layer

**Location:** `src/integration/`

**Responsibilities:**
- Adapt agent requests to scheduling engine API
- Transform responses to agent format
- Handle external system errors

#### `SchedulingAdapter`

Bridges AI agent and interview-scheduling-engine.

**Transformation:**
```
Natural Language → Entities → Engine Options → Slots → Recommendations
```

**Features:**
- Entity-to-options mapping
- Mock mode for testing (returns sample slots)
- Production mode (connects to real scheduling engine)
- Error translation

### 5. Core Agent

**Location:** `src/agent/`

#### `SchedulingAgent`

Main orchestrator that ties everything together.

**Workflow:**
```
1. Receive message
2. Get/create conversation context
3. Parse message (NLU)
4. Update conversation history
5. Handle intent:
   - schedule → find slots → recommend → respond
   - reschedule → find alternatives → suggest
   - cancel → confirm → execute
6. Return response
```

**State Management:**
```typescript
class SchedulingAgent {
  private activeConversations: Map<string, ConversationContext>;
  private userPreferences: Map<string, SchedulingPreferences>;
  private schedulingHistory: Map<string, SchedulingHistory[]>;
  // ...
}
```

## Data Flow

### Example: Schedule Interview Request

```
1. User Input:
   "Schedule a technical interview with alice@company.com next Tuesday at 2pm"

2. NLU Processing:
   Intent: schedule (confidence: 0.95)
   Entities: {
     people: ['alice@company.com'],
     interviewType: 'technical',
     datetime: { date: '2024-02-06', time: '14:00' },
     duration: 60 (inferred)
   }

3. Scheduling Integration:
   → Transform to engine options
   → Find available slots
   ← Return 10 matching slots

4. Intelligence Layer:
   → Score each slot (6 factors)
   → Rank by score
   ← Return top 5 recommendations

5. Response Generation:
   → LLM generates natural language
   ← "I found 5 available slots..."

6. User Response:
   message: "I found 5 available slots...",
   recommendedSlots: [ ... ],
   confidence: 0.89
```

## Performance Optimization

### Caching Strategy

1. **Conversation Context** - In-memory for active sessions
2. **User Preferences** - Cached after learning
3. **LLM Responses** - No caching (dynamic responses)

### API Call Optimization

**Per Message:**
- 1-2 OpenAI API calls (depending on complexity)
- Average latency: 300-700ms

**Optimization Techniques:**
- Use `gpt-3.5-turbo` for faster responses (100-200ms)
- Batch entity extraction when possible
- Parallel API calls where independent

### Token Usage

**Typical Request:**
- Input tokens: 200-500 (prompt + context)
- Output tokens: 100-300 (response)
- Total: ~400-800 tokens per interaction

**Cost Estimate (GPT-4):**
- ~$0.01-0.02 per conversation turn
- ~$0.50-1.00 for 50 message session

## Scalability Considerations

### Horizontal Scaling

- Stateless design (conversation state in external store)
- LLM providers handle load
- Each user session independent

### Vertical Scaling

- In-memory caches scale with user count
- Consider Redis for distributed caching
- Database for persistent preference storage

## Security

### Data Privacy

- User messages processed by OpenAI (per their policy)
- No persistent storage of messages (unless you implement it)
- API keys stored securely (environment variables)

### Best Practices

1. **Rate Limiting** - Prevent abuse
2. **Input Validation** - Sanitize user input
3. **Error Handling** - Don't leak sensitive info in errors
4. **Audit Logging** - Track who scheduled what

## Extensibility

### Adding New LLM Provider

1. Implement `LLMProvider` interface
2. Add provider file in `src/llm/providers/`
3. Export from module
4. Update agent config

### Custom Intent Types

1. Add to `SchedulingIntent` type
2. Update prompts
3. Add handler in agent
4. Test and document

### Custom Scoring Factors

1. Add to `ScoringFactors` interface
2. Implement scoring function
3. Add to weighted combination
4. Document weights

## Testing Strategy

### Unit Testing

- NLU components (mocked LLM)
- Intelligence algorithms (deterministic)
- Utility functions

### Integration Testing

- Full agent workflow
- Multi-turn conversations
- Error scenarios

### E2E Testing

- Real OpenAI API calls
- Complete user journeys
- Performance benchmarks

## Deployment

### Environment Variables

```bash
OPENAI_API_KEY=sk-...
SCHEDULING_TIMEZONE=America/New_York
MIN_CONFIDENCE_THRESHOLD=0.7
```

### Production Checklist

- [ ] Set production API keys
- [ ] Configure error monitoring
- [ ] Set up logging
- [ ] Enable rate limiting
- [ ] Cache configuration
- [ ] Load testing
- [ ] Security audit

## Future Enhancements

1. **Vector Embeddings** - Use Supabase vector search for preference matching
2. **Multi-Language** - Support non-English languages
3. **Voice Interface** - Speech-to-text integration
4. **Analytics** - Track usage patterns and improvements
5. **A/B Testing** - Compare prompt variations

---

**Last Updated:** 2025-01-28
**Author:** Ravindra Kanchikare (krhebber)
