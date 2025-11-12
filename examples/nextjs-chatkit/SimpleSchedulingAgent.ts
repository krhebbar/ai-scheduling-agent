/**
 * Simplified Scheduling Agent for Demo
 *
 * A minimal working version using OpenAI Agents SDK
 */

import { Agent, run } from '@openai/agents';

export interface AgentConfig {
  apiKey: string;
  model?: string;
}

export interface AgentResponse {
  message: string;
  confidence?: number;
}

/**
 * Simplified Scheduling Agent
 *
 * Demonstrates the OpenAI Agents SDK integration
 * without the complex domain logic
 */
export class SimpleSchedulingAgent {
  private agent: Agent;

  constructor(config: AgentConfig) {
    // Create the agent with instructions
    this.agent = new Agent({
      name: 'SchedulingAssistant',
      instructions: `You are an intelligent scheduling assistant that helps users schedule, reschedule, and manage interviews and meetings.

Your capabilities:
1. Natural Language Understanding: Parse user requests to extract scheduling intent, people involved, dates/times
2. Smart Recommendations: Suggest optimal time slots
3. Conflict Resolution: Detect and resolve scheduling conflicts
4. Multi-turn Conversations: Handle follow-up questions naturally

Guidelines:
- Always be professional, friendly, and helpful
- Ask clarifying questions when information is missing
- Confirm understanding before suggesting actions
- Provide clear next steps

Current date: ${new Date().toLocaleDateString()}
Timezone: UTC`,
      model: config.model || 'gpt-4o-mini',
    });
  }

  /**
   * Process a natural language scheduling request
   */
  async processMessage(
    userId: string,
    message: string
  ): Promise<AgentResponse> {
    try {
      // Use the SDK to run the agent
      const input = `User: ${message}

Please help with this scheduling request. Understand the intent and provide a helpful response.`;

      const result = await run(this.agent, input);

      return {
        message: result.finalOutput || 'I processed your request.',
        confidence: 0.9,
      };
    } catch (error) {
      console.error('Agent error:', error);
      return {
        message: 'I encountered an error processing your request. Please try again.',
        confidence: 0.0,
      };
    }
  }

  /**
   * Reset conversation (for demo purposes)
   */
  resetConversation(_userId: string): void {
    // In a real implementation, this would clear conversation history
    console.log('Conversation reset');
  }
}
