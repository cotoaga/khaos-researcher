import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // In production, this would read from a database or external storage
    // For now, we'll serve the latest data from the research function
    
    const dataPath = path.join(process.cwd(), 'data', 'ai_models.json');
    let modelData;
    
    try {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      modelData = JSON.parse(rawData);
    } catch (error) {
      // If no data file exists, return empty structure
      modelData = {
        metadata: {
          lastUpdate: new Date().toISOString(),
          version: '1.0.0',
          totalModels: 0
        },
        models: {}
      };
    }

    res.status(200).json({
      success: true,
      data: modelData,
      timestamp: new Date().toISOString(),
      cached: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}