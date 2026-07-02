/**
 * COT-71 Task 3: GET /api/timeline
 *
 * Returns timelineData reconstructed from Supabase entities/valuations/edges.
 * Powers the gem's live-data fetch path; the gem falls back to timeline-data.js
 * if this endpoint is unreachable.
 *
 * Cache: 1 hour (Vercel edge cache via Cache-Control).
 */

import { buildTimelineData } from '../scripts/generate-timeline.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const data = await buildTimelineData();

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
      success: true,
      data,
      generatedAt: new Date().toISOString(),
      source: 'supabase'
    });
  } catch (error) {
    console.error('Timeline generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate timeline data',
      message: error.message
    });
  }
}
