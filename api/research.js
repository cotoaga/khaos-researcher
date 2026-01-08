import { createClient } from '@supabase/supabase-js';
import { KHAOSResearcher } from '../src/index.js';

// Initialize Supabase with service key for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Capture ecosystem snapshot for dynamic timeline visualization
 * Supports: Growth tracking, Provider racing bar, Capability heatmap
 */
async function captureEcosystemSnapshot(supabase, researcher, researchRunId, scrapeDuration) {
  // Get current model data from researcher
  const allModels = researcher.database?.models || {};
  const modelArray = Object.values(allModels);

  // Core metrics
  const ecosystemModel = modelArray.find(m => m.id === 'ecosystem-ocean');
  const totalModels = ecosystemModel?.metadata?.totalModels || 0;
  const curatedModels = modelArray.filter(m => m.id !== 'ecosystem-ocean').length;

  // VALIDATION: Don't capture snapshot if data looks invalid
  if (totalModels === 0 || totalModels < 100000) {
    console.warn(`⚠️ Skipping snapshot - invalid totalModels: ${totalModels}`);
    console.warn('ecosystem-ocean model:', ecosystemModel);
    throw new Error(`Invalid ecosystem data: totalModels=${totalModels}. Scraping may have failed.`);
  }

  console.log(`📊 Capturing snapshot: ${totalModels.toLocaleString()} total, ${curatedModels} curated`);

  // Provider distribution (for racing bar chart)
  const providerDistribution = {};
  const providerCounts = new Set();
  modelArray.forEach(model => {
    if (model.id !== 'ecosystem-ocean' && model.provider) {
      providerDistribution[model.provider] = (providerDistribution[model.provider] || 0) + 1;
      providerCounts.add(model.provider);
    }
  });

  // Capability metrics (for heatmap)
  const capabilityCounts = {};
  let totalCapabilities = 0;
  const modelsWithMultipleCapabilities = new Set();

  modelArray.forEach(model => {
    if (model.id !== 'ecosystem-ocean' && model.capabilities) {
      const caps = Array.isArray(model.capabilities) ? model.capabilities : [];
      if (caps.length > 1) {
        modelsWithMultipleCapabilities.add(model.id);
      }
      totalCapabilities += caps.length;
      caps.forEach(cap => {
        capabilityCounts[cap] = (capabilityCounts[cap] || 0) + 1;
      });
    }
  });

  // Get last snapshot for growth calculation
  const { data: lastSnapshot } = await supabase
    .from('ecosystem_snapshots')
    .select('total_models, captured_at')
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();

  let modelsAddedSinceLast = null;
  let daysSinceLast = null;
  let growthRatePerDay = null;

  if (lastSnapshot) {
    modelsAddedSinceLast = totalModels - lastSnapshot.total_models;
    const timeDiff = Date.now() - new Date(lastSnapshot.captured_at).getTime();
    daysSinceLast = timeDiff / (1000 * 60 * 60 * 24);
    growthRatePerDay = daysSinceLast > 0 ? modelsAddedSinceLast / daysSinceLast : 0;
  }

  // Calculate quality metrics
  const multimodalPercentage = curatedModels > 0
    ? modelsWithMultipleCapabilities.size / curatedModels
    : 0;
  const avgCapabilitiesPerModel = curatedModels > 0
    ? totalCapabilities / curatedModels
    : 0;

  // Insert snapshot
  const { data: snapshot, error } = await supabase
    .from('ecosystem_snapshots')
    .insert({
      total_models: totalModels,
      curated_models: curatedModels,
      providers_count: providerCounts.size,
      models_added_since_last: modelsAddedSinceLast,
      days_since_last: daysSinceLast,
      growth_rate_per_day: growthRatePerDay,
      provider_distribution: providerDistribution,
      capability_counts: capabilityCounts,
      multimodal_percentage: multimodalPercentage,
      avg_capabilities_per_model: avgCapabilitiesPerModel,
      source: 'huggingface',
      research_run_id: researchRunId,
      scrape_duration_ms: scrapeDuration
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert snapshot: ${error.message}`);
  }

  return snapshot;
}

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

    // Check rate limiting: max 2 research runs per hour per IP
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: recentRuns, error: rateLimitError } = await supabase
      .from('research_runs')
      .select('id')
      .eq('ip_address', ip)
      .gte('started_at', oneHourAgo);

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError);
      // Continue anyway if rate limit check fails - don't block legitimate requests
    } else if (recentRuns && recentRuns.length >= 2) {
      console.log(`🚫 Rate limit exceeded for ${ip}: ${recentRuns.length} runs in last hour`);
      return res.status(429).json({
        error: 'Rate limit exceeded. Maximum 2 research runs per hour.',
        retryAfter: 3600,
        runsInLastHour: recentRuns.length
      });
    }

    console.log(`✅ Rate limit OK for ${ip} (${recentRuns?.length || 0}/2 runs in last hour)`);


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
    const startTime = Date.now();
    const discoveries = await researcher.runResearchCycle();
    const scrapeDuration = Date.now() - startTime;

    // Capture ecosystem snapshot for dynamic timeline
    try {
      const snapshot = await captureEcosystemSnapshot(supabase, researcher, runRecord.id, scrapeDuration);
      console.log(`📊 Snapshot captured: ${snapshot.total_models} total, ${snapshot.curated_models} curated`);
    } catch (snapshotError) {
      console.error('⚠️ Failed to capture snapshot:', snapshotError);
      // Don't fail the entire request if snapshot fails
    }

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