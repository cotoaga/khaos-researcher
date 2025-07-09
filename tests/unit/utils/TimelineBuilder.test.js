import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineBuilder } from '../../../src/utils/TimelineBuilder.js';

describe('TimelineBuilder', () => {
  let timelineBuilder;

  beforeEach(() => {
    timelineBuilder = new TimelineBuilder();
  });

  describe('buildMonthlyFoundation', () => {
    it('should build monthly foundation with 30+ data points', () => {
      const timeline = timelineBuilder.buildMonthlyFoundation();
      
      expect(timeline).toBeDefined();
      expect(timeline.length).toBeGreaterThan(30);
      expect(timeline[0].date).toBe('2023-01');
      expect(timeline[0].models).toBe(121000);
      expect(timeline[timeline.length - 1].date).toBe('2025-07');
      expect(timeline[timeline.length - 1].models).toBe(1890000);
    });

    it('should include all required fields for each data point', () => {
      const timeline = timelineBuilder.buildMonthlyFoundation();
      
      timeline.forEach(point => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('models');
        expect(point).toHaveProperty('type');
        expect(point).toHaveProperty('source');
        expect(point).toHaveProperty('phase');
        expect(typeof point.models).toBe('number');
        expect(point.models).toBeGreaterThan(0);
      });
    });

    it('should have monotonic growth', () => {
      const timeline = timelineBuilder.buildMonthlyFoundation();
      
      for (let i = 1; i < timeline.length; i++) {
        expect(timeline[i].models).toBeGreaterThan(timeline[i - 1].models);
      }
    });
  });

  describe('getGrowthPhases', () => {
    it('should identify growth phases (foundation, acceleration, exponential)', () => {
      const phases = timelineBuilder.getGrowthPhases();
      
      expect(phases).toHaveLength(3);
      expect(phases[0].name).toBe('Foundation Era');
      expect(phases[0].start).toBe('2023-01');
      expect(phases[0].end).toBe('2023-12');
      
      expect(phases[1].name).toBe('Acceleration Phase');
      expect(phases[1].start).toBe('2024-01');
      expect(phases[1].end).toBe('2024-12');
      
      expect(phases[2].name).toBe('Exponential Era');
      expect(phases[2].start).toBe('2025-01');
      expect(phases[2].end).toBe('2025-07');
    });

    it('should include color and description for each phase', () => {
      const phases = timelineBuilder.getGrowthPhases();
      
      phases.forEach(phase => {
        expect(phase).toHaveProperty('color');
        expect(phase).toHaveProperty('description');
        expect(phase).toHaveProperty('avgGrowth');
        expect(typeof phase.color).toBe('string');
        expect(typeof phase.description).toBe('string');
      });
    });
  });

  describe('calculateInsights', () => {
    it('should calculate meaningful insights (15.6x growth, etc.)', () => {
      const timeline = timelineBuilder.buildMonthlyFoundation();
      const insights = timelineBuilder.calculateInsights(timeline);
      
      expect(insights).toHaveProperty('totalGrowth');
      expect(insights).toHaveProperty('growthMultiplier');
      expect(insights).toHaveProperty('avgMonthlyGrowth');
      expect(insights).toHaveProperty('monthsSpanned');
      expect(insights).toHaveProperty('timespan');
      expect(insights).toHaveProperty('inflectionPoint');
      
      expect(parseFloat(insights.growthMultiplier)).toBeCloseTo(15.6, 1);
      expect(insights.totalGrowth).toBe(1890000 - 121000);
      expect(insights.monthsSpanned).toBe(timeline.length - 1);
    });
  });

  describe('validateTimeline', () => {
    it('should validate monotonic growth', () => {
      const badTimeline = [
        { date: '2023-01', models: 121000 },
        { date: '2023-02', models: 135000 },
        { date: '2023-03', models: 120000 }, // Anomaly - should be fixed
        { date: '2023-04', models: 149000 }
      ];
      
      const validated = timelineBuilder.validateTimeline(badTimeline);
      
      for (let i = 1; i < validated.length; i++) {
        expect(validated[i].models).toBeGreaterThan(validated[i - 1].models);
      }
    });

    it('should preserve valid data points', () => {
      const timeline = timelineBuilder.buildMonthlyFoundation();
      const validated = timelineBuilder.validateTimeline(timeline);
      
      expect(validated.length).toBe(timeline.length);
      expect(validated[0].models).toBe(121000);
      expect(validated[validated.length - 1].models).toBe(1890000);
    });
  });

  describe('findInflectionPoint', () => {
    it('should find the point where growth really took off', () => {
      const timeline = timelineBuilder.buildMonthlyFoundation();
      const inflectionPoint = timelineBuilder.findInflectionPoint(timeline);
      
      expect(inflectionPoint).toBeDefined();
      expect(inflectionPoint).toHaveProperty('date');
      expect(inflectionPoint).toHaveProperty('models');
      expect(inflectionPoint.date).toMatch(/202[3-5]-/); // Should be in 2023-2025 range
    });
  });

  describe('generateNarrative', () => {
    it('should generate compelling narrative insights', () => {
      const timeline = timelineBuilder.buildMonthlyFoundation();
      const narrative = timelineBuilder.generateNarrative(timeline);
      
      expect(narrative).toHaveProperty('headline');
      expect(narrative).toHaveProperty('story');
      expect(narrative).toHaveProperty('phases');
      expect(narrative).toHaveProperty('insights');
      expect(narrative).toHaveProperty('keyPoints');
      
      expect(narrative.headline).toContain('15.6x Growth');
      expect(narrative.story).toContain('121,000');
      expect(narrative.story).toContain('1,890,000');
      expect(narrative.keyPoints).toHaveLength(3);
    });
  });

  describe('addDailyTracking', () => {
    it('should handle daily tracking integration', async () => {
      const monthlyBaseline = timelineBuilder.buildMonthlyFoundation();
      const currentLiveCount = 1950000;
      
      const enhanced = await timelineBuilder.addDailyTracking(monthlyBaseline, currentLiveCount);
      
      expect(enhanced).toBeDefined();
      expect(enhanced.length).toBeGreaterThanOrEqual(monthlyBaseline.length);
      
      // If we're in a future month, should add daily tracking
      const today = new Date();
      const currentMonth = today.toISOString().substring(0, 7);
      const lastMonthlyPoint = monthlyBaseline[monthlyBaseline.length - 1];
      
      if (currentMonth > lastMonthlyPoint.date) {
        expect(enhanced.length).toBe(monthlyBaseline.length + 1);
        expect(enhanced[enhanced.length - 1].type).toBe('daily-live');
        expect(enhanced[enhanced.length - 1].models).toBe(currentLiveCount);
      }
    });
  });

  describe('getTimeSpan', () => {
    it('should return proper time span description', () => {
      const timeline = timelineBuilder.buildMonthlyFoundation();
      const timeSpan = timelineBuilder.getTimeSpan(timeline);
      
      expect(timeSpan).toBe('2023-01 to 2025-07');
    });
  });
});