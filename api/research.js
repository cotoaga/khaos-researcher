import { createClient } from '@supabase/supabase-js';
import { KHAOSResearcher } from '../src/index.js';

// Initialize Supabase with service key for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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

  let runRecord = null;

  try {
    // Extract IP for rate limiting
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               'unknown';

    // Check rate limit: 2 requests per hour per IP
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: recentRuns, error: rateLimitError } = await supabase
      .from('research_runs')
      .select('id')
      .eq('ip_address', ip)
      .gte('started_at', oneHourAgo);

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError);
    } else if (recentRuns && recentRuns.length >= 2) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Maximum 2 research runs per hour.',
        retryAfter: 3600,
        runsInLastHour: recentRuns.length
      });
    }

    // Create research run record
    const { data: runRecordData, error: runError } = await supabase
      .from('research_runs')
      .insert({
        source: 'api',
        trigger_type: req.method === 'POST' ? 'manual' : 'cron',
        ip_address: ip,
        status: 'running'
      })
      .select()
      .single();

    if (runError) {
      console.error('Failed to create run record:', runError);
      throw new Error('Failed to initialize research run');
    }

    runRecord = runRecordData;
    console.log(`🚀 Research run ${runRecord.id} started from ${ip}`);

    // Initialize researcher (will auto-detect Supabase or file mode)
    const researcher = new KHAOSResearcher();
    await researcher.initialize();
    const discoveries = await researcher.runResearchCycle();

    // Update run record with results
    const { error: updateError } = await supabase
      .from('research_runs')
      .update({
        completed_at: new Date().toISOString(),
        models_found: discoveries.length,
        new_discoveries: discoveries.filter(d => d.type === 'new_model').length,
        status: 'completed'
      })
      .eq('id', runRecord.id);

    if (updateError) {
      console.error('Failed to update run record:', updateError);
    }

    console.log(`✅ Research run ${runRecord.id} complete: ${discoveries.length} discoveries`);

    res.status(200).json({
      success: true,
      runId: runRecord.id,
      timestamp: new Date().toISOString(),
      discoveries: discoveries.length,
      data: discoveries,
      agent: 'KHAOS-Researcher v1.0',
      environment: 'Vercel Serverless + Supabase',
      runtime: process.env.VERCEL_REGION || 'unknown'
    });

  } catch (error) {
    console.error('❌ Research cycle failed:', error);

    // Try to update run record with error
    if (runRecord?.id) {
      await supabase
        .from('research_runs')
        .update({
          status: 'failed',
          error: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', runRecord.id);
    }

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      agent: 'KHAOS-Researcher v1.0',
      environment: 'Vercel Serverless + Supabase'
    });
  }
}