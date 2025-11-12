# AI Scheduling Agent - Demo

Interactive demos showcasing the AI Scheduling Agent powered by **OpenAI Agents JS SDK**.

## Demos Available

### 1. CLI Demo (Command Line)
Interactive terminal-based chat with the scheduling agent.

### 2. Web Demo (Browser UI)
Beautiful web interface with real-time chat.

---

## Quick Start

### Prerequisites

- Node.js 18+ installed
- OpenAI API key

### Setup

1. **Install dependencies:**
   ```bash
   cd demo
   npm install
   ```

2. **Set your OpenAI API key:**
   ```bash
   export OPENAI_API_KEY=your-api-key-here
   ```

### Run CLI Demo

```bash
npm run cli
```

**Features:**
- Interactive terminal chat
- Pre-defined example prompts
- Simple and fast

**Example session:**
```
🤖 AI Scheduling Agent - CLI Demo
================================================

💡 Try these example prompts:

   1. Schedule a technical interview with Alice next Tuesday at 2pm
   2. What times are available for interviews next week?
   3. I need to reschedule the interview from Tuesday to Wednesday
   4. Cancel the interview with Bob
   5. Book a panel interview with 3 engineers on Friday afternoon

================================================

You: 1

You: Schedule a technical interview with Alice next Tuesday at 2pm

🤔 Agent is thinking...

Agent: I'd be happy to help you schedule a technical interview with Alice for next Tuesday at 2pm...

─────────────────────────────────────────────
```

### Run Web Demo

```bash
npm run web
```

Then open your browser to: **http://localhost:3001**

**Features:**
- Beautiful chat UI
- Typing indicators
- Quick example prompts
- Responsive design
- Real-time responses

---

## Example Prompts

Try these scheduling requests:

1. **Schedule:**
   - "Schedule a technical interview with Alice next Tuesday at 2pm"
   - "Book a panel interview with 3 engineers on Friday afternoon"
   - "Set up a behavioral interview for next week"

2. **Check Availability:**
   - "What times are available for interviews next week?"
   - "Show me open slots on Thursday"
   - "When can I schedule an interview?"

3. **Reschedule:**
   - "Reschedule the Tuesday interview to Wednesday"
   - "Move my interview to next week"
   - "Change the time to 3pm"

4. **Cancel:**
   - "Cancel my interview with Bob"
   - "Remove the Friday appointment"

---

## Architecture

```
┌─────────────┐
│  User Input │
└──────┬──────┘
       │
       v
┌──────────────────────┐
│ SimpleSchedulingAgent│
│  (OpenAI Agents SDK) │
└──────┬───────────────┘
       │
       v
┌──────────────────┐
│  OpenAI API      │
│  (gpt-4o-mini)   │
└──────────────────┘
```

### Components

**SimpleSchedulingAgent.ts**
- Lightweight wrapper around OpenAI Agents SDK
- Handles conversation flow
- Provides clean API

**cli-demo.ts**
- Interactive terminal interface
- Readline-based chat
- Example prompt shortcuts

**web-server.ts**
- Express.js HTTP server
- REST API endpoint for chat
- Serves static HTML UI

**public/index.html**
- Modern chat interface
- Real-time messaging
- Example prompt chips

---

## API Reference

### POST /api/chat

Send a message to the scheduling agent.

**Request:**
```json
{
  "message": "Schedule an interview next Tuesday",
  "userId": "demo-user"
}
```

**Response:**
```json
{
  "message": "I'd be happy to help schedule an interview for next Tuesday...",
  "confidence": 0.9
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "agent": "SchedulingAgent",
  "sdk": "openai-agents-js"
}
```

---

## Customization

### Change the AI Model

Edit `SimpleSchedulingAgent.ts` or pass in constructor:

```typescript
const agent = new SimpleSchedulingAgent({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',  // or 'gpt-4o-mini', 'gpt-4', etc.
});
```

### Modify Agent Instructions

Edit the `instructions` in `SimpleSchedulingAgent.ts` constructor to change behavior.

### Change Server Port

```bash
PORT=8080 npm run web
```

---

## Troubleshooting

### "OPENAI_API_KEY not set"

Make sure you've exported your API key:
```bash
export OPENAI_API_KEY=sk-...
```

### Port already in use

Change the port:
```bash
PORT=3002 npm run web
```

### Module not found

Install dependencies:
```bash
npm install
```

---

## Next Steps

- Deploy to production (Vercel, Railway, etc.)
- Add user authentication
- Integrate with real calendar APIs (Google Calendar, Outlook)
- Add database for conversation persistence
- Implement slot recommendation algorithms
- Add conflict detection logic

---

## License

MIT - See LICENSE file

## Learn More

- [OpenAI Agents JS SDK](https://github.com/openai/openai-agents-js)
- [OpenAI Platform Docs](https://platform.openai.com/docs)
- [Full Project Documentation](../README.md)
