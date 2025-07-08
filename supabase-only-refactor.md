# 🗡️ Supabase-Only Architecture Refactor
**Kill the File Fallback, Embrace Cloud-Native Simplicity**

*TARS: "The dual-mode complexity is unnecessary. We're cloud-native or we're nothing."*

---

## 🎯 Mission: Architectural Simplification

**KILL THE COMPLEXITY. EMBRACE THE CLOUD.**

The current system has **architectural schizophrenia** - it doesn't know if it's a local file-based tool or a cloud database system. **Pick one. Be cloud-native.**

## 🔥 Phase 1: Eliminate File System Dependencies

**Update `src/models/ModelDatabase.js` - REMOVE ALL FILE LOGIC:**

```javascript
import { getSupabaseClient } from '../utils/SupabaseClient.js'
import { Logger } from '../utils/Logger.js'

export class ModelDatabase {
  constructor() {
    this.logger = new Logger('ModelDatabase')
    this.supabase = getSupabaseClient().getClient()
    this.currentCycleId = null
  }

  async load() {
    try {
      // ONLY Supabase - no file fallback nonsense
      const connected = await getSupabaseClient().testConnection()
      if (!connected) {
        throw new Error('Supabase connection required - no fallback mode')
      }
      
      // Get model count for logging
      const { count, error } = await this.supabase
        .from('ai_models')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      
      this.logger.info(`🗄️ Connected to Supabase with ${count || 0} models`)
    } catch (error) {
      this.logger.error('Supabase connection REQUIRED:', error)
      throw new Error('Database connection failed - system cannot operate without Supabase')
    }
  }

  async save() {
    // NO-OP - Supabase handles persistence automatically
    this.logger.debug('💾 Data automatically persisted to Supabase')
  }

  async startResearchCycle(sources = []) {
    try {
      const { data, error } = await this.supabase
        .from('research_cycles')
        .insert([{
          sources_checked: sources,
          status: 'running',
          vercel_region: process.env.VERCEL_REGION || 'unknown'
        }])
        .select()
        .single()
      
      if (error) throw error
      
      this.currentCycleId = data.id
      this.logger.info(`🔄 Started research cycle: ${this.currentCycleId}`)
      return data.id
    } catch (error) {
      // If research_cycles table doesn't exist, continue without tracking
      this.logger.warn('Research cycle tracking unavailable:', error.message)
      this.currentCycleId = null
      return null
    }
  }

  async completeResearchCycle(discoveryCount = 0, errorMessage = null) {
    if (!this.currentCycleId) return
    
    try {
      const { error } = await this.supabase
        .from('research_cycles')
        .update({
          completed_at: new Date().toISOString(),
          discoveries_count: discoveryCount,
          status: errorMessage ? 'failed' : 'completed',
          error_message: errorMessage
        })
        .eq('id', this.currentCycleId)
      
      if (error) throw error
      
      this.logger.info(`✅ Completed research cycle: ${discoveryCount} discoveries`)
    } catch (error) {
      this.logger.warn('Failed to complete research cycle tracking:', error.message)
    }
  }

  async updateModels(newModels) {
    let updatedCount = 0
    let discoveries = []
    
    for (const model of newModels) {
      try {
        // Check if model exists
        const { data: existing } = await this.supabase
          .from('ai_models')
          .select('*')
          .eq('provider', model.provider)
          .eq('model_id', model.id)
          .single()
        
        const modelData = {
          id: `${model.provider}-${model.id}`,
          provider: model.provider,
          model_id: model.id,
          created_timestamp: model.created,
          capabilities: model.capabilities || [],
          metadata: model.metadata || {}
        }
        
        if (!existing) {
          // New model discovered
          const { error } = await this.supabase
            .from('ai_models')
            .insert([modelData])
          
          if (error) throw error
          
          // Record discovery if tracking is available
          await this.recordDiscovery('new_model', modelData.id, null, modelData)
          discoveries.push({
            type: 'new_model',
            model: model,
            significance: this.calculateSignificance(model)
          })
          updatedCount++
          
        } else if (this.hasModelChanged(existing, model)) {
          // Model updated
          const { error } = await this.supabase
            .from('ai_models')
            .update(modelData)
            .eq('id', modelData.id)
          
          if (error) throw error
          
          // Record discovery if tracking is available
          await this.recordDiscovery('model_update', modelData.id, existing, modelData)
          discoveries.push({
            type: 'model_update',
            model: model,
            previous: existing,
            significance: this.calculateSignificance(model)
          })
          updatedCount++
        }
        
      } catch (error) {
        this.logger.error(`Failed to update model ${model.provider}-${model.id}:`, error)
      }
    }

    this.logger.info(`🔄 Updated ${updatedCount} models`)
    return discoveries
  }

  async recordDiscovery(type, modelId, previousState, newState) {
    if (!this.currentCycleId) return
    
    try {
      const { error } = await this.supabase
        .from('model_discoveries')
        .insert([{
          research_cycle_id: this.currentCycleId,
          model_id: modelId,
          discovery_type: type,
          significance_score: this.calculateSignificance(newState),
          previous_state: previousState,
          new_state: newState
        }])
      
      if (error) throw error
    } catch (error) {
      this.logger.warn('Discovery tracking unavailable:', error.message)
    }
  }

  hasModelChanged(existing, newModel) {
    return (
      existing.created_timestamp !== newModel.created ||
      JSON.stringify(existing.capabilities) !== JSON.stringify(newModel.capabilities) ||
      JSON.stringify(existing.metadata) !== JSON.stringify(newModel.metadata)
    )
  }

  calculateSignificance(model) {
    let score = 0
    const capabilities = model.capabilities || []
    
    if (capabilities.includes('reasoning')) score += 10
    if (capabilities.includes('code')) score += 8
    if (capabilities.includes('vision')) score += 6
    if (capabilities.includes('audio')) score += 5
    
    return Math.min(score, 100)
  }

  async getAllModels() {
    try {
      const { data, error } = await this.supabase
        .from('ai_models')
        .select('*')
        .order('discovered_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      this.logger.error('Failed to get all models:', error)
      throw error // Don't hide database failures
    }
  }

  async getModelsByProvider(provider) {
    try {
      const { data, error } = await this.supabase
        .from('ai_models')
        .select('*')
        .eq('provider', provider)
        .order('discovered_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      this.logger.error(`Failed to get ${provider} models:`, error)
      throw error
    }
  }

  async getStats() {
    try {
      // Get total count
      const { count: total } = await this.supabase
        .from('ai_models')
        .select('*', { count: 'exact', head: true })
      
      // Get provider breakdown
      const { data: providers } = await this.supabase
        .from('ai_models')
        .select('provider')
      
      const byProvider = {}
      providers?.forEach(p => {
        byProvider[p.provider] = (byProvider[p.provider] || 0) + 1
      })
      
      // Get last update
      const { data: lastCycle } = await this.supabase
        .from('research_cycles')
        .select('completed_at')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()
      
      return {
        total: total || 0,
        byProvider,
        lastUpdate: lastCycle?.completed_at || null
      }
    } catch (error) {
      this.logger.error('Failed to get stats:', error)
      throw error
    }
  }

  async getRecentDiscoveries(limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('model_discoveries')
        .select(`
          *,
          ai_models (provider, model_id, capabilities)
        `)
        .order('discovered_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      this.logger.warn('Discovery tracking unavailable:', error.message)
      return [] // Graceful degradation for missing table
    }
  }
}
```

## 🗄️ Phase 2: Ensure Required Tables Exist

**Create missing Supabase tables via SQL Editor:**

```sql
-- Create research_cycles table if it doesn't exist
CREATE TABLE IF NOT EXISTS research_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  discoveries_count INTEGER DEFAULT 0,
  sources_checked TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'running',
  error_message TEXT,
  vercel_region TEXT
);

-- Create model_discoveries table if it doesn't exist  
CREATE TABLE IF NOT EXISTS model_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_cycle_id UUID REFERENCES research_cycles(id),
  model_id TEXT REFERENCES ai_models(id),
  discovery_type TEXT,
  significance_score INTEGER,
  previous_state JSONB,
  new_state JSONB,
  discovered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_cycles_started ON research_cycles(started_at);
CREATE INDEX IF NOT EXISTS idx_discoveries_cycle ON model_discoveries(research_cycle_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_type ON model_discoveries(discovery_type);

-- Enable RLS
ALTER TABLE research_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_discoveries ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY IF NOT EXISTS "Anyone can read cycles" ON research_cycles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can read discoveries" ON model_discoveries FOR SELECT USING (true);
```

## 🌐 Phase 3: Simplify API Endpoints

**Update `api/data.js` - REMOVE fallback complexity:**

```javascript
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
          version: '2.0.0-supabase-only',
          totalModels: stats.total
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
```

## 🚫 Phase 4: Remove File System Code

**Delete or comment out ALL file-related code:**

1. **Remove** `fs` imports from ModelDatabase.js
2. **Remove** `filePath` properties  
3. **Remove** `loadFromFile()` methods
4. **Remove** any `data/` directory dependencies

## 🎯 Phase 5: Update Error Handling

**Make Supabase failures VISIBLE, not hidden:**

```javascript
// In src/utils/SupabaseClient.js - FAIL FAST AND LOUD
constructor() {
  this.logger = new Logger('SupabaseClient')
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    const error = 'CRITICAL: Missing Supabase credentials - system cannot operate'
    this.logger.error(error)
    throw new Error(error)
  }
  
  this.supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  this.logger.info('🛸 Supabase client initialized (cloud-native mode)')
}
```

## 🧹 Phase 6: Clean Up Dashboard

**Update dashboard to handle Supabase-only responses:**

```javascript
// In public/index.html - Remove fallback mode logic
async loadData() {
  try {
    this.updateStatus('working', 'Loading from Supabase...');
    
    const response = await fetch(`${this.apiBase}/api/data`);
    const result = await response.json();
    
    if (result.success) {
      this.modelData = result.data;
      this.currentModels = Object.values(this.modelData.models || {});
      this.lastUpdate = new Date();
      this.updateStatus('online', `Cloud Agent Online (${this.currentModels.length} models)`);
      return true;
    } else {
      throw new Error(result.error || 'API request failed');
    }
  } catch (error) {
    console.error('Failed to load data:', error);
    this.updateStatus('error', 'Supabase Connection Required');
    this.showSupabaseError();
    return false;
  }
}

showSupabaseError() {
  document.getElementById('model-grid').innerHTML = `
    <div class="empty-state error-bg">
      <h3>🛸 Supabase Connection Required</h3>
      <p>KHAOS-Researcher is a cloud-native system that requires database connectivity.</p>
      <p>Please ensure Supabase is properly configured.</p>
    </div>
  `;
}
```

## 🎯 Expected Results

**After refactoring:**

1. ✅ **No more dual-mode confusion** - One architecture, Supabase only
2. ✅ **No more file system dependencies** - Pure cloud-native  
3. ✅ **Clear error messages** - "Supabase required" instead of silent fallbacks
4. ✅ **Faster debugging** - Failures are visible, not hidden
5. ✅ **Workshop confidence** - System either works completely or fails clearly

## 🐉 Dragon's Wisdom

*"Complexity is the enemy of reliability. Choose one architecture and master it, rather than trying to support all possible failure modes."*

**Be cloud-native or be nothing.**

---

**Mission Status**: Ready for architectural simplification
**Complexity Reduction**: MAXIMUM  
**Workshop Reliability**: Enhanced through simplicity