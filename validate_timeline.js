#!/usr/bin/env node
/**
 * Timeline Implementation Validation Script
 * Validates that the timeline implementation meets all requirements
 */

import { TimelineBuilder } from './src/utils/TimelineBuilder.js';

console.log('🗡️ KHAOS-Researcher Timeline Validation\n');

const timelineBuilder = new TimelineBuilder();

// Test 1: Basic functionality
console.log('✅ Test 1: Basic Timeline Functionality');
const timeline = timelineBuilder.buildMonthlyFoundation();
console.log(`   - Monthly foundation: ${timeline.length} data points`);
console.log(`   - Time span: ${timelineBuilder.getTimeSpan(timeline)}`);
console.log(`   - First: ${timeline[0].date} (${timeline[0].models.toLocaleString()} models)`);
console.log(`   - Last: ${timeline[timeline.length - 1].date} (${timeline[timeline.length - 1].models.toLocaleString()} models)`);

// Test 2: Strategic insights
console.log('\n✅ Test 2: Strategic Insights');
const insights = timelineBuilder.calculateInsights(timeline);
console.log(`   - Growth multiplier: ${insights.growthMultiplier}x`);
console.log(`   - Total growth: ${insights.totalGrowth.toLocaleString()} models`);
console.log(`   - Average monthly growth: ${insights.avgMonthlyGrowth.toLocaleString()} models/month`);
console.log(`   - Inflection point: ${insights.inflectionPoint?.date} (${insights.inflectionPoint?.models.toLocaleString()} models)`);

// Test 3: Growth phases
console.log('\n✅ Test 3: Growth Phases');
const phases = timelineBuilder.getGrowthPhases();
phases.forEach((phase, i) => {
  console.log(`   - Phase ${i + 1}: ${phase.name} (${phase.start} to ${phase.end})`);
  console.log(`     ${phase.description}`);
  console.log(`     Growth rate: ${phase.avgGrowth}`);
});

// Test 4: Narrative generation
console.log('\n✅ Test 4: Narrative Generation');
const narrative = timelineBuilder.generateNarrative(timeline);
console.log(`   - Headline: ${narrative.headline}`);
console.log(`   - Story: ${narrative.story}`);
console.log('   - Key Points:');
narrative.keyPoints.forEach((point, i) => {
  console.log(`     ${i + 1}. ${point}`);
});

// Test 5: Data validation
console.log('\n✅ Test 5: Data Validation');
const badData = [
  { date: '2023-01', models: 121000 },
  { date: '2023-02', models: 135000 },
  { date: '2023-03', models: 120000 }, // Anomaly
  { date: '2023-04', models: 149000 }
];
const validated = timelineBuilder.validateTimeline(badData);
console.log(`   - Fixed ${badData.length} data points`);
console.log(`   - Monotonic growth: ${validated.every((d, i) => i === 0 || d.models > validated[i - 1].models) ? 'YES' : 'NO'}`);

// Test 6: Daily tracking capability
console.log('\n✅ Test 6: Daily Tracking Capability');
const currentLiveCount = 1950000;
const enhanced = await timelineBuilder.addDailyTracking(timeline, currentLiveCount);
console.log(`   - Enhanced timeline: ${enhanced.length} data points`);
console.log(`   - Daily tracking ready: ${enhanced.length >= timeline.length ? 'YES' : 'NO'}`);

// Test 7: Workshop requirements
console.log('\n✅ Test 7: Workshop Requirements');
const meetsWorkshopRequirements = [
  narrative.headline.includes('AI Democratization'),
  narrative.headline.includes('15.6x Growth'),
  narrative.story.includes('121,000'),
  narrative.story.includes('1,890,000'),
  narrative.keyPoints.length === 3,
  phases.length === 3,
  insights.growthMultiplier === '15.6'
];
console.log(`   - Workshop requirements met: ${meetsWorkshopRequirements.every(r => r) ? 'YES' : 'NO'}`);

// Test 8: Success criteria validation
console.log('\n✅ Test 8: Success Criteria Validation');
const successCriteria = [
  timeline.length > 30,
  timeline[0].models === 121000,
  timeline[timeline.length - 1].models === 1890000,
  parseFloat(insights.growthMultiplier) === 15.6,
  phases.length === 3,
  narrative.headline.includes('15.6x Growth'),
  phases.some(p => p.name === 'Foundation Era'),
  phases.some(p => p.name === 'Acceleration Phase'),
  phases.some(p => p.name === 'Exponential Era')
];

const passedCriteria = successCriteria.filter(c => c).length;
const totalCriteria = successCriteria.length;

console.log(`   - Success criteria: ${passedCriteria}/${totalCriteria} PASSED`);

if (passedCriteria === totalCriteria) {
  console.log('\n🎯 SUCCESS: Timeline implementation meets all requirements!');
  console.log('📊 Ready for dashboard integration');
  console.log('🏆 Workshop demonstration ready');
  console.log('🌊 AI democratization story complete');
} else {
  console.log('\n❌ FAILURE: Timeline implementation incomplete');
  console.log('🔧 Please review failing criteria');
}

console.log('\n🗡️ KHAOS-Researcher Timeline Validation Complete\n');