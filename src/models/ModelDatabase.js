import { SupabaseDatabase } from '../database/SupabaseDatabase.js';
import { FileModelDatabase } from './FileModelDatabase.js';
import { Logger } from '../utils/Logger.js';

// Smart database selector with fallback handling
export class ModelDatabase {
  constructor() {
    this.logger = new Logger('ModelDatabase');
    this.impl = null;
    this.isSupabaseMode = !!process.env.SUPABASE_URL;
  }

  async _initializeDatabase() {
    if (this.impl) return this.impl;

    if (this.isSupabaseMode) {
      try {
        this.logger.info('🔄 Attempting Supabase connection...');
        this.impl = new SupabaseDatabase();
        await this.impl.load(); // Test the connection
        this.logger.info('✅ Supabase connection successful');
        return this.impl;
      } catch (error) {
        this.logger.warn('⚠️ Supabase connection failed, falling back to file storage:', error.message);
        this.isSupabaseMode = false;
      }
    }

    // Fallback to file storage
    this.logger.info('📁 Using file-based storage');
    this.impl = new FileModelDatabase();
    return this.impl;
  }

  async load() {
    const db = await this._initializeDatabase();
    return db.load();
  }

  async save() {
    const db = await this._initializeDatabase();
    return db.save();
  }

  async updateModels(models) {
    const db = await this._initializeDatabase();
    return db.updateModels(models);
  }

  async getAllModels() {
    const db = await this._initializeDatabase();
    return db.getAllModels();
  }

  async getModelsByProvider(provider) {
    const db = await this._initializeDatabase();
    return db.getModelsByProvider(provider);
  }

  async getStats() {
    const db = await this._initializeDatabase();
    return db.getStats();
  }

  async getRecentDiscoveries(limit) {
    const db = await this._initializeDatabase();
    // File database doesn't have this method, provide fallback
    if (typeof db.getRecentDiscoveries === 'function') {
      return db.getRecentDiscoveries(limit);
    }
    return []; // Fallback for file database
  }

  async startResearchCycle(sources) {
    const db = await this._initializeDatabase();
    if (typeof db.startResearchCycle === 'function') {
      return db.startResearchCycle(sources);
    }
    // File database doesn't have this method
    return null;
  }

  async completeResearchCycle(count, error) {
    const db = await this._initializeDatabase();
    if (typeof db.completeResearchCycle === 'function') {
      return db.completeResearchCycle(count, error);
    }
    // File database doesn't have this method
    return null;
  }
}