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
      modelsObject[model.id] = {
        provider: model.provider,
        id: model.model_id,
        created: model.created_timestamp,
        capabilities: model.capabilities,
        metadata: model.metadata,
        lastUpdated: model.last_updated
      };
    });

    res.status(200).json({
      success: true,
      data: {
        metadata: {
          lastUpdate: stats.lastUpdate,
          version: '2.0.0-supabase',
          totalModels: stats.total
        },
        models: modelsObject
      },
      stats,
      recentDiscoveries: discoveries,
      timestamp: new Date().toISOString(),
      source: 'supabase'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}