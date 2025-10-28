# Contributing to AI Scheduling Agent

Thank you for your interest in contributing! This document provides guidelines for contributing to the AI Scheduling Agent project.

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request:

1. **Search existing issues** to avoid duplicates
2. **Create a new issue** with a clear title and description
3. **Include details:**
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Example natural language queries
   - LLM responses (if applicable)
   - Environment details (Node version, OS)

### Submitting Pull Requests

1. **Fork the repository** and create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation
   - Keep commits focused and atomic

3. **Test your changes:**
   ```bash
   npm run type-check
   npm run build
   npm run example:basic
   npm run example:smart
   npm run example:conflicts
   ```

4. **Submit your PR:**
   - Write a clear PR title and description
   - Reference related issues
   - Explain your changes and rationale
   - Include example interactions if relevant

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- TypeScript >= 5.0.0
- OpenAI API key (for testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/krhebber/ai-scheduling-agent.git
cd ai-scheduling-agent

# Install dependencies
npm install

# Set environment variables
export OPENAI_API_KEY="sk-your-api-key"

# Build
npm run build
```

### Project Structure

```
ai-scheduling-agent/
├── src/
│   ├── types/              # TypeScript type definitions
│   ├── nlu/                # Natural language understanding
│   ├── intelligence/       # AI-powered features
│   ├── llm/                # LLM integration
│   ├── integration/        # External system adapters
│   ├── agent/              # Core agent
│   └── index.ts
├── examples/               # Working examples
└── docs/                   # Documentation
```

## Areas for Contribution

We welcome contributions in these areas:

### High Priority

1. **Additional LLM Providers**
   - Claude/Anthropic integration
   - Gemini/Google AI support
   - Local LLM support (Ollama, LM Studio)
   - Azure OpenAI support

2. **Calendar Integrations**
   - Google Calendar sync
   - Outlook/Microsoft Graph API
   - Apple Calendar support
   - Custom calendar providers

3. **Enhanced NLU**
   - Multi-language support
   - Better entity extraction
   - Custom intent types
   - Improved date/time parsing

### Medium Priority

4. **Smart Features**
   - Vector embeddings for preference matching
   - Advanced ML scoring algorithms
   - Sentiment analysis for candidate feedback
   - Timezone intelligence

5. **Testing**
   - Unit tests for NLU components
   - Integration tests for agent
   - Performance benchmarks
   - Example test cases

6. **Documentation**
   - More use case examples
   - Video tutorials
   - API reference improvements
   - Architecture diagrams

### Lower Priority

7. **Developer Experience**
   - CLI tool for testing
   - Web demo UI
   - Debugging utilities
   - Logging improvements

## Code Style Guidelines

### TypeScript

- Use **strict mode** (`tsconfig.json` with `"strict": true`)
- Follow existing patterns in the codebase
- Use **meaningful variable names**
- Add **JSDoc comments** for public APIs
- Prefer **interfaces** over `any` types
- Use **async/await** over promises

Example:
```typescript
/**
 * Parse natural language scheduling request
 *
 * @param message - User's message in natural language
 * @param context - Optional conversation context
 * @returns Structured parsed request with entities and intent
 */
export async function parseRequest(
  message: string,
  context?: ConversationContext
): Promise<ParsedRequest> {
  // Implementation
}
```

### Prompt Engineering

When modifying LLM prompts:

- Keep prompts concise and focused
- Provide clear examples
- Use structured output formats (JSON)
- Test with various inputs
- Document prompt purpose and variables

Example:
```typescript
export const MY_PROMPT: PromptTemplate = {
  name: 'my_custom_prompt',
  template: `You are an expert at [task].

Input: "{{input}}"

Respond with JSON:
{
  "result": "...",
  "confidence": 0.0-1.0
}`,
  variables: ['input'],
  examples: [
    {
      input: 'example input',
      output: '{"result": "...", "confidence": 0.9}',
    },
  ],
};
```

## Adding a New LLM Provider

To add support for a new LLM provider:

1. Create provider file in `src/llm/providers/`:

```typescript
// src/llm/providers/custom.ts
import { LLMProvider, ParsedRequest, /* ... */ } from '../../types';

export class CustomLLMProvider implements LLMProvider {
  public readonly name = 'custom';

  constructor(config: CustomProviderConfig) {
    // Initialize provider
  }

  async parseRequest(text: string, context?: ConversationContext): Promise<ParsedRequest> {
    // Implementation
  }

  async generateResponse(request: ParsedRequest, data: any): Promise<string> {
    // Implementation
  }

  async extractEntities(text: string): Promise<{ entities: ExtractedEntities; confidence: ConfidenceScores }> {
    // Implementation
  }

  async classifyIntent(text: string): Promise<{ intent: SchedulingIntent; confidence: number }> {
    // Implementation
  }

  getConfig(): EmbeddingProviderConfig {
    // Return config
  }
}
```

2. Export from `src/llm/providers/index.ts`

3. Add tests and documentation

4. Update README with provider details

## Adding New Features

### New Intent Type

1. Add to `SchedulingIntent` type in `src/types/index.ts`
2. Update intent classification prompt
3. Add handler in `SchedulingAgent.handleIntent()`
4. Add example in `examples/`

### New Conflict Type

1. Add to `ConflictType` in `src/intelligence/conflictResolver.ts`
2. Implement resolution logic
3. Add severity mapping
4. Update examples

### New Scoring Factor

1. Add to `ScoringFactors` in `src/intelligence/slotRecommender.ts`
2. Implement scoring function
3. Add to weighted combination
4. Document in README

## Testing Guidelines

### Manual Testing

```bash
# Test basic functionality
npm run example:basic

# Test smart recommendations
npm run example:smart

# Test conflict resolution
npm run example:conflicts
```

### Test Checklist

- [ ] Code type-checks without errors
- [ ] Build succeeds
- [ ] All examples run successfully
- [ ] No console errors or warnings
- [ ] Documentation updated
- [ ] Intent recognition works for edge cases
- [ ] Entity extraction handles ambiguity
- [ ] Recommendations make sense

## Performance Considerations

When contributing performance improvements:

1. **Benchmark** - Measure before and after
2. **Document tradeoffs** - Speed vs accuracy vs cost
3. **Test at scale** - Verify with realistic data volumes
4. **Monitor API costs** - OpenAI API calls can add up
5. **Profile** - Use profiling tools for optimization

Example benchmark:
```typescript
const start = Date.now();
const response = await agent.processMessage(userId, message);
const duration = Date.now() - start;
console.log(`Response time: ${duration}ms`);
```

## Prompt Engineering Best Practices

When modifying prompts:

1. **Be specific** - Clear instructions get better results
2. **Provide examples** - Few-shot learning improves accuracy
3. **Use structure** - JSON output for parsing
4. **Test thoroughly** - Try edge cases and ambiguous inputs
5. **Optimize tokens** - Shorter prompts = lower costs
6. **Version control** - Track prompt changes

## Documentation Guidelines

- Update README for new features
- Add JSDoc comments to public APIs
- Include code examples
- Document breaking changes
- Add migration guides when needed

## Security

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email security concerns to: [security placeholder]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on technical merit
- Help others learn

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Open a discussion on GitHub
- Check existing documentation
- Review closed issues

## Thank You!

Your contributions make this project better. We appreciate your time and effort!

---

**Maintained by:** Ravindra Kanchikare (krhebber)
**License:** MIT
