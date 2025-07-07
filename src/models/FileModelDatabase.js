import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/Logger.js';

export class FileModelDatabase {
  constructor(filePath = 'data/ai_models.json') {
    this.filePath = filePath;
    this.models = new Map();
    this.metadata = {
      lastUpdate: null,
      version: '1.0.0',
      totalModels: 0
    };
    this.logger = new Logger('ModelDatabase');
    // Force memory mode in Vercel serverless environment
    this.isMemoryMode = !!process.env.VERCEL || !!process.env.LAMBDA_TASK_ROOT;
    if (this.isMemoryMode) {
      this.logger.info('🧠 Detected serverless environment - using memory-only mode');
    }
  }

  async load() {
    try {
      // Try to ensure data directory exists
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      
      const data = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.models = new Map(Object.entries(parsed.models || {}));
      this.metadata = { ...this.metadata, ...parsed.metadata };
      
      this.logger.info(`📂 Loaded ${this.models.size} models from ${this.filePath}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.info('📄 No existing database found, starting fresh');
      } else if (error.code === 'EROFS' || error.message.includes('read-only')) {
        this.logger.warn('⚠️ File system is read-only, switching to memory-only mode');
        this.isMemoryMode = true;
      } else {
        this.logger.warn('⚠️ File system error, switching to memory-only mode:', error.message);
        this.isMemoryMode = true;
      }
    }
  }

  async save() {
    if (this.isMemoryMode) {
      this.logger.info(`🧠 Memory-only mode: ${this.models.size} models in memory (not persisted)`);
      return;
    }

    try {
      const data = {
        metadata: {
          ...this.metadata,
          lastUpdate: new Date().toISOString(),
          totalModels: this.models.size
        },
        models: Object.fromEntries(this.models)
      };

      // Ensure data directory exists before writing
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
      this.logger.info(`💾 Saved ${this.models.size} models to ${this.filePath}`);
    } catch (error) {
      if (error.code === 'EROFS' || error.message.includes('read-only')) {
        this.logger.warn('⚠️ File system is read-only, switching to memory-only mode');
        this.isMemoryMode = true;
      } else {
        this.logger.warn('⚠️ File save failed, switching to memory-only mode:', error.message);
        this.isMemoryMode = true;
      }
    }
  }

  async updateModels(newModels) {
    let updatedCount = 0;
    let discoveries = [];
    
    for (const model of newModels) {
      const key = `${model.provider}-${model.id}`;
      const existing = this.models.get(key);
      
      const updatedModel = {
        ...model,
        lastUpdated: new Date().toISOString()
      };
      
      this.models.set(key, updatedModel);
      
      if (this.isMemoryMode) {
        // In memory mode, treat all models as discoveries since data doesn't persist
        discoveries.push({
          type: 'memory_discovery',
          model: updatedModel,
          provider: model.provider,
          model_id: model.id,
          timestamp: new Date().toISOString()
        });
        updatedCount++;
      } else if (!existing || this.hasModelChanged(existing, model)) {
        // Normal file mode - only track actual changes
        discoveries.push({
          type: existing ? 'model_update' : 'new_model',
          model: updatedModel,
          provider: model.provider,
          model_id: model.id,
          timestamp: new Date().toISOString()
        });
        updatedCount++;
      }
    }

    this.logger.info(`🔄 Updated ${updatedCount} models, ${discoveries.length} discoveries (memory mode: ${this.isMemoryMode})`);
    return discoveries;
  }

  hasModelChanged(existing, newModel) {
    // Simple comparison - can be enhanced
    return (
      existing.created !== newModel.created ||
      JSON.stringify(existing.capabilities) !== JSON.stringify(newModel.capabilities)
    );
  }

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
      lastUpdate: this.metadata.lastUpdate || new Date().toISOString(),
      mode: this.isMemoryMode ? 'memory' : 'file'
    };
  }

  // Placeholder methods for compatibility with Supabase interface
  async getRecentDiscoveries(limit = 5) {
    // File database doesn't track discoveries, return empty array
    return [];
  }

  async startResearchCycle(sources) {
    // File database doesn't track research cycles
    return null;
  }

  async completeResearchCycle(count, error) {
    // File database doesn't track research cycles
    return null;
  }
}