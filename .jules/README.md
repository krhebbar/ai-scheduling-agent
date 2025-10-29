# Jules Environment Setup - AI Scheduling Agent

## Setup Script

The setup script (`setup.sh`) will:
1. Install Node.js dependencies
2. Build TypeScript project
3. Run type checking

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 powered NLU and conversation handling |

### Configuration in Jules

When creating a Jules session, **enable** `OPENAI_API_KEY`.

## Usage Examples

```bash
# Run basic scheduling example
npm run example:basic

# Run advanced multi-party example
npm run example:advanced
```

## Tech Stack

- **Language:** TypeScript 5.3+, Node.js 18+
- **AI:** OpenAI GPT-4 for natural language understanding
- **Build:** TypeScript compiler + tsx for examples
- **Architecture:** NLU, preference learning, conflict resolution

## Key Features

- Multi-turn conversational AI for scheduling
- Natural language intent parsing
- User preference learning over time
- Intelligent conflict resolution
- Calendar integration abstractions
