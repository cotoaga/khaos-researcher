import { KHAOSResearcher } from '../src/index.js';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET and POST
  if (!['GET', 'POST'].includes(req.method)) {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('🚀 KHAOS-Researcher starting research cycle...');
    
    const researcher = new KHAOSResearcher();
    await researcher.initialize();
    
    const discoveries = await researcher.runResearchCycle();
    
    console.log(`✅ Research complete: ${discoveries.length} discoveries`);
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      discoveries: discoveries.length,
      data: discoveries,
      agent: 'KHAOS-Researcher v1.0',
      environment: 'Vercel Serverless',
      runtime: process.env.VERCEL_REGION || 'unknown'
    });
  } catch (error) {
    console.error('❌ Research cycle failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      agent: 'KHAOS-Researcher v1.0',
      environment: 'Vercel Serverless'
    });
  }
}