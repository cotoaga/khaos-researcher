import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Fallback hardcoded data for when table doesn't exist yet
 * Matches the seed data from schema/ecosystem_snapshots.sql
 */
function getHardcodedSnapshots() {
  const snapshots = [
    { captured_at: '2023-01-15T12:00:00Z', total_models: 121000, curated_models: 50, providers_count: 15 },
    { captured_at: '2023-06-15T12:00:00Z', total_models: 239000, curated_models: 65, providers_count: 22 },
    { captured_at: '2023-10-15T12:00:00Z', total_models: 371000, curated_models: 85, providers_count: 28 },
    { captured_at: '2023-12-15T12:00:00Z', total_models: 420000, curated_models: 95, providers_count: 32 },
    { captured_at: '2024-03-15T12:00:00Z', total_models: 510000, curated_models: 105, providers_count: 35 },
    { captured_at: '2024-06-15T12:00:00Z', total_models: 645000, curated_models: 120, providers_count: 38 },
    { captured_at: '2024-09-15T12:00:00Z', total_models: 825000, curated_models: 135, providers_count: 42 },
    { captured_at: '2024-12-15T12:00:00Z', total_models: 1050000, curated_models: 150, providers_count: 45 },
    { captured_at: '2025-01-15T12:00:00Z', total_models: 1140000, curated_models: 155, providers_count: 46 },
    { captured_at: '2025-03-15T12:00:00Z', total_models: 1350000, curated_models: 160, providers_count: 47 },
    { captured_at: '2025-05-15T12:00:00Z', total_models: 1600000, curated_models: 163, providers_count: 47 },
    { captured_at: '2025-07-15T12:00:00Z', total_models: 1890000, curated_models: 165, providers_count: 47 }
  ];

  return snapshots.map((s, index) => {
    const previous = index > 0 ? snapshots[index - 1] : null;
    return {
      ...s,
      date: s.captured_at,
      models: s.total_models,
      growth: previous ? ((s.total_models - previous.total_models) / previous.total_models * 100).toFixed(2) : 0,
      phase: s.captured_at < '2024-01-01' ? 'foundation' :
             s.captured_at < '2025-01-01' ? 'acceleration' : 'exponential',
      type: 'historical',
      is_interpolated: true,
      growth_rate_per_day: null
    };
  });
}

function getHardcodedLatest() {
  return {
    totalModels: 1890000,
    curatedModels: 165,
    providersCount: 47,
    capturedAt: '2025-07-15T12:00:00Z',
    growthRatePerDay: null,
    avgVelocity: null
  };
}

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
      // If table doesn't exist yet, return hardcoded historical data
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('⚠️ ecosystem_snapshots table not found, using hardcoded data');
        return res.status(200).json({
          success: true,
          snapshots: getHardcodedSnapshots(),
          latest: getHardcodedLatest(),
          metadata: {
            count: 12,
            firstSnapshot: '2023-01-15T12:00:00Z',
            lastSnapshot: '2025-07-15T12:00:00Z',
            message: 'Using historical data. Run schema/ecosystem_snapshots.sql to enable live tracking.'
          }
        });
      }
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
