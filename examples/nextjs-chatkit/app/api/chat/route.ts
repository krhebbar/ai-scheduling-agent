/**
 * Next.js API Route - Chat Endpoint
 *
 * Handles chat messages to the scheduling agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { SimpleSchedulingAgent } from '@/SimpleSchedulingAgent';

// Initialize agent (will be reused across requests)
let agent: SimpleSchedulingAgent | null = null;

function getAgent() {
  if (!agent) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }

    agent = new SimpleSchedulingAgent({
      apiKey,
      model: 'gpt-4o-mini',
    });
  }
  return agent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId = 'demo-user' } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log(`[${userId}] User: ${message}`);

    const schedulingAgent = getAgent();
    const response = await schedulingAgent.processMessage(userId, message);

    console.log(`[${userId}] Agent: ${response.message.substring(0, 100)}...`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      {
        error: 'An error occurred processing your message',
        message: 'I encountered an error. Please try again.',
      },
      { status: 500 }
    );
  }
}
