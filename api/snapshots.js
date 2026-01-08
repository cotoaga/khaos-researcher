import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all snapshots ordered by date
    const { data: snapshots, error } = await supabase
      .from('ecosystem_snapshots')
      .select('*')
      .order('captured_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Calculate additional metrics for frontend
    const enrichedSnapshots = snapshots.map((snapshot, index) => {
      const previous = index > 0 ? snapshots[index - 1] : null;

      return {
        ...snapshot,
        // Format for D3
        date: snapshot.captured_at,
        models: snapshot.total_models,
        // Calculate growth if not already present
        growth: previous
          ? ((snapshot.total_models - previous.total_models) / previous.total_models * 100).toFixed(2)
          : 0,
        // Determine phase based on date
        phase: snapshot.captured_at < '2024-01-01' ? 'foundation' :
               snapshot.captured_at < '2025-01-01' ? 'acceleration' : 'exponential',
        // Type indicator
        type: snapshot.is_interpolated ? 'interpolated' : 'actual'
      };
    });

    // Calculate current velocity (last 7 days average)
    const recent = enrichedSnapshots.slice(-7);
    let avgVelocity = null;
    if (recent.length >= 2) {
      const velocities = recent
        .filter(s => s.growth_rate_per_day)
        .map(s => s.growth_rate_per_day);
      avgVelocity = velocities.length > 0
        ? Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length)
        : null;
    }

    // Latest snapshot data
    const latest = snapshots[snapshots.length - 1];

    res.status(200).json({
      success: true,
      snapshots: enrichedSnapshots,
      latest: {
        totalModels: latest?.total_models || 0,
        curatedModels: latest?.curated_models || 0,
        providersCount: latest?.providers_count || 0,
        capturedAt: latest?.captured_at,
        growthRatePerDay: latest?.growth_rate_per_day || 0,
        avgVelocity: avgVelocity
      },
      metadata: {
        count: snapshots.length,
        firstSnapshot: snapshots[0]?.captured_at,
        lastSnapshot: latest?.captured_at
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch snapshots:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
