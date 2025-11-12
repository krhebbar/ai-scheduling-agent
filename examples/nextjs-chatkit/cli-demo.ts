/**
 * CLI Demo for Simple Scheduling Agent
 *
 * Interactive command-line demo showing the OpenAI Agents SDK integration
 */

import { SimpleSchedulingAgent } from './SimpleSchedulingAgent';
import * as readline from 'readline';

const DEMO_PROMPTS = [
  'Schedule a technical interview with Alice next Tuesday at 2pm',
  'What times are available for interviews next week?',
  'I need to reschedule the interview from Tuesday to Wednesday',
  'Cancel the interview with Bob',
  'Book a panel interview with 3 engineers on Friday afternoon',
];

async function main() {
  console.log('🤖 AI Scheduling Agent - CLI Demo');
  console.log('=' .repeat(60));
  console.log('\nPowered by OpenAI Agents SDK\n');

  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY environment variable not set');
    console.error('\nPlease set your OpenAI API key:');
    console.error('  export OPENAI_API_KEY=your-api-key-here\n');
    process.exit(1);
  }

  // Initialize the agent
  console.log('Initializing agent...\n');
  const agent = new SimpleSchedulingAgent({
    apiKey,
    model: 'gpt-4o-mini',
  });

  const userId = 'demo-user';

  // Show example prompts
  console.log('💡 Try these example prompts:\n');
  DEMO_PROMPTS.forEach((prompt, index) => {
    console.log(`   ${index + 1}. ${prompt}`);
  });
  console.log('\n' + '='.repeat(60) + '\n');

  // Create readline interface for interactive chat
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Prompt function
  const promptUser = () => {
    rl.question('\nYou: ', async (input) => {
      const message = input.trim();

      if (!message) {
        promptUser();
        return;
      }

      // Check for exit commands
      if (['exit', 'quit', 'bye'].includes(message.toLowerCase())) {
        console.log('\n👋 Goodbye!\n');
        rl.close();
        process.exit(0);
      }

      // Check for numbered shortcuts
      const promptNumber = parseInt(message);
      const actualMessage =
        promptNumber > 0 && promptNumber <= DEMO_PROMPTS.length
          ? DEMO_PROMPTS[promptNumber - 1]
          : message;

      if (promptNumber > 0 && promptNumber <= DEMO_PROMPTS.length) {
        console.log(`\nYou: ${actualMessage}`);
      }

      // Process the message
      try {
        console.log('\n🤔 Agent is thinking...\n');
        const response = await agent.processMessage(userId, actualMessage);

        console.log(`Agent: ${response.message}\n`);
        console.log('─'.repeat(60));
      } catch (error) {
        console.error('\n❌ Error:', error);
      }

      // Continue the conversation
      promptUser();
    });
  };

  // Start the interactive session
  console.log('Type your scheduling request or use a number (1-5) for examples.');
  console.log('Type "exit" to quit.\n');
  promptUser();
}

// Run the demo
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { main };
