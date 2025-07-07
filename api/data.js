import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY // Public read access
    );

    // Get all models
    const { data: models, error } = await supabase
      .from('models')
      .select('*')
      .order('provider', { ascending: true })
      .order('model_id', { ascending: true });

    if (error) throw error;

    // Convert to expected format
    const modelData = {
      metadata: {
        lastUpdate: new Date().toISOString(),
        version: '1.0.0',
        totalModels: models.length
      },
      models: models.reduce((acc, model) => {
        const key = `${model.provider}-${model.model_id}`;
        acc[key] = {
          provider: model.provider,
          id: model.model_id,
          capabilities: model.capabilities || [],
          metadata: model.metadata || {},
          created: new Date(model.created_at).getTime() / 1000,
          lastUpdated: model.updated_at
        };
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      data: modelData,
      timestamp: new Date().toISOString(),
      cached: false
    });

  } catch (error) {
    console.error('Failed to fetch data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}