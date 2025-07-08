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
        .from('models')
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
        .from('research_runs')
        .insert([{
          started_at: new Date().toISOString(),
          status: 'running',
          source: sources.join(',') || 'unknown'
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
        .from('research_runs')
        .update({
          completed_at: new Date().toISOString(),
          models_found: discoveryCount,
          new_discoveries: discoveryCount,
          status: errorMessage ? 'failed' : 'completed',
          error: errorMessage
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
          .from('models')
          .select('*')
          .eq('provider', model.provider)
          .eq('model_id', model.id)
          .single()
        
        const modelData = {
          provider: model.provider,
          model_id: model.id,
          capabilities: model.capabilities || [],
          metadata: model.metadata || {}
        }
        
        if (!existing) {
          // New model discovered
          const { error } = await this.supabase
            .from('models')
            .insert([modelData])
          
          if (error) throw error
          
          // Record discovery if tracking is available
          await this.recordDiscovery('new_model', `${model.provider}-${model.id}`, null, modelData)
          discoveries.push({
            type: 'new_model',
            model: model,
            significance: this.calculateSignificance(model)
          })
          updatedCount++
          
        } else if (this.hasModelChanged(existing, model)) {
          // Model updated
          const { error } = await this.supabase
            .from('models')
            .update(modelData)
            .eq('provider', model.provider)
            .eq('model_id', model.id)
          
          if (error) throw error
          
          // Record discovery if tracking is available
          await this.recordDiscovery('model_update', `${model.provider}-${model.id}`, existing, modelData)
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
        .from('models')
        .select('*')
        .order('created_at', { ascending: false })
      
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
        .from('models')
        .select('*')
        .eq('provider', provider)
        .order('created_at', { ascending: false })
      
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
        .from('models')
        .select('*', { count: 'exact', head: true })
      
      // Get provider breakdown
      const { data: providers } = await this.supabase
        .from('models')
        .select('provider')
      
      const byProvider = {}
      providers?.forEach(p => {
        byProvider[p.provider] = (byProvider[p.provider] || 0) + 1
      })
      
      // Get last update
      const { data: lastCycle } = await this.supabase
        .from('research_runs')
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
          models (provider, model_id, capabilities)
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