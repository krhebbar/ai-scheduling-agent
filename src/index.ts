/**
 * AI Scheduling Agent
 *
 * Intelligent meeting scheduling using natural language understanding and AI recommendations.
 *
 * Features:
 * - Natural language request parsing
 * - Smart slot recommendations based on preferences
 * - Intelligent conflict resolution
 * - Multi-turn conversations
 * - Preference learning from history
 *
 * Author: Ravindra Kanchikare (krhebbar)
 * License: MIT
 *
 * @example
 * ```typescript
 * import { SchedulingAgent } from 'ai-scheduling-agent';
 *
 * const agent = new SchedulingAgent({
 *   llm: {
 *     provider: 'openai',
 *     apiKey: process.env.OPENAI_API_KEY,
 *     model: 'gpt-4-turbo-preview',
 *   },
 *   scheduling: {
 *     timezone: 'America/New_York',
 *   },
 * });
 *
 * const response = await agent.processMessage(
 *   'user123',
 *   'Schedule a technical interview with Alice next Tuesday at 2pm'
 * );
 *
 * console.log(response.message);
 * console.log(response.recommendedSlots);
 * ```
 */

// Core agent
export { SchedulingAgent } from './agent';

// Types
export * from './types';

// NLU components
export {
  RequestParser,
  IntentRecognizer,
  EntityExtractor,
} from './nlu';

// Intelligence components
export {
  SlotRecommender,
  ConflictResolver,
  PreferenceEngine,
} from './intelligence';

// Integration
export { SchedulingAdapter } from './integration';

// LLM providers
export { OpenAILLMProvider, createOpenAIProvider } from './llm/providers/openai';

// Version
export const VERSION = '1.0.0';
