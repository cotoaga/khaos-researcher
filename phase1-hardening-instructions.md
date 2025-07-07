# Phase 1: Immediate Hardening Instructions for Claude Code

## 🎯 Objective
Transform the current KHAOS-Researcher into a workshop-ready demo with Supabase persistence and rate limiting.

## 📋 Prerequisites
- Existing KHAOS-Researcher codebase deployed to Vercel
- Supabase account created
- Environment variables ready

## 🔧 Implementation Steps

### Step 1: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 2: Create Supabase Project

1. Go to https://supabase.com and create new project
2. Note down:
   - Project URL: `https://[PROJECT_ID].supabase.co`
   - Anon Key: `eyJ...` (public)
   - Service Key: `eyJ...` (secret, for server-side)

### Step 3: Update Environment Variables

Add to `.env.local`:
```env
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

Add to Vercel:
```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_KEY production
```

### Step 4: Create Database Schema

In Supabase SQL Editor, run:

```sql
-- Core models table
CREATE TABLE IF NOT EXISTS models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  capabilities TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, model_id)
);

-- Research runs for tracking
CREATE TABLE IF NOT EXISTS research_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  models_found INTEGER DEFAULT 0,
  new_discoveries INTEGER DEFAULT 0,
  source TEXT NOT NULL,
  trigger_type TEXT DEFAULT 'manual',
  ip_address TEXT,
  status TEXT DEFAULT 'running',
  error TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider);
CREATE INDEX IF NOT EXISTS idx_research_runs_ip ON research_runs(ip_address);
CREATE INDEX IF NOT EXISTS idx_research_runs_started ON research_runs(started_at);

-- Enable RLS
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_runs ENABLE ROW LEVEL SECURITY;

-- Public read access for models
CREATE POLICY "Public can read models" ON models
  FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access to models" ON models
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to runs" ON research_runs
  FOR ALL USING (auth.role() = 'service_role');
```

### Step 5: Update api/research.js with Rate Limiting

Replace the existing `api/research.js` with:

```javascript
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
    const { data: runRecord, error: runError } = await supabase
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

    console.log(`🚀 Research run ${runRecord.id} started from ${ip}`);

    // Initialize researcher with Supabase
    const researcher = new KHAOSResearcher();
    
    // Inject Supabase client
    researcher.database.supabase = supabase;
    
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
```

### Step 6: Create src/database/SupabaseDatabase.js

Create new file to replace the JSON file storage:

```javascript
import { createClient } from '@supabase/supabase-js';
import { Logger } from '../utils/Logger.js';

export class SupabaseDatabase {
  constructor() {
    this.logger = new Logger('SupabaseDatabase');
    this.models = new Map();
    this.metadata = {
      lastUpdate: null,
      version: '1.0.0',
      totalModels: 0
    };
    
    // Will be injected by API handler
    this.supabase = null;
  }

  // Initialize Supabase client if not injected
  initSupabase() {
    if (!this.supabase) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
    }
  }

  async load() {
    this.initSupabase();
    
    try {
      const { data, error } = await this.supabase
        .from('models')
        .select('*')
        .order('provider', { ascending: true })
        .order('model_id', { ascending: true });

      if (error) throw error;

      // Convert to Map for compatibility
      this.models.clear();
      data.forEach(model => {
        const key = `${model.provider}-${model.model_id}`;
        this.models.set(key, {
          provider: model.provider,
          id: model.model_id,
          capabilities: model.capabilities || [],
          metadata: model.metadata || {},
          created: model.created_at,
          lastUpdated: model.updated_at
        });
      });

      this.metadata.totalModels = this.models.size;
      this.metadata.lastUpdate = new Date().toISOString();

      this.logger.info(`📂 Loaded ${this.models.size} models from Supabase`);
    } catch (error) {
      this.logger.error('Failed to load from Supabase:', error);
      throw error;
    }
  }

  async save() {
    // No-op for Supabase (auto-saved on update)
    this.logger.info('💾 Models auto-saved to Supabase');
  }

  async updateModels(newModels) {
    this.initSupabase();
    
    let updatedCount = 0;
    let newCount = 0;

    for (const model of newModels) {
      try {
        const { data, error } = await this.supabase
          .from('models')
          .upsert({
            provider: model.provider,
            model_id: model.id,
            capabilities: model.capabilities || [],
            metadata: model.metadata || {},
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'provider,model_id',
            returning: 'minimal'
          });

        if (error) {
          this.logger.error(`Failed to upsert model ${model.id}:`, error);
          continue;
        }

        updatedCount++;

        // Check if this was a new model
        const key = `${model.provider}-${model.id}`;
        if (!this.models.has(key)) {
          newCount++;
        }

        // Update local cache
        this.models.set(key, {
          ...model,
          lastUpdated: new Date().toISOString()
        });

      } catch (error) {
        this.logger.error(`Error updating model ${model.id}:`, error);
      }
    }

    this.logger.info(`🔄 Updated ${updatedCount} models (${newCount} new)`);
    return updatedCount;
  }

  // Compatibility methods
  getModelsByProvider(provider) {
    return Array.from(this.models.values())
      .filter(model => model.provider === provider);
  }

  getAllModels() {
    return Array.from(this.models.values());
  }

  getStats() {
    const stats = {};
    for (const model of this.models.values()) {
      stats[model.provider] = (stats[model.provider] || 0) + 1;
    }
    return {
      total: this.models.size,
      byProvider: stats,
      lastUpdate: this.metadata.lastUpdate
    };
  }
}
```

### Step 7: Update ModelDatabase to use SupabaseDatabase

Update `src/models/ModelDatabase.js` to check for Supabase:

```javascript
import { SupabaseDatabase } from '../database/SupabaseDatabase.js';
import { ModelDatabase as FileDatabase } from './FileModelDatabase.js';

// Export the appropriate database based on environment
export const ModelDatabase = process.env.SUPABASE_URL 
  ? SupabaseDatabase 
  : FileDatabase;
```

### Step 8: Update api/data.js to use Supabase

Replace with:

```javascript
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

    // Get stats
    const { data: stats } = await supabase
      .rpc('get_model_stats'); // Create this function in Supabase

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
```

### Step 9: Test Locally

```bash
# Start local development
vercel dev

# Test research endpoint
curl -X POST http://localhost:3000/api/research

# Test data endpoint
curl http://localhost:3000/api/data

# Test rate limiting (3rd request should fail)
curl -X POST http://localhost:3000/api/research
curl -X POST http://localhost:3000/api/research
curl -X POST http://localhost:3000/api/research # Should return 429
```

### Step 10: Deploy to Production

```bash
# Deploy to Vercel
vercel --prod

# Verify deployment
curl https://your-app.vercel.app/api/data
```

## 🎯 Success Criteria

- [ ] Supabase tables created and accessible
- [ ] Environment variables set in Vercel
- [ ] Rate limiting working (2 requests/hour/IP)
- [ ] Models persist between function invocations
- [ ] Research runs are tracked in database
- [ ] Dashboard shows data from Supabase
- [ ] No more "file not found" errors

## 🔍 Troubleshooting

### "Invalid API key" errors
- Check SUPABASE_URL and keys are correctly set
- Use service key for server-side, anon key for client-side

### "Permission denied" errors
- Check RLS policies are created
- Ensure using service key in API routes

### Rate limiting not working
- Check IP extraction logic
- Verify research_runs table has ip_address index

### Data not persisting
- Check Supabase connection
- Verify upsert operations succeed
- Check browser console for errors

## 🎉 Workshop Impact

With this hardening:
- **No data loss** between demos
- **Rate limiting** prevents abuse
- **Real persistence** impresses technical audience
- **Scalable foundation** for growth
- **Professional appearance** for enterprise workshops

Ready for the workshop! 🚀