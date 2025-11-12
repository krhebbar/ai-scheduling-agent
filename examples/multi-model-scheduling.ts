/**
 * Multi-Model Scheduling Example
 *
 * Demonstrates using the AI Scheduling Agent with different LLM providers
 * via Vercel's AI SDK integration.
 *
 * Supported Providers:
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
 * - Google (Gemini 1.5 Pro, Gemini 1.5 Flash)
 *
 * Author: Ravindra Kanchikare (krhebbar)
 * License: MIT
 */

import { SchedulingAgent } from '../src';

/**
 * Example 1: Using OpenAI GPT-4
 */
async function exampleOpenAI() {
  console.log('═'.repeat(80));
  console.log('1️⃣  Using OpenAI GPT-4 Turbo');
  console.log('═'.repeat(80) + '\n');

  const agent = new SchedulingAgent({
    llm: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
      model: 'gpt-4-turbo-preview',
      temperature: 0.1,
    },
    scheduling: {
      timezone: 'America/New_York',
    },
    intelligence: {
      enablePreferenceLearning: true,
      enableSmartRecommendations: true,
      minConfidenceThreshold: 0.7,
    },
  });

  console.log('📝 User Request:');
  console.log('   "Schedule a technical interview with alice@company.com next Tuesday at 2pm"\n');

  const response = await agent.processMessage(
    'user-openai',
    'Schedule a technical interview with alice@company.com next Tuesday at 2pm'
  );

  console.log('🤖 GPT-4 Response:');
  console.log(`   ${response.message}`);
  console.log(`   Confidence: ${(response.confidence * 100).toFixed(0)}%\n`);
}

/**
 * Example 2: Using Anthropic Claude 3.5 Sonnet
 */
async function exampleAnthropic() {
  console.log('═'.repeat(80));
  console.log('2️⃣  Using Anthropic Claude 3.5 Sonnet');
  console.log('═'.repeat(80) + '\n');

  const agent = new SchedulingAgent({
    llm: {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY || 'your-anthropic-api-key',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.1,
      // Anthropic-specific: Enable prompt caching for cost savings
      providerMetadata: {
        anthropic: {
          cacheControl: { type: 'ephemeral' },
        },
      },
    },
    scheduling: {
      timezone: 'America/New_York',
    },
    intelligence: {
      enablePreferenceLearning: true,
      enableSmartRecommendations: true,
      minConfidenceThreshold: 0.7,
    },
  });

  console.log('📝 User Request:');
  console.log('   "What times are available for interviews next week?"\n');

  const response = await agent.processMessage(
    'user-claude',
    'What times are available for interviews next week?'
  );

  console.log('🤖 Claude Response:');
  console.log(`   ${response.message}`);
  console.log(`   Confidence: ${(response.confidence * 100).toFixed(0)}%\n`);

  console.log('💡 Note: Anthropic prompt caching enabled for 90% cost reduction on repeated prompts\n');
}

/**
 * Example 3: Using Google Gemini 1.5 Pro
 */
async function exampleGoogle() {
  console.log('═'.repeat(80));
  console.log('3️⃣  Using Google Gemini 1.5 Pro');
  console.log('═'.repeat(80) + '\n');

  const agent = new SchedulingAgent({
    llm: {
      provider: 'google',
      apiKey: process.env.GOOGLE_API_KEY || 'your-google-api-key',
      model: 'gemini-1.5-pro',
      temperature: 0.1,
    },
    scheduling: {
      timezone: 'America/New_York',
    },
    intelligence: {
      enablePreferenceLearning: true,
      enableSmartRecommendations: true,
      minConfidenceThreshold: 0.7,
    },
  });

  console.log('📝 User Request:');
  console.log('   "Reschedule my interview from Tuesday to Wednesday"\n');

  const response = await agent.processMessage(
    'user-gemini',
    'Reschedule my interview from Tuesday to Wednesday'
  );

  console.log('🤖 Gemini Response:');
  console.log(`   ${response.message}`);
  console.log(`   Confidence: ${(response.confidence * 100).toFixed(0)}%\n`);
}

/**
 * Example 4: Cost Comparison
 */
async function costComparison() {
  console.log('═'.repeat(80));
  console.log('4️⃣  Model Cost Comparison');
  console.log('═'.repeat(80) + '\n');

  const models = [
    {
      name: 'OpenAI GPT-4 Turbo',
      inputCost: 0.01, // per 1K tokens
      outputCost: 0.03,
      provider: 'openai',
    },
    {
      name: 'OpenAI GPT-3.5 Turbo',
      inputCost: 0.0005,
      outputCost: 0.0015,
      provider: 'openai',
    },
    {
      name: 'Anthropic Claude 3.5 Sonnet',
      inputCost: 0.003,
      outputCost: 0.015,
      provider: 'anthropic',
    },
    {
      name: 'Google Gemini 1.5 Pro',
      inputCost: 0.00125,
      outputCost: 0.005,
      provider: 'google',
    },
    {
      name: 'Google Gemini 1.5 Flash',
      inputCost: 0.000075,
      outputCost: 0.0003,
      provider: 'google',
    },
  ];

  console.log('Estimated cost per scheduling request (~400 input tokens, ~200 output tokens):\n');

  models.forEach((model) => {
    const estimatedCost = (400 / 1000) * model.inputCost + (200 / 1000) * model.outputCost;
    console.log(`${model.name.padEnd(35)} $${estimatedCost.toFixed(4)}`);
  });

  console.log('\n💡 Key Takeaways:');
  console.log('   • Gemini Flash is 40x cheaper than GPT-4 for simple tasks');
  console.log('   • Claude 3.5 Sonnet offers good balance of performance and cost');
  console.log('   • Use GPT-4 for complex scheduling logic, cheaper models for simple parsing\n');
}

/**
 * Example 5: Strategic Model Selection
 */
async function strategicModelSelection() {
  console.log('═'.repeat(80));
  console.log('5️⃣  Strategic Model Selection');
  console.log('═'.repeat(80) + '\n');

  console.log('Recommended model selection strategy:\n');

  const tasks = [
    {
      task: 'Simple intent classification',
      recommended: 'Gemini 1.5 Flash or GPT-3.5 Turbo',
      reason: 'Fast, cheap, accurate for simple classification',
    },
    {
      task: 'Entity extraction (dates, times, people)',
      recommended: 'Claude 3.5 Sonnet or GPT-4',
      reason: 'Better at structured extraction and reasoning',
    },
    {
      task: 'Conflict resolution reasoning',
      recommended: 'GPT-4 Turbo or Claude 3.5 Sonnet',
      reason: 'Requires complex reasoning and trade-off analysis',
    },
    {
      task: 'Natural language responses',
      recommended: 'Any model (Claude for more natural tone)',
      reason: 'All models handle this well, Claude excels at natural conversation',
    },
    {
      task: 'Preference learning analysis',
      recommended: 'GPT-4 or Claude 3.5 Sonnet',
      reason: 'Pattern recognition requires strong reasoning',
    },
  ];

  tasks.forEach(({ task, recommended, reason }, index) => {
    console.log(`${index + 1}. ${task}`);
    console.log(`   Recommended: ${recommended}`);
    console.log(`   Why: ${reason}\n`);
  });
}

/**
 * Example 6: Parallel Model Testing
 */
async function parallelModelTesting() {
  console.log('═'.repeat(80));
  console.log('6️⃣  Parallel Model Testing (A/B Comparison)');
  console.log('═'.repeat(80) + '\n');

  const testMessage = 'Schedule a panel interview with 3 interviewers next week';

  console.log(`📝 Test Message: "${testMessage}"\n`);
  console.log('Testing with multiple models in parallel...\n');

  const providers = [
    { name: 'GPT-4', provider: 'openai', model: 'gpt-4-turbo-preview', apiKey: process.env.OPENAI_API_KEY },
    { name: 'Claude', provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', apiKey: process.env.ANTHROPIC_API_KEY },
    { name: 'Gemini', provider: 'google', model: 'gemini-1.5-pro', apiKey: process.env.GOOGLE_API_KEY },
  ];

  const results = await Promise.allSettled(
    providers.map(async ({ name, provider, model, apiKey }) => {
      if (!apiKey || apiKey.startsWith('your-')) {
        return { name, status: 'skipped', reason: 'API key not set' };
      }

      const startTime = Date.now();

      try {
        const agent = new SchedulingAgent({
          llm: {
            provider: provider as any,
            apiKey: apiKey!,
            model,
            temperature: 0.1,
          },
          scheduling: { timezone: 'America/New_York' },
          intelligence: {
            enablePreferenceLearning: true,
            enableSmartRecommendations: true,
            minConfidenceThreshold: 0.7,
          },
        });

        const response = await agent.processMessage('test-user', testMessage);
        const duration = Date.now() - startTime;

        return {
          name,
          status: 'success',
          response: response.message,
          confidence: response.confidence,
          duration,
        };
      } catch (error) {
        return {
          name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  results.forEach((result, index) => {
    const data = result.status === 'fulfilled' ? result.value : null;

    if (!data) return;

    console.log(`${index + 1}. ${data.name}:`);

    if (data.status === 'skipped') {
      console.log(`   ⏭️  Skipped: ${data.reason}\n`);
    } else if (data.status === 'success') {
      console.log(`   ✅ Success (${data.duration}ms)`);
      console.log(`   Confidence: ${(data.confidence * 100).toFixed(0)}%`);
      console.log(`   Response: ${data.response?.substring(0, 100)}...`);
      console.log('');
    } else if (data.status === 'error') {
      console.log(`   ❌ Error: ${data.error}\n`);
    }
  });
}

/**
 * Main function - run all examples
 */
async function main() {
  console.log('\n');
  console.log('🌐 AI Scheduling Agent - Multi-Model Support\n');
  console.log('Demonstrating support for multiple LLM providers via Vercel AI SDK\n');

  try {
    // Example 1: OpenAI
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('your-')) {
      await exampleOpenAI();
    } else {
      console.log('⏭️  Skipping OpenAI example (API key not set)\n');
    }

    // Example 2: Anthropic
    if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith('your-')) {
      await exampleAnthropic();
    } else {
      console.log('⏭️  Skipping Anthropic example (API key not set)\n');
    }

    // Example 3: Google
    if (process.env.GOOGLE_API_KEY && !process.env.GOOGLE_API_KEY.startsWith('your-')) {
      await exampleGoogle();
    } else {
      console.log('⏭️  Skipping Google example (API key not set)\n');
    }

    // Example 4: Cost comparison
    await costComparison();

    // Example 5: Strategic selection
    await strategicModelSelection();

    // Example 6: Parallel testing
    await parallelModelTesting();

    console.log('═'.repeat(80));
    console.log('✅ Multi-Model Demo Complete!\n');
    console.log('💡 Key Benefits:');
    console.log('   ✓ Model flexibility - switch providers based on task');
    console.log('   ✓ Cost optimization - use cheaper models for simple tasks');
    console.log('   ✓ Performance tuning - leverage each model\'s strengths');
    console.log('   ✓ Vendor independence - avoid lock-in to single provider');
    console.log('   ✓ Future-proof - easy to adopt new models as released\n');

    console.log('📚 Setup Instructions:');
    console.log('   1. Set environment variables:');
    console.log('      export OPENAI_API_KEY="sk-..."');
    console.log('      export ANTHROPIC_API_KEY="sk-ant-..."');
    console.log('      export GOOGLE_API_KEY="..."');
    console.log('   2. Run: npx ts-node examples/multi-model-scheduling.ts\n');

  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    console.error('\nMake sure you have set the appropriate API keys as environment variables.\n');
    process.exit(1);
  }
}

// Run examples
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { main };
