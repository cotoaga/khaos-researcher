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
          metadata: model.metadata || {},
          created_at: model.created ? new Date(model.created * 1000) : new Date() // Convert Unix timestamp to Date
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
          // Model updated - preserve original created_at
          const updateData = {
            ...modelData,
            created_at: existing.created_at || modelData.created_at // Keep original date if it exists
          }
          
          const { error } = await this.supabase
            .from('models')
            .update(updateData)
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

  async fixDateMigration() {
    // This method fixes models that have wrong created_at dates
    this.logger.info('🔧 Starting date migration fix...')
    
    try {
      const { data: models, error } = await this.supabase
        .from('models')
        .select('*')
        .gte('created_at', '2025-07-07') // Models with dates after July 7, 2025 are likely wrong
      
      if (error) throw error
      
      this.logger.info(`Found ${models.length} models with potentially wrong dates`)
      
      for (const model of models) {
        let fixedDate = null
        let reason = 'no-fix'
        
        // Strategy 1: Use rawDate from metadata (HuggingFace models)
        if (model.metadata && model.metadata.rawDate) {
          const correctDate = new Date(model.metadata.rawDate)
          if (!isNaN(correctDate.getTime())) {
            fixedDate = correctDate
            reason = 'rawDate-metadata'
          }
        }
        
        // Strategy 2: Use known release dates for major providers
        if (!fixedDate) {
          fixedDate = this.getKnownModelDate(model.provider, model.model_id)
          if (fixedDate) {
            reason = 'known-date'
          }
        }
        
        // Strategy 3: Use provider-specific fallback dates
        if (!fixedDate) {
          fixedDate = this.getProviderFallbackDate(model.provider)
          reason = 'provider-fallback'
        }
        
        if (fixedDate) {
          const { error: updateError } = await this.supabase
            .from('models')
            .update({ 
              created_at: fixedDate,
              metadata: {
                ...model.metadata,
                dateSource: reason,
                originalDate: model.created_at
              }
            })
            .eq('id', model.id)
          
          if (updateError) {
            this.logger.warn(`Failed to fix date for ${model.provider}-${model.model_id}:`, updateError.message)
          } else {
            this.logger.info(`✅ Fixed date for ${model.provider}-${model.model_id}: ${fixedDate.toISOString()} (${reason})`)
          }
        } else {
          this.logger.warn(`⚠️  No date fix available for ${model.provider}-${model.model_id}`)
        }
      }
      
    } catch (error) {
      this.logger.error('Date migration failed:', error)
    }
  }
  
  getKnownModelDate(provider, modelId) {
    // Known release dates for major models
    const knownDates = {
      'OpenAI': {
        'gpt-4o': new Date('2024-05-13'),
        'gpt-4o-mini': new Date('2024-07-18'),
        'gpt-4-turbo': new Date('2024-04-09'),
        'gpt-4': new Date('2023-03-14'),
        'gpt-3.5-turbo': new Date('2022-11-30'),
        'whisper-1': new Date('2022-09-21'),
        'dall-e-3': new Date('2023-10-03'),
        'o1-preview': new Date('2024-09-12'),
        'o1-mini': new Date('2024-09-12')
      },
      'Anthropic': {
        'claude-3-opus': new Date('2024-03-04'),
        'claude-3-sonnet': new Date('2024-03-04'),
        'claude-3-haiku': new Date('2024-03-04'),
        'claude-3-5-sonnet': new Date('2024-06-20'),
        'claude-3-5-haiku': new Date('2024-10-22'),
        'claude-sonnet-4': new Date('2024-12-01'), // Estimated
        'claude-opus-4': new Date('2024-12-01') // Estimated
      },
      'Google': {
        'gemini-pro': new Date('2023-12-06'),
        'gemini-1.5-pro': new Date('2024-02-15'),
        'gemini-2.0-flash': new Date('2024-12-11')
      }
    }
    
    return knownDates[provider]?.[modelId] || null
  }
  
  getProviderFallbackDate(provider) {
    // Fallback dates based on when providers became prominent
    const fallbacks = {
      'OpenAI': new Date('2022-11-30'), // ChatGPT launch
      'Anthropic': new Date('2023-03-14'), // Claude launch
      'Google': new Date('2023-12-06'), // Gemini launch
      'Meta': new Date('2023-02-24'), // LLaMA launch
      'Mistral': new Date('2023-09-27'), // Mistral 7B launch
      'HuggingFace': new Date('2022-01-01'), // Conservative estimate
      'Microsoft': new Date('2023-01-01'),
      'Cohere': new Date('2022-01-01'),
      'DeepSeek': new Date('2023-01-01'),
      'Alibaba': new Date('2023-01-01'),
      'xAI': new Date('2023-07-01')
    }
    
    return fallbacks[provider] || new Date('2023-01-01')
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