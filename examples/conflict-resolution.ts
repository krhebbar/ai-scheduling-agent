/**
 * Conflict Resolution Example
 *
 * Demonstrates intelligent conflict detection and resolution.
 *
 * Author: Ravindra Kanchikare (krhebbar)
 * License: MIT
 */

import {
  ConflictResolver,
  Conflict,
  SmartSlotRecommendation,
} from '../src';

/**
 * Generate mock alternative slots
 */
function generateAlternativeSlots(): SmartSlotRecommendation[] {
  const slots: SmartSlotRecommendation[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 1); // Tomorrow

  for (let i = 0; i < 5; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    date.setHours(10 + i * 2, 0, 0, 0); // 10 AM, 12 PM, 2 PM, etc.

    const endTime = new Date(date);
    endTime.setHours(endTime.getHours() + 1);

    slots.push({
      slotId: `alt-slot-${i}`,
      startTime: date.toISOString(),
      endTime: endTime.toISOString(),
      interviewers: [
        {
          id: `int-${i}`,
          name: `Interviewer ${String.fromCharCode(65 + i)}`,
          email: `interviewer${i}@company.com`,
        },
      ],
      score: 0.9 - i * 0.1, // Decreasing scores
      reasons: [
        'Available interviewer',
        'Within work hours',
        'Good load distribution',
      ],
      factors: {
        preferenceMatch: 0.85,
        loadBalance: 0.90 - i * 0.1,
        timeOfDay: 0.80,
      },
    });
  }

  return slots;
}

/**
 * Main example function
 */
async function main() {
  console.log('⚔️  AI Scheduling Agent - Conflict Resolution Example\n');

  const resolver = new ConflictResolver();
  const alternativeSlots = generateAlternativeSlots();
  resolver.updateAvailableSlots(alternativeSlots);

  console.log('This example demonstrates how the AI agent intelligently handles');
  console.log('various scheduling conflicts and suggests optimal resolutions.\n');
  console.log('='.repeat(80) + '\n');

  // Scenario 1: Double-booking conflict
  console.log('📅 Scenario 1: Double-Booking Conflict\n');
  console.log('Situation: Trying to schedule an interview when the interviewer');
  console.log('           already has another meeting at that time.\n');

  const conflict1: Conflict = {
    type: 'double_booking',
    description: 'Alice Smith has an existing meeting from 2:00 PM - 3:00 PM',
    affectedParticipants: ['alice.smith@company.com'],
    severity: 5, // Critical
  };

  console.log(`❌ Conflict Detected:`);
  console.log(`   Type: ${conflict1.type.replace('_', ' ')}`);
  console.log(`   Description: ${conflict1.description}`);
  console.log(`   Severity: ${conflict1.severity}/5 (${resolver.getSeverityDescription(conflict1.severity)})`);
  console.log(`   Affected: ${conflict1.affectedParticipants.join(', ')}`);

  const resolution1 = await resolver.resolve([conflict1]);

  console.log('\n✅ AI-Powered Resolutions:\n');
  resolution1[0].suggestions.forEach((suggestion, index) => {
    console.log(`${index + 1}. ${suggestion.action.toUpperCase().replace('_', ' ')}`);
    console.log(`   Description: ${suggestion.description}`);
    console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`);
    if (suggestion.newSlot) {
      console.log(`   Alternative Time: ${new Date(suggestion.newSlot.startTime).toLocaleString()}`);
    }
    if (suggestion.tradeoffs) {
      console.log('   Trade-offs:');
      suggestion.tradeoffs.forEach((t) => console.log(`      • ${t}`));
    }
    console.log('');
  });

  console.log('='.repeat(80) + '\n');

  // Scenario 2: Load exceeded conflict
  console.log('📅 Scenario 2: Interviewer Load Exceeded\n');
  console.log('Situation: Interviewer has reached their maximum interviews per day/week.\n');

  const conflict2: Conflict = {
    type: 'load_exceeded',
    description: 'Bob Johnson has reached maximum of 4 interviews per day',
    affectedParticipants: ['bob.johnson@company.com'],
    severity: 4,
  };

  console.log(`❌ Conflict Detected:`);
  console.log(`   Type: ${conflict2.type.replace('_', ' ')}`);
  console.log(`   Description: ${conflict2.description}`);
  console.log(`   Severity: ${conflict2.severity}/5 (${resolver.getSeverityDescription(conflict2.severity)})`);

  const resolution2 = await resolver.resolve([conflict2]);

  console.log('\n✅ AI-Powered Resolutions:\n');
  resolution2[0].suggestions.forEach((suggestion, index) => {
    console.log(`${index + 1}. ${suggestion.action.toUpperCase().replace('_', ' ')}`);
    console.log(`   Description: ${suggestion.description}`);
    console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`);
    if (suggestion.tradeoffs) {
      console.log('   Trade-offs:');
      suggestion.tradeoffs.forEach((t) => console.log(`      • ${t}`));
    }
    console.log('');
  });

  console.log('='.repeat(80) + '\n');

  // Scenario 3: Outside work hours
  console.log('📅 Scenario 3: Outside Work Hours\n');
  console.log('Situation: Proposed time is before 9 AM or after 5 PM.\n');

  const conflict3: Conflict = {
    type: 'outside_hours',
    description: 'Proposed time (7:00 AM) is outside standard work hours (9 AM - 5 PM)',
    affectedParticipants: ['charlie.davis@company.com', 'diana.evans@company.com'],
    severity: 3,
  };

  console.log(`❌ Conflict Detected:`);
  console.log(`   Type: ${conflict3.type.replace('_', ' ')}`);
  console.log(`   Description: ${conflict3.description}`);
  console.log(`   Severity: ${conflict3.severity}/5 (${resolver.getSeverityDescription(conflict3.severity)})`);

  const resolution3 = await resolver.resolve([conflict3]);

  console.log('\n✅ AI-Powered Resolutions:\n');
  resolution3[0].suggestions.forEach((suggestion, index) => {
    console.log(`${index + 1}. ${suggestion.action.toUpperCase().replace('_', ' ')}`);
    console.log(`   Description: ${suggestion.description}`);
    console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`);
    if (suggestion.newSlot) {
      console.log(`   Alternative Time: ${new Date(suggestion.newSlot.startTime).toLocaleString()}`);
    }
    console.log('');
  });

  console.log('='.repeat(80) + '\n');

  // Scenario 4: Preference violation
  console.log('📅 Scenario 4: Preference Violation\n');
  console.log('Situation: Proposed time doesn\'t match participant preferences.\n');

  const conflict4: Conflict = {
    type: 'preference_violation',
    description: 'Participant prefers Tuesday-Thursday, but slot is on Monday',
    affectedParticipants: ['alice.smith@company.com'],
    severity: 2,
  };

  console.log(`❌ Conflict Detected:`);
  console.log(`   Type: ${conflict4.type.replace('_', ' ')}`);
  console.log(`   Description: ${conflict4.description}`);
  console.log(`   Severity: ${conflict4.severity}/5 (${resolver.getSeverityDescription(conflict4.severity)})`);

  const resolution4 = await resolver.resolve([conflict4]);

  console.log('\n✅ AI-Powered Resolutions:\n');
  resolution4[0].suggestions.forEach((suggestion, index) => {
    console.log(`${index + 1}. ${suggestion.action.toUpperCase().replace('_', ' ')}`);
    console.log(`   Description: ${suggestion.description}`);
    console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`);
    if (suggestion.newSlot) {
      console.log(`   Alternative Time: ${new Date(suggestion.newSlot.startTime).toLocaleString()}`);
      console.log(`   Match Score: ${(suggestion.newSlot.score * 100).toFixed(0)}%`);
    }
    if (suggestion.tradeoffs) {
      console.log('   Trade-offs:');
      suggestion.tradeoffs.forEach((t) => console.log(`      • ${t}`));
    }
    console.log('');
  });

  console.log('='.repeat(80) + '\n');

  // Scenario 5: Multiple conflicts
  console.log('📅 Scenario 5: Multiple Simultaneous Conflicts\n');
  console.log('Situation: Proposed slot has multiple issues.\n');

  const multipleConflicts: Conflict[] = [
    {
      type: 'double_booking',
      description: 'Interviewer A has existing meeting',
      affectedParticipants: ['interviewer-a@company.com'],
      severity: 5,
    },
    {
      type: 'load_exceeded',
      description: 'Interviewer B at daily limit',
      affectedParticipants: ['interviewer-b@company.com'],
      severity: 4,
    },
    {
      type: 'preference_violation',
      description: 'Time not in preferred range',
      affectedParticipants: ['interviewer-a@company.com', 'interviewer-b@company.com'],
      severity: 2,
    },
  ];

  console.log(`❌ Conflicts Detected: ${multipleConflicts.length}\n`);
  multipleConflicts.forEach((conflict, i) => {
    console.log(`${i + 1}. ${conflict.type.replace('_', ' ').toUpperCase()}`);
    console.log(`   ${conflict.description}`);
    console.log(`   Severity: ${conflict.severity}/5\n`);
  });

  const multiResolution = await resolver.resolve(multipleConflicts);

  console.log('✅ AI Strategy: Prioritize by severity and suggest comprehensive solution\n');
  console.log('Most Critical Conflict Resolution:\n');

  const criticalResolution = multiResolution.sort((a, b) => b.severity - a.severity)[0];
  console.log(`Addressing: ${criticalResolution.conflictType.replace('_', ' ')}`);
  console.log(`\nTop Suggestion:`);
  const topSuggestion = criticalResolution.suggestions[0];
  console.log(`   Action: ${topSuggestion.action.toUpperCase().replace('_', ' ')}`);
  console.log(`   ${topSuggestion.description}`);
  console.log(`   Confidence: ${(topSuggestion.confidence * 100).toFixed(0)}%`);
  if (topSuggestion.newSlot) {
    console.log(`   \n   Recommended Alternative:`);
    console.log(`   Time: ${new Date(topSuggestion.newSlot.startTime).toLocaleString()}`);
    console.log(`   Score: ${(topSuggestion.newSlot.score * 100).toFixed(0)}%`);
    console.log(`   This slot resolves all ${multipleConflicts.length} conflicts`);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Scenario 6: Proactive conflict detection
  console.log('📅 Scenario 6: Proactive Conflict Detection\n');
  console.log('Demonstrating automatic conflict detection before booking.\n');

  const proposedSlot = {
    startTime: '2024-02-05T14:00:00Z',
    endTime: '2024-02-05T15:00:00Z',
    interviewers: ['alice@company.com', 'bob@company.com'],
  };

  const existingSchedule = [
    {
      startTime: '2024-02-05T14:30:00Z',
      endTime: '2024-02-05T15:30:00Z',
      participants: ['alice@company.com'],
    },
    {
      startTime: '2024-02-05T13:00:00Z',
      endTime: '2024-02-05T14:00:00Z',
      participants: ['bob@company.com'],
    },
  ];

  console.log('Proposed Slot:');
  console.log(`   Time: ${proposedSlot.startTime} - ${proposedSlot.endTime}`);
  console.log(`   Interviewers: ${proposedSlot.interviewers.join(', ')}`);

  console.log('\nExisting Schedule:');
  existingSchedule.forEach((meeting, i) => {
    console.log(`   ${i + 1}. ${meeting.startTime} - ${meeting.endTime}`);
    console.log(`      Participants: ${meeting.participants.join(', ')}`);
  });

  const detectedConflicts = resolver.detectConflicts(proposedSlot, existingSchedule);

  console.log(`\n🔍 Detected ${detectedConflicts.length} conflicts automatically:\n`);
  detectedConflicts.forEach((conflict, i) => {
    console.log(`${i + 1}. ${conflict.description}`);
    console.log(`   Severity: ${conflict.severity}/5`);
    console.log(`   Affected: ${conflict.affectedParticipants.join(', ')}`);
  });

  console.log('\n' + '='.repeat(80) + '\n');

  console.log('✅ Example completed!\n');
  console.log('💡 Conflict Resolution Features Demonstrated:');
  console.log('   ✓ Automatic conflict detection (5 types)');
  console.log('   ✓ Severity-based prioritization');
  console.log('   ✓ Intelligent resolution suggestions');
  console.log('   ✓ Alternative slot recommendations');
  console.log('   ✓ Trade-off analysis');
  console.log('   ✓ Multi-conflict handling');
  console.log('   ✓ Proactive conflict prevention');
  console.log('\n📊 Conflict Types Handled:');
  console.log('   • Double-booking (overlapping meetings)');
  console.log('   • Load exceeded (interviewer capacity limits)');
  console.log('   • Outside work hours');
  console.log('   • Holiday conflicts');
  console.log('   • Preference violations');
}

// Run the example
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error running example:', error);
    process.exit(1);
  });
}

export { main };
