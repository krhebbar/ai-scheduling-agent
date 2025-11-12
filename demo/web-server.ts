/**
 * Simple Web Server for Scheduling Agent Demo
 *
 * Minimal Express server that exposes the scheduling agent via HTTP
 */

import express from 'express';
import cors from 'cors';
import { SimpleSchedulingAgent } from './SimpleSchedulingAgent';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('demo/public'));

// Initialize agent
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('❌ Error: OPENAI_API_KEY environment variable not set');
  process.exit(1);
}

const agent = new SimpleSchedulingAgent({
  apiKey,
  model: 'gpt-4o-mini',
});

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId = 'demo-user' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`[${userId}] User: ${message}`);

    const response = await agent.processMessage(userId, message);

    console.log(`[${userId}] Agent: ${response.message.substring(0, 100)}...`);

    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'An error occurred processing your message',
      message: 'I encountered an error. Please try again.',
    });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', agent: 'SchedulingAgent', sdk: 'openai-agents-js' });
});

// Start server
app.listen(port, () => {
  console.log('🤖 AI Scheduling Agent - Web Demo Server');
  console.log('=' .repeat(60));
  console.log(`\n✅ Server running on http://localhost:${port}`);
  console.log(`\n📡 API Endpoints:`);
  console.log(`   POST /api/chat - Send messages to the agent`);
  console.log(`   GET  /api/health - Health check\n`);
  console.log(`💡 Open http://localhost:${port} in your browser\n`);
});
