/**
 * TimelineBuilder.js - Strategic Timeline Intelligence
 * Transforms the AI democratization story into visual intelligence
 */

import { Logger } from './Logger.js';

export class TimelineBuilder {
  constructor() {
    this.logger = new Logger('TimelineBuilder');
  }

  /**
   * Build the monthly historical foundation
   * The story of AI democratization: 121K → 1.8M+ models
   */
  buildMonthlyFoundation() {
    const monthlyData = [
      // The Foundation Era (2023) - Slow and steady
      { date: '2023-01', models: 121000, type: 'historical', source: 'community-report', phase: 'foundation' },
      { date: '2023-02', models: 135000, type: 'interpolated', source: 'estimated', phase: 'foundation' },
      { date: '2023-03', models: 149000, type: 'interpolated', source: 'estimated', phase: 'foundation' },
      { date: '2023-04', models: 172000, type: 'interpolated', source: 'estimated', phase: 'foundation' },
      { date: '2023-05', models: 205000, type: 'interpolated', source: 'estimated', phase: 'foundation' },
      { date: '2023-06', models: 239000, type: 'historical', source: 'community-report', phase: 'foundation' },
      { date: '2023-07', models: 265000, type: 'interpolated', source: 'estimated', phase: 'foundation' },
      { date: '2023-08', models: 294000, type: 'interpolated', source: 'estimated', phase: 'foundation' },
      { date: '2023-09', models: 332000, type: 'interpolated', source: 'estimated', phase: 'foundation' },
      { date: '2023-10', models: 371000, type: 'historical', source: 'community-report', phase: 'foundation' },
      { date: '2023-11', models: 395000, type: 'interpolated', source: 'estimated', phase: 'foundation' },
      { date: '2023-12', models: 420000, type: 'interpolated', source: 'estimated', phase: 'foundation' },
      
      // The Acceleration Phase (2024) - Things heat up
      { date: '2024-01', models: 445000, type: 'interpolated', source: 'estimated', phase: 'acceleration' },
      { date: '2024-02', models: 475000, type: 'interpolated', source: 'estimated', phase: 'acceleration' },
      { date: '2024-03', models: 510000, type: 'interpolated', source: 'estimated', phase: 'acceleration' },
      { date: '2024-04', models: 550000, type: 'interpolated', source: 'estimated', phase: 'acceleration' },
      { date: '2024-05', models: 595000, type: 'interpolated', source: 'estimated', phase: 'acceleration' },
      { date: '2024-06', models: 645000, type: 'interpolated', source: 'estimated', phase: 'acceleration' },
      { date: '2024-07', models: 700000, type: 'interpolated', source: 'estimated', phase: 'acceleration' },
      { date: '2024-08', models: 760000, type: 'interpolated', source: 'estimated', phase: 'acceleration' },
      { date: '2024-09', models: 825000, type: 'interpolated', source: 'estimated', phase: 'acceleration' },
      { date: '2024-10', models: 895000, type: 'interpolated', source: 'estimated', phase: 'acceleration' },
      { date: '2024-11', models: 970000, type: 'interpolated', source: 'estimated', phase: 'acceleration' },
      { date: '2024-12', models: 1050000, type: 'milestone', source: 'estimated', phase: 'acceleration' },
      
      // The Exponential Era (2025) - The explosion
      { date: '2025-01', models: 1140000, type: 'interpolated', source: 'estimated', phase: 'exponential' },
      { date: '2025-02', models: 1240000, type: 'interpolated', source: 'estimated', phase: 'exponential' },
      { date: '2025-03', models: 1350000, type: 'interpolated', source: 'estimated', phase: 'exponential' },
      { date: '2025-04', models: 1470000, type: 'interpolated', source: 'estimated', phase: 'exponential' },
      { date: '2025-05', models: 1600000, type: 'interpolated', source: 'estimated', phase: 'exponential' },
      { date: '2025-06', models: 1740000, type: 'interpolated', source: 'estimated', phase: 'exponential' },
      { date: '2025-07', models: 1890000, type: 'current-estimate', source: 'live-scraping', phase: 'exponential' }
    ];

    this.logger.info(`📅 Monthly foundation: ${monthlyData.length} data points spanning ${this.getTimeSpan(monthlyData)}`);
    return monthlyData;
  }

  /**
   * Add daily tracking for future precision
   */
  async addDailyTracking(monthlyBaseline, currentLiveCount) {
    const today = new Date();
    const currentMonth = today.toISOString().substring(0, 7); // YYYY-MM
    const currentDay = today.toISOString().substring(0, 10); // YYYY-MM-DD

    const lastMonthlyPoint = monthlyBaseline[monthlyBaseline.length - 1];
    
    // If we're in a new month, add daily tracking
    if (currentMonth > lastMonthlyPoint.date) {
      const dailyPoint = {
        date: currentDay,
        models: currentLiveCount,
        type: 'daily-live',
        source: 'live-scraping',
        phase: 'exponential',
        timestamp: new Date().toISOString()
      };

      this.logger.info(`📍 Daily tracking: ${currentDay} - ${currentLiveCount.toLocaleString()} models`);
      return [...monthlyBaseline, dailyPoint];
    }

    return monthlyBaseline;
  }

  /**
   * Get growth phases for visualization
   */
  getGrowthPhases() {
    return [
      {
        name: 'Foundation Era',
        start: '2023-01',
        end: '2023-12',
        color: '#2F6EBA',
        description: 'The calm before the storm: steady growth as community establishes foundation',
        avgGrowth: '~25K models/month'
      },
      {
        name: 'Acceleration Phase',
        start: '2024-01',
        end: '2024-12',
        color: '#6EC1E4',
        description: 'The democratization begins: tools improve, barriers lower, growth accelerates',
        avgGrowth: '~55K models/month'
      },
      {
        name: 'Exponential Era',
        start: '2025-01',
        end: '2025-07',
        color: '#66BB6A',
        description: 'The explosion: AI becomes accessible, every researcher becomes a model creator',
        avgGrowth: '~125K models/month'
      }
    ];
  }

  /**
   * Calculate key insights from timeline
   */
  calculateInsights(timeline) {
    const first = timeline[0];
    const last = timeline[timeline.length - 1];
    
    const totalGrowth = last.models - first.models;
    const monthsSpanned = timeline.length - 1;
    const avgMonthlyGrowth = Math.round(totalGrowth / monthsSpanned);
    const growthMultiplier = (last.models / first.models).toFixed(1);
    
    return {
      totalGrowth,
      monthsSpanned,
      avgMonthlyGrowth,
      growthMultiplier,
      timespan: this.getTimeSpan(timeline),
      inflectionPoint: this.findInflectionPoint(timeline)
    };
  }

  /**
   * Find the inflection point where growth really took off
   */
  findInflectionPoint(timeline) {
    let maxAcceleration = 0;
    let inflectionPoint = null;
    
    for (let i = 2; i < timeline.length - 1; i++) {
      const prev = timeline[i - 1];
      const curr = timeline[i];
      const next = timeline[i + 1];
      
      const acceleration = (next.models - curr.models) - (curr.models - prev.models);
      
      if (acceleration > maxAcceleration) {
        maxAcceleration = acceleration;
        inflectionPoint = curr;
      }
    }
    
    return inflectionPoint;
  }

  /**
   * Get time span description
   */
  getTimeSpan(timeline) {
    const first = timeline[0];
    const last = timeline[timeline.length - 1];
    return `${first.date} to ${last.date}`;
  }

  /**
   * Validate timeline data for monotonic growth
   */
  validateTimeline(timeline) {
    const validated = [];
    let previousCount = 0;

    for (const point of timeline) {
      // Ensure monotonic growth
      if (point.models < previousCount) {
        this.logger.warn(`⚠️ Adjusting anomalous data point: ${point.date} (${point.models} < ${previousCount})`);
        point.models = previousCount + 1000;
      }
      
      validated.push(point);
      previousCount = point.models;
    }

    return validated;
  }

  /**
   * Generate narrative insights for the timeline
   */
  generateNarrative(timeline) {
    const insights = this.calculateInsights(timeline);
    const phases = this.getGrowthPhases();
    
    return {
      headline: `AI Democratization: ${insights.growthMultiplier}x Growth in ${insights.monthsSpanned} Months`,
      story: `From ${timeline[0].models.toLocaleString()} models in ${timeline[0].date} to ${timeline[timeline.length - 1].models.toLocaleString()} models today`,
      phases: phases,
      insights: insights,
      keyPoints: [
        `Average growth: ${insights.avgMonthlyGrowth.toLocaleString()} models per month`,
        `Inflection point: ${insights.inflectionPoint?.date || 'N/A'} (${insights.inflectionPoint?.models.toLocaleString() || 'N/A'} models)`,
        `Current phase: ${phases[phases.length - 1].name} - ${phases[phases.length - 1].description}`
      ]
    };
  }
}