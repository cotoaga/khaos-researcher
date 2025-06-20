import { KHAOSResearcher } from '../src/index.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const researcher = new KHAOSResearcher();
    await researcher.initialize();
    
    const discoveries = await researcher.runResearchCycle();
    
    res.status(200).json({
      success: true,
      discoveries: discoveries.length,
      timestamp: new Date().toISOString(),
      data: discoveries
    });
  } catch (error) {
    console.error('Research cycle failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}