/**
 * Basic Scheduling Example
 *
 * Demonstrates natural language scheduling with the AI agent.
 *
 * Author: Ravindra Kanchikare (krhebbar)
 * License: MIT
 */

import { SchedulingAgent } from '../src';

/**
 * Main example function
 */
async function main() {
  console.log('🤖 AI Scheduling Agent - Basic Scheduling Example\n');

  // Initialize the agent
  const agent = new SchedulingAgent({
    llm: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
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

  const userId = 'recruiter-1';

  // Example 1: Simple scheduling request
  console.log('📝 Example 1: Schedule an interview\n');
  console.log('User: "Schedule a technical interview with alice@company.com next Tuesday at 2pm"\n');

  const response1 = await agent.processMessage(
    userId,
    'Schedule a technical interview with alice@company.com next Tuesday at 2pm'
  );

  console.log('🤖 Agent Response:');
  console.log(response1.message);
  console.log('\n📊 Recommended Slots:');
  response1.recommendedSlots?.forEach((slot, index) => {
    console.log(`\n${index + 1}. ${new Date(slot.startTime).toLocaleString()}`);
    console.log(`   Interviewers: ${slot.interviewers.map((i) => i.name).join(', ')}`);
    console.log(`   Score: ${(slot.score * 100).toFixed(0)}%`);
    console.log(`   Reasons: ${slot.reasons.join(', ')}`);
  });
  console.log('\n' + '='.repeat(80) + '\n');

  // Example 2: Vague request requiring clarification
  console.log('📝 Example 2: Vague scheduling request\n');
  console.log('User: "I need to schedule an interview"\n');

  const response2 = await agent.processMessage(
    userId,
    'I need to schedule an interview'
  );

  console.log('🤖 Agent Response:');
  console.log(response2.message);
  if (response2.clarifications) {
    console.log('\n❓ Clarifications needed:');
    response2.clarifications.forEach((q) => console.log(`   - ${q}`));
  }
  console.log('\n' + '='.repeat(80) + '\n');

  // Example 3: Follow-up with missing information
  console.log('📝 Example 3: Provide missing details\n');
  console.log('User: "With Bob Smith next week, technical interview"\n');

  const response3 = await agent.processMessage(
    userId,
    'With Bob Smith next week, technical interview'
  );

  console.log('🤖 Agent Response:');
  console.log(response3.message);
  if (response3.recommendedSlots) {
    console.log(`\n✅ Found ${response3.recommendedSlots.length} available slots`);
  }
  console.log('\n' + '='.repeat(80) + '\n');

  // Example 4: Book a slot
  console.log('📝 Example 4: Book a specific time slot\n');

  if (response3.recommendedSlots && response3.recommendedSlots.length > 0) {
    const topSlot = response3.recommendedSlots[0];
    console.log(`Booking slot: ${new Date(topSlot.startTime).toLocaleString()}\n`);

    const bookingResponse = await agent.bookSlot(
      userId,
      topSlot.slotId,
      {
        name: 'John Candidate',
        email: 'john.candidate@example.com',
      }
    );

    console.log('🤖 Agent Response:');
    console.log(bookingResponse.message);
    if (bookingResponse.actions) {
      console.log('\n✅ Actions taken:');
      bookingResponse.actions.forEach((action) => {
        console.log(`   - ${action.type}: ${JSON.stringify(action.details, null, 2)}`);
      });
    }
  }
  console.log('\n' + '='.repeat(80) + '\n');

  // Example 5: Check availability
  console.log('📝 Example 5: Check availability\n');
  console.log('User: "What times are available for interviews next week?"\n');

  const response5 = await agent.processMessage(
    userId,
    'What times are available for interviews next week?'
  );

  console.log('🤖 Agent Response:');
  console.log(response5.message);
  console.log('\n' + '='.repeat(80) + '\n');

  // Example 6: Reschedule
  console.log('📝 Example 6: Reschedule an interview\n');
  console.log('User: "I need to reschedule the interview from Tuesday to Wednesday"\n');

  const response6 = await agent.processMessage(
    userId,
    'I need to reschedule the interview from Tuesday to Wednesday'
  );

  console.log('🤖 Agent Response:');
  console.log(response6.message);
  if (response6.recommendedSlots) {
    console.log(`\n📅 Alternative slots: ${response6.recommendedSlots.length}`);
  }
  console.log('\n' + '='.repeat(80) + '\n');

  console.log('✅ Example completed!\n');
  console.log('💡 Key Features Demonstrated:');
  console.log('   ✓ Natural language understanding');
  console.log('   ✓ Intent recognition (schedule, reschedule, check availability)');
  console.log('   ✓ Entity extraction (people, dates, times)');
  console.log('   ✓ Smart slot recommendations');
  console.log('   ✓ Multi-turn conversations with context');
  console.log('   ✓ Clarification questions for missing info');
  console.log('   ✓ Booking and confirmation');
}

// Run the example
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error running example:', error);
    process.exit(1);
  });
}

export { main };
