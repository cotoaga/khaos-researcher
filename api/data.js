import { ModelDatabase } from '../src/models/ModelDatabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const database = new ModelDatabase();
    await database.load();

    const [models, stats, discoveries] = await Promise.all([
      database.getAllModels(),
      database.getStats(),
      database.getRecentDiscoveries(5)
    ]);

    // Transform to legacy format for dashboard compatibility
    const modelsObject = {};
    models.forEach(model => {
      const modelKey = `${model.provider}-${model.model_id}`;
      modelsObject[modelKey] = {
        provider: model.provider,
        id: model.model_id,
        created: model.created_at,
        capabilities: model.capabilities,
        metadata: model.metadata,
        lastUpdated: model.updated_at
      };
    });

    // Calculate monthly growth from latest snapshots if available
    let monthlyGrowth = null;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      const { data: recentSnapshots } = await supabase
        .from('ecosystem_snapshots')
        .select('total_models, captured_at')
        .order('captured_at', { ascending: false })
        .limit(2);

      if (recentSnapshots && recentSnapshots.length === 2) {
        const [latest, previous] = recentSnapshots;
        const timeDiff = new Date(latest.captured_at) - new Date(previous.captured_at);
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        const modelsDiff = latest.total_models - previous.total_models;

        if (daysDiff > 0) {
          monthlyGrowth = Math.round((modelsDiff / daysDiff) * 30);
        }
      }
    } catch (err) {
      console.warn('Failed to calculate monthly growth:', err.message);
    }

    res.status(200).json({
      success: true,
      data: {
        metadata: {
          lastUpdate: stats.lastUpdate || new Date().toISOString(),
          version: '2.0.0-supabase-only',
          totalModels: stats.total,
          monthlyGrowth: monthlyGrowth
        },
        models: modelsObject
      },
      stats,
      recentDiscoveries: discoveries,
      timestamp: new Date().toISOString(),
      source: 'supabase-only'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection required',
      message: 'KHAOS-Researcher requires Supabase connection',
      timestamp: new Date().toISOString()
    });
  }
}