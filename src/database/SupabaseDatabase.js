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