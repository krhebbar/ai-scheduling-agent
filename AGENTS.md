# Repository Guidelines

## Project Structure & Module Organization

Single TypeScript package with modular architecture:

```
ai-scheduling-agent/
├── src/
│   ├── agent/           # Core agent orchestration
│   ├── nlu/             # Natural language understanding
│   ├── intelligence/    # Preference learning, conflict resolution
│   ├── llm/             # LLM provider integration
│   ├── integration/     # Calendar API integrations
│   └── types/           # TypeScript type definitions
├── examples/            # Example implementations
└── docs/                # Documentation and guides
```

## Build, Test, and Development Commands

```bash
npm run build              # Compile TypeScript to JavaScript
npm run build:watch        # Watch mode for development
npm run type-check         # Type checking without emit
npm run clean              # Remove dist directory

# Run examples
npm run example:basic      # Basic scheduling conversation
npm run example:advanced   # Advanced multi-party scheduling
```

**Development Workflow:**
```bash
# 1. Install dependencies
npm install

# 2. Start watch mode
npm run build:watch

# 3. In another terminal, run examples
npx ts-node examples/basic-example.ts
```

## Coding Style & Naming Conventions

**TypeScript:**
- Strict type checking enabled
- **Interfaces/Types:** PascalCase (`SchedulingContext`, `PreferenceModel`, `ConflictResolution`)
- **Functions:** camelCase (`analyzeIntent()`, `learnPreferences()`, `resolveConflicts()`)
- **Files:** kebab-case (`preference-learning.ts`, `conflict-resolver.ts`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_TIMEOUT`)

**Patterns:**
- Async/await for all asynchronous operations
- Interface-based design for extensibility
- Functional approach for stateless utilities

## Testing Guidelines

**Framework:** Tests should be added (currently no test suite configured)

**Recommended Setup:**
```bash
npm install --save-dev vitest @vitest/ui
```

**Test Conventions:**
- Test files: `*.test.ts` alongside source files
- Focus on: NLU parsing, preference learning, conflict resolution logic
- Mock LLM responses for deterministic tests

## Commit & Pull Request Guidelines

**Commit Format:** Conventional Commits

```
feat(nlu): add support for relative date parsing
fix(agent): resolve multi-turn state management bug
docs(examples): add advanced scheduling scenario
refactor(intelligence): improve preference learning algorithm
```

**Scopes:** `agent`, `nlu`, `intelligence`, `llm`, `integration`, `docs`, `examples`

**PR Requirements:**
- Clear description of changes
- Link to related issues
- Update documentation if public API changes
- Add examples demonstrating new features

## Agent-Specific Instructions

**Conversational AI Development:**
- The agent maintains multi-turn conversation state
- NLU module handles ambiguous scheduling requests
- Preference learning adapts to user patterns over time
- Conflict resolution uses intelligent algorithms, not just first-come-first-served

**Key Concepts:**
- **State Management:** Context persists across conversation turns
- **Intent Recognition:** Parse natural language into structured scheduling intents
- **Preference Learning:** Track user preferences (time-of-day, meeting patterns)
- **Conflict Resolution:** Resolve scheduling conflicts intelligently

## Environment Setup

**Required:**
- Node.js >= 18.0.0
- OpenAI API key: `OPENAI_API_KEY`

**Configuration:**
Create `.env` file in root:
```
OPENAI_API_KEY=sk-your-key-here
```

**Peer Dependencies:**
Install OpenAI SDK separately:
```bash
npm install openai
```
