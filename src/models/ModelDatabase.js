import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/Logger.js';

export class ModelDatabase {
  constructor(filePath = 'data/ai_models.json') {
    this.filePath = filePath;
    this.models = new Map();
    this.metadata = {
      lastUpdate: null,
      version: '1.0.0',
      totalModels: 0
    };
    this.logger = new Logger('ModelDatabase');
  }

  async load() {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      
      const data = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.models = new Map(Object.entries(parsed.models || {}));
      this.metadata = { ...this.metadata, ...parsed.metadata };
      
      this.logger.info(`📂 Loaded ${this.models.size} models from ${this.filePath}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.info('📄 No existing database found, starting fresh');
      } else {
        this.logger.error('Failed to load database:', error);
        throw error;
      }
    }
  }

  async save() {
    const data = {
      metadata: {
        ...this.metadata,
        lastUpdate: new Date().toISOString(),
        totalModels: this.models.size
      },
      models: Object.fromEntries(this.models)
    };

    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    this.logger.info(`💾 Saved ${this.models.size} models to ${this.filePath}`);
  }

  async updateModels(newModels) {
    let updatedCount = 0;
    
    for (const model of newModels) {
      const key = `${model.provider}-${model.id}`;
      const existing = this.models.get(key);
      
      if (!existing || this.hasModelChanged(existing, model)) {
        this.models.set(key, {
          ...model,
          lastUpdated: new Date().toISOString()
        });
        updatedCount++;
      }
    }

    this.logger.info(`🔄 Updated ${updatedCount} models`);
    return updatedCount;
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
      lastUpdate: this.metadata.lastUpdate
    };
  }
}