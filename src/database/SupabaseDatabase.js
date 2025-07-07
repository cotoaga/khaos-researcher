import { getSupabaseClient } from '../utils/SupabaseClient.js'
import { Logger } from '../utils/Logger.js'

export class SupabaseDatabase {
  constructor() {
    this.logger = new Logger('SupabaseDatabase')
    this.supabase = getSupabaseClient().getClient()
    this.currentCycleId = null
  }

  async load() {
    try {
      // Test connection
      const connected = await getSupabaseClient().testConnection()
      if (!connected) {
        throw new Error('Failed to connect to Supabase')
      }
      
      // Get model count for logging
      const { count, error } = await this.supabase
        .from('ai_models')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      
      this.logger.info(`🗄️ Connected to Supabase with ${count || 0} models`)
    } catch (error) {
      this.logger.error('Failed to load from Supabase:', error)
      throw error
    }
  }

  async save() {
    // No explicit save needed - Supabase handles persistence
    this.logger.info('💾 Data automatically persisted to Supabase')
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
      this.logger.error('Failed to start research cycle:', error)
      throw error
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
      this.logger.error('Failed to complete research cycle:', error)
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
          
          // Record discovery
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
          
          // Record discovery
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
      this.logger.error('Failed to record discovery:', error)
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
      return []
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
      return []
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
      return { total: 0, byProvider: {}, lastUpdate: null }
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
      this.logger.error('Failed to get recent discoveries:', error)
      return []
    }
  }
}