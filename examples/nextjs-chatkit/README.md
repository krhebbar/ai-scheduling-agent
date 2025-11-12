# Next.js ChatKit - AI Scheduling Agent Demo

**Next.js 15** demo application showcasing the AI Scheduling Agent powered by **OpenAI Agents JS SDK**.

## Overview

This is a modern, full-stack Next.js 15 application featuring:
- 🚀 Next.js 15 with App Router
- ⚛️ React 19
- 🤖 OpenAI Agents JS SDK integration
- 💬 Real-time chat interface
- 🎨 Modern, responsive UI
- 📡 API Routes for agent communication

---

## Quick Start

### Prerequisites

- Node.js 18+ installed
- OpenAI API key

### Setup

1. **Navigate to the demo directory:**
   ```bash
   cd examples/nextjs-chatkit
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set your OpenAI API key:**

   Create a `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` and add your API key:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3001](http://localhost:3001)

---

## Available Scripts

### `npm run dev`
Starts the Next.js development server on port 3001
- Hot reload enabled
- Fast Refresh for instant updates

### `npm run build`
Creates an optimized production build
- Minified and optimized
- Ready for deployment

### `npm start`
Runs the production build
- Requires running `npm run build` first

### `npm run cli`
Runs the CLI demo (terminal-based)
- Interactive command-line interface
- Quick testing without browser

---

## Features

### Web Interface

**Modern Chat UI:**
- Real-time message streaming
- Typing indicators
- Example prompt chips for quick testing
- Responsive design (mobile-friendly)
- Beautiful gradient theme

**Example Prompts:**
- Schedule a technical interview with Alice next Tuesday at 2pm
- What times are available next week?
- Reschedule to Wednesday
- Cancel my interview

### CLI Demo

Interactive terminal-based chat for quick testing:

```bash
npm run cli
```

**Features:**
- Numbered shortcuts (1-5) for example prompts
- Simple readline interface
- Perfect for development and testing

---

## Architecture

### Next.js App Router Structure

```
app/
├── api/
│   ├── chat/
│   │   └── route.ts          # POST /api/chat
│   └── health/
│       └── route.ts          # GET /api/health
├── components/
│   └── ChatInterface.tsx     # Main chat component
├── globals.css               # Global styles
├── layout.tsx                # Root layout
└── page.tsx                  # Home page
```

### Components

**ChatInterface.tsx** (`'use client'`)
- React client component
- Manages chat state
- Handles API communication
- Real-time UI updates

**API Routes** (Server-side)
- `/api/chat` - POST endpoint for messages
- `/api/health` - GET health check

**SimpleSchedulingAgent.ts**
- Wrapper around OpenAI Agents SDK
- Lightweight and focused
- Easy to extend

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
  "sdk": "openai-agents-js",
  "framework": "Next.js 15"
}
```

---

## Technology Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **OpenAI Agents SDK** - Agent orchestration
- **Zod** - Schema validation
- **CSS** - Custom styling (no external UI libraries)

---

## Deployment

### Deploy to Vercel

The easiest way to deploy your Next.js app:

```bash
npm run build
vercel
```

### Environment Variables

Make sure to set `OPENAI_API_KEY` in your deployment platform:

**Vercel:**
- Go to Project Settings → Environment Variables
- Add `OPENAI_API_KEY`

**Other platforms:**
- Set environment variables according to platform docs

---

## Customization

### Change AI Model

Edit `SimpleSchedulingAgent.ts` or `app/api/chat/route.ts`:

```typescript
model: 'gpt-4o',  // or 'gpt-4o-mini', 'gpt-4', etc.
```

### Modify Agent Instructions

Edit the `instructions` field in `SimpleSchedulingAgent.ts` constructor to change agent behavior.

### Update Styles

Edit `app/globals.css` to customize the UI appearance.

### Add New Example Prompts

Edit the `EXAMPLE_PROMPTS` array in `app/components/ChatInterface.tsx`.

---

## Troubleshooting

### "OPENAI_API_KEY not set"

Make sure you've created `.env.local` with your API key:
```bash
echo "OPENAI_API_KEY=sk-your-key" > .env.local
```

### Port 3001 already in use

Change the port in `package.json`:
```json
"dev": "next dev -p 3002"
```

### Build errors

Try clearing the cache:
```bash
rm -rf .next node_modules
npm install
npm run dev
```

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [OpenAI Agents JS SDK](https://github.com/openai/openai-agents-js)
- [OpenAI Platform](https://platform.openai.com/docs)

---

## License

MIT - See LICENSE file

## Contributing

Contributions welcome! Please open an issue or submit a PR.
