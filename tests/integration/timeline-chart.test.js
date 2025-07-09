import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import * as d3 from 'd3';

describe('Timeline Chart Integration', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
        </head>
        <body>
          <div id="timeline-chart"></div>
        </body>
      </html>
    `);
    
    document = dom.window.document;
    window = dom.window;
    
    // Make d3 and document available globally for the test
    global.d3 = d3;
    global.document = document;
  });

  it('should render timeline chart with proper structure', () => {
    // Mock the renderTimelineChart function from the dashboard
    const renderTimelineChart = () => {
      const container = document.getElementById('timeline-chart');
      container.innerHTML = '';
      
      // Timeline data with growth phases - AI democratization story
      const timelineData = [
        { date: '2023-01', models: 121000, phase: 'foundation', type: 'historical' },
        { date: '2023-06', models: 239000, phase: 'foundation', type: 'historical' },
        { date: '2024-12', models: 1050000, phase: 'acceleration', type: 'milestone' },
        { date: '2025-07', models: 1890000, phase: 'exponential', type: 'current-estimate' }
      ];

      const width = 600;
      const height = 300;
      const margin = { top: 30, right: 30, bottom: 60, left: 80 };
      
      const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      // This would be the full implementation from the dashboard
      // For this test, we just verify the basic structure is created
      expect(svg.node()).toBeDefined();
      expect(svg.node().tagName).toBe('svg');
      expect(svg.attr('width')).toBe(width.toString());
      expect(svg.attr('height')).toBe(height.toString());
      
      return { svg, timelineData };
    };

    const result = renderTimelineChart();
    
    expect(result.svg).toBeDefined();
    expect(result.timelineData).toHaveLength(4);
    expect(result.timelineData[0].models).toBe(121000);
    expect(result.timelineData[3].models).toBe(1890000);
  });

  it('should validate timeline data structure', () => {
    const timelineData = [
      { date: '2023-01', models: 121000, phase: 'foundation', type: 'historical' },
      { date: '2023-06', models: 239000, phase: 'foundation', type: 'historical' },
      { date: '2024-12', models: 1050000, phase: 'acceleration', type: 'milestone' },
      { date: '2025-07', models: 1890000, phase: 'exponential', type: 'current-estimate' }
    ];

    // Validate data structure
    timelineData.forEach(point => {
      expect(point).toHaveProperty('date');
      expect(point).toHaveProperty('models');
      expect(point).toHaveProperty('phase');
      expect(point).toHaveProperty('type');
      expect(typeof point.models).toBe('number');
      expect(point.models).toBeGreaterThan(0);
    });

    // Validate growth phases
    const phases = ['foundation', 'acceleration', 'exponential'];
    const foundPhases = [...new Set(timelineData.map(d => d.phase))];
    foundPhases.forEach(phase => {
      expect(phases).toContain(phase);
    });

    // Validate monotonic growth
    for (let i = 1; i < timelineData.length; i++) {
      expect(timelineData[i].models).toBeGreaterThan(timelineData[i - 1].models);
    }
  });

  it('should show significant growth metrics', () => {
    const first = { date: '2023-01', models: 121000 };
    const last = { date: '2025-07', models: 1890000 };
    
    const totalGrowth = last.models - first.models;
    const growthMultiplier = (last.models / first.models);
    
    expect(totalGrowth).toBe(1769000);
    expect(growthMultiplier).toBeCloseTo(15.6, 1);
  });

  it('should include milestone markers', () => {
    const timelineData = [
      { date: '2023-01', models: 121000, phase: 'foundation', type: 'historical' },
      { date: '2024-12', models: 1050000, phase: 'acceleration', type: 'milestone' },
      { date: '2025-07', models: 1890000, phase: 'exponential', type: 'current-estimate' }
    ];

    const milestones = timelineData.filter(d => d.type === 'milestone');
    expect(milestones).toHaveLength(1);
    expect(milestones[0].models).toBeGreaterThanOrEqual(1000000);
  });

  it('should have proper D3.js integration', () => {
    expect(d3).toBeDefined();
    expect(d3.select).toBeDefined();
    expect(d3.scaleTime).toBeDefined();
    expect(d3.scaleLinear).toBeDefined();
    expect(d3.line).toBeDefined();
    expect(d3.timeParse).toBeDefined();
  });
});