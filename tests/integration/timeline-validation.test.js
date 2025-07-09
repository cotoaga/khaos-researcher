import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineBuilder } from '../../src/utils/TimelineBuilder.js';

describe('Timeline Integration Validation', () => {
  let timelineBuilder;

  beforeEach(() => {
    timelineBuilder = new TimelineBuilder();
  });

  it('should validate complete timeline implementation', () => {
    const timeline = timelineBuilder.buildMonthlyFoundation();
    const insights = timelineBuilder.calculateInsights(timeline);
    const narrative = timelineBuilder.generateNarrative(timeline);
    
    // Verify timeline meets all requirements
    expect(timeline.length).toBeGreaterThan(30);
    expect(timeline[0].date).toBe('2023-01');
    expect(timeline[0].models).toBe(121000);
    expect(timeline[timeline.length - 1].date).toBe('2025-07');
    expect(timeline[timeline.length - 1].models).toBe(1890000);
    
    // Verify insights meet strategic requirements
    expect(parseFloat(insights.growthMultiplier)).toBeCloseTo(15.6, 1);
    expect(insights.totalGrowth).toBe(1769000);
    
    // Verify narrative meets requirements
    expect(narrative.headline).toContain('15.6x Growth');
    expect(narrative.story).toContain('121,000');
    expect(narrative.story).toContain('1,890,000');
    expect(narrative.keyPoints).toHaveLength(3);
    
    // Verify growth phases
    const phases = timelineBuilder.getGrowthPhases();
    expect(phases).toHaveLength(3);
    expect(phases[0].name).toBe('Foundation Era');
    expect(phases[1].name).toBe('Acceleration Phase');
    expect(phases[2].name).toBe('Exponential Era');
  });

  it('should validate timeline data structure matches dashboard requirements', () => {
    const timeline = timelineBuilder.buildMonthlyFoundation();
    
    // Sample data points for dashboard integration
    const dashboardData = [
      { date: '2023-01', models: 121000, phase: 'foundation', type: 'historical' },
      { date: '2023-06', models: 239000, phase: 'foundation', type: 'historical' },
      { date: '2024-12', models: 1050000, phase: 'acceleration', type: 'milestone' },
      { date: '2025-07', models: 1890000, phase: 'exponential', type: 'current-estimate' }
    ];

    // Verify dashboard data structure
    dashboardData.forEach(point => {
      expect(point).toHaveProperty('date');
      expect(point).toHaveProperty('models');
      expect(point).toHaveProperty('phase');
      expect(point).toHaveProperty('type');
      expect(typeof point.models).toBe('number');
      expect(point.models).toBeGreaterThan(0);
    });

    // Verify monotonic growth
    for (let i = 1; i < dashboardData.length; i++) {
      expect(dashboardData[i].models).toBeGreaterThan(dashboardData[i - 1].models);
    }

    // Verify timeline foundation matches dashboard expectations
    expect(timeline[0].models).toBe(dashboardData[0].models);
    expect(timeline[timeline.length - 1].models).toBe(dashboardData[dashboardData.length - 1].models);
  });

  it('should validate inflection point detection', () => {
    const timeline = timelineBuilder.buildMonthlyFoundation();
    const inflectionPoint = timelineBuilder.findInflectionPoint(timeline);
    
    expect(inflectionPoint).toBeDefined();
    expect(inflectionPoint.date).toMatch(/202[3-5]-/);
    expect(inflectionPoint.models).toBeGreaterThan(0);
  });

  it('should validate milestone markers', () => {
    const timeline = timelineBuilder.buildMonthlyFoundation();
    const milestones = timeline.filter(d => d.models >= 1000000);
    
    expect(milestones.length).toBeGreaterThan(0);
    expect(milestones[0].models).toBeGreaterThanOrEqual(1000000);
  });

  it('should validate phase transitions', () => {
    const timeline = timelineBuilder.buildMonthlyFoundation();
    
    const foundationPhase = timeline.filter(d => d.phase === 'foundation');
    const accelerationPhase = timeline.filter(d => d.phase === 'acceleration');
    const exponentialPhase = timeline.filter(d => d.phase === 'exponential');
    
    expect(foundationPhase.length).toBeGreaterThan(0);
    expect(accelerationPhase.length).toBeGreaterThan(0);
    expect(exponentialPhase.length).toBeGreaterThan(0);
    
    // Verify phase transitions are chronological
    expect(foundationPhase[0].date).toBe('2023-01');
    expect(accelerationPhase[0].date).toBe('2024-01');
    expect(exponentialPhase[0].date).toBe('2025-01');
  });

  it('should validate timeline meets workshop requirements', () => {
    const timeline = timelineBuilder.buildMonthlyFoundation();
    const narrative = timelineBuilder.generateNarrative(timeline);
    
    // Workshop demonstration requirements
    expect(narrative.headline).toContain('AI Democratization');
    expect(narrative.headline).toContain('15.6x Growth');
    expect(narrative.story).toContain('121,000');
    expect(narrative.story).toContain('1,890,000');
    
    // Strategic insights for EU AI Act workshops
    expect(narrative.keyPoints[0]).toContain('models per month');
    expect(narrative.keyPoints[1]).toContain('Inflection point');
    expect(narrative.keyPoints[2]).toContain('Exponential Era');
  });

  it('should validate data validation functionality', () => {
    const badTimeline = [
      { date: '2023-01', models: 121000 },
      { date: '2023-02', models: 135000 },
      { date: '2023-03', models: 120000 }, // Anomaly
      { date: '2023-04', models: 149000 }
    ];
    
    const validated = timelineBuilder.validateTimeline(badTimeline);
    
    // Verify validation fixes anomalies
    for (let i = 1; i < validated.length; i++) {
      expect(validated[i].models).toBeGreaterThan(validated[i - 1].models);
    }
  });

  it('should validate daily tracking capability', async () => {
    const monthlyBaseline = timelineBuilder.buildMonthlyFoundation();
    const currentLiveCount = 1950000;
    
    const enhanced = await timelineBuilder.addDailyTracking(monthlyBaseline, currentLiveCount);
    
    expect(enhanced).toBeDefined();
    expect(enhanced.length).toBeGreaterThanOrEqual(monthlyBaseline.length);
  });
});