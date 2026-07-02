import { getSupabaseClient } from '../utils/SupabaseClient.js'
import { FileModelDatabase } from './FileModelDatabase.js'
import { Logger } from '../utils/Logger.js'

export class ModelDatabase {
  constructor() {
    this.logger = new Logger('ModelDatabase')
    this.supabaseClient = getSupabaseClient()
    this.useSupabase = this.supabaseClient.isAvailable()
    this.currentCycleId = null

    if (this.useSupabase) {
      this.supabase = this.supabaseClient.getClient()
      this.logger.info('🛸 Using Supabase for data storage')
    } else {
      this.fileDb = new FileModelDatabase()
      this.logger.info('📁 Using file-based storage (fallback mode)')
    }
  }

  async load() {
    if (this.useSupabase) {
      try {
        const connected = await this.supabaseClient.testConnection()
        if (!connected) {
          throw new Error('Supabase connection failed')
        }

        // Get model count for logging
        const { count, error } = await this.supabase
          .from('models')
          .select('*', { count: 'exact', head: true })

        if (error) throw error

        this.logger.info(`🗄️ Connected to Supabase with ${count || 0} models`)
      } catch (error) {
        this.logger.error('Supabase connection failed:', error)
        throw error
      }
    } else {
      await this.fileDb.load()
    }
  }

  async save() {
    if (this.useSupabase) {
      // NO-OP - Supabase handles persistence automatically
      this.logger.debug('💾 Data automatically persisted to Supabase')
    } else {
      await this.fileDb.save()
    }
  }

  async startResearchCycle(sources = []) {
    if (!this.useSupabase) {
      return await this.fileDb.startResearchCycle(sources)
    }

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
    if (!this.useSupabase) {
      return await this.fileDb.completeResearchCycle(discoveryCount, errorMessage)
    }

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

  classifyDateQuality(models) {
    // Group by (provider, created-day) to detect sentinel dates
    const dateGroups = {}
    for (const model of models) {
      if (!model.created) continue
      let day
      try {
        day = typeof model.created === 'number'
          ? new Date(model.created * 1000).toISOString().substring(0, 10)
          : new Date(model.created).toISOString().substring(0, 10)
      } catch (_) { continue }
      const key = `${model.provider}::${day}`
      if (!dateGroups[key]) dateGroups[key] = []
      dateGroups[key].push(model.id)
    }

    const sentinelKeys = new Set(
      Object.entries(dateGroups)
        .filter(([, ids]) => ids.length > 3)
        .map(([key]) => key)
    )

    return (model) => {
      const knownDate = this.getKnownModelDate(model.provider, model.id)
      if (knownDate) return 'verified'

      if (!model.created) return 'unknown'

      let day
      try {
        day = typeof model.created === 'number'
          ? new Date(model.created * 1000).toISOString().substring(0, 10)
          : new Date(model.created).toISOString().substring(0, 10)
      } catch (_) { return 'unknown' }

      if (sentinelKeys.has(`${model.provider}::${day}`)) return 'sentinel'

      const apiSources = ['last-modified', 'upload-date', 'rawDate-metadata']
      if (model.metadata?.dateSource && apiSources.includes(model.metadata.dateSource)) {
        return 'api_listing'
      }

      return 'unknown'
    }
  }

  async updateModels(newModels) {
    if (!this.useSupabase) {
      return await this.fileDb.updateModels(newModels)
    }

    let updatedCount = 0
    let discoveries = []

    const getDateQuality = this.classifyDateQuality(newModels)

    for (const model of newModels) {
      try {
        // Fetch existing model first to detect changes
        const { data: existing } = await this.supabase
          .from('models')
          .select('*')
          .eq('provider', model.provider)
          .eq('model_id', model.id)
          .single()

        const dateQuality = getDateQuality(model)
        const knownDate = this.getKnownModelDate(model.provider, model.id)

        const modelData = {
          provider: model.provider,
          model_id: model.id,
          capabilities: model.capabilities || [],
          metadata: {
            ...(model.metadata || {}),
            date_quality: dateQuality
          },
          created_at: knownDate
            ? knownDate
            : model.created ? new Date(model.created * 1000) : new Date(),
          updated_at: new Date()
        }

        // Preserve original created_at if model already exists AND we have no verified date
        if (existing?.created_at && !knownDate) {
          modelData.created_at = existing.created_at
        }

        // Use UPSERT to avoid race conditions
        // This is atomic and handles both insert and update in one operation
        const { data: upsertedModel, error } = await this.supabase
          .from('models')
          .upsert([modelData], {
            onConflict: 'provider,model_id',
            ignoreDuplicates: false
          })
          .select()
          .single()

        if (error) throw error

        // Determine if this was a new discovery or an update
        if (!existing) {
          // New model discovered
          await this.recordDiscovery('new_model', `${model.provider}-${model.id}`, null, modelData)
          discoveries.push({
            type: 'new_model',
            model: model,
            significance: this.calculateSignificance(model)
          })
          updatedCount++

        } else if (this.hasModelChanged(existing, model)) {
          // Model updated
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
    const id = (modelId || '').toLowerCase()

    const knownDates = {
      'OpenAI': [
        [['gpt-1'], new Date('2018-06-11')],
        [['gpt-2'], new Date('2019-11-05')],
        [['gpt-3'], new Date('2020-06-11')],
        [['gpt-3.5-turbo'], new Date('2022-11-30')],
        [['text-davinci-003'], new Date('2022-11-28')],
        [['text-embedding-ada-002'], new Date('2022-12-16')],
        [['whisper-1', 'whisper-large'], new Date('2022-09-21')],
        [['gpt-4-turbo-preview'], new Date('2024-01-25')],
        [['text-embedding-3-large'], new Date('2024-01-25')],
        [['text-embedding-3-small'], new Date('2024-01-25')],
        [['gpt-4-turbo'], new Date('2024-04-09')],
        [['gpt-4o-mini'], new Date('2024-07-18')],
        [['gpt-4o-realtime'], new Date('2024-10-01')],
        [['o1-preview'], new Date('2024-09-12')],
        [['o1-mini'], new Date('2024-09-12')],
        [['o1'], new Date('2024-12-05')],
        [['o3-mini'], new Date('2025-01-31')],
        [['gpt-4.5'], new Date('2025-02-27')],
        [['o3'], new Date('2025-04-16')],
        [['gpt-oss'], new Date('2025-08-05')],
        [['gpt-5'], new Date('2025-08-07')],
        [['gpt-4o'], new Date('2024-05-13')],
        [['gpt-4'], new Date('2023-03-14')],
        [['dall-e-3'], new Date('2023-10-03')],
        [['dall-e-2'], new Date('2022-04-06')],
        [['babbage-002', 'davinci-002'], new Date('2023-08-22')],
      ],
      'Anthropic': [
        [['claude-instant-1', 'claude-instant'], new Date('2023-03-14')],
        [['claude-2.1'], new Date('2023-11-21')],
        [['claude-2'], new Date('2023-07-11')],
        [['claude-3-haiku-20240307', 'claude-3-haiku'], new Date('2024-03-07')],
        [['claude-3-sonnet-20240229', 'claude-3-sonnet'], new Date('2024-03-04')],
        [['claude-3-opus-20240229', 'claude-3-opus'], new Date('2024-03-04')],
        [['claude-3-5-sonnet-20240620'], new Date('2024-06-20')],
        [['claude-3-5-sonnet-20241022', 'claude-3-5-sonnet'], new Date('2024-10-22')],
        [['claude-3-5-haiku-20241022', 'claude-3-5-haiku', 'claude-haiku-3.5'], new Date('2024-10-22')],
        [['claude-3-7-sonnet', 'claude-sonnet-3.7', 'claude-3-7'], new Date('2025-02-24')],
        [['claude-opus-4', 'claude-4-opus'], new Date('2025-05-22')],
        [['claude-sonnet-4', 'claude-4-sonnet'], new Date('2025-05-22')],
        [['claude-haiku-4', 'claude-4-haiku'], new Date('2025-07-01')],
        [['claude-opus-4-5'], new Date('2025-07-15')],
        [['claude-sonnet-4-5'], new Date('2025-07-15')],
        [['claude-haiku-4-5-20251001', 'claude-haiku-4-5'], new Date('2025-10-01')],
        [['claude-fable-5'], new Date('2026-06-09')],
        [['claude-opus-4-8'], new Date('2026-06-09')],
      ],
      'Google': [
        [['palm', 'bard'], new Date('2023-03-21')],
        [['gemini-pro', 'gemini-1.0-pro'], new Date('2023-12-06')],
        [['gemini-1.5-pro'], new Date('2024-02-15')],
        [['gemini-1.5-flash'], new Date('2024-05-14')],
        [['gemini-2.0-flash-thinking'], new Date('2024-12-19')],
        [['gemini-2.0-flash'], new Date('2024-12-11')],
        [['gemini-2.5-pro'], new Date('2025-03-25')],
        [['gemini-2.5-flash'], new Date('2025-05-20')],
        [['gemini-3'], new Date('2025-11-18')],
        [['gemma-2'], new Date('2024-07-31')],
        [['gemma-3'], new Date('2025-03-12')],
      ],
      'xAI': [
        [['grok-1'], new Date('2023-11-04')],
        [['grok-1.5'], new Date('2024-05-01')],
        [['grok-2-mini'], new Date('2024-08-13')],
        [['grok-2'], new Date('2024-08-13')],
        [['grok-3-mini'], new Date('2025-02-17')],
        [['grok-3'], new Date('2025-02-17')],
        [['grok-4-heavy'], new Date('2025-07-09')],
        [['grok-4'], new Date('2025-07-09')],
      ],
      'Meta': [
        [['llama-1', 'llama1'], new Date('2023-02-24')],
        [['llama-2', 'llama2'], new Date('2023-07-18')],
        [['llama-3.1'], new Date('2024-07-23')],
        [['llama-3.2'], new Date('2024-09-25')],
        [['llama-3.3'], new Date('2024-12-06')],
        [['llama-3'], new Date('2024-04-18')],
      ],
      'Mistral': [
        [['mistral-7b', 'mistral-7'], new Date('2023-09-27')],
        [['mixtral-8x7b', 'mixtral-8x22b'], new Date('2023-12-11')],
        [['mistral-small'], new Date('2024-02-26')],
        [['mistral-large'], new Date('2024-02-26')],
        [['mistral-nemo'], new Date('2024-07-18')],
        [['codestral'], new Date('2024-05-29')],
        [['pixtral'], new Date('2024-09-17')],
      ],
      'DeepSeek': [
        [['deepseek-r1'], new Date('2025-01-20')],
        [['deepseek-v3'], new Date('2024-12-26')],
        [['deepseek-v2'], new Date('2024-05-07')],
        [['deepseek-coder'], new Date('2023-11-01')],
      ],
      'Microsoft': [
        [['phi-1'], new Date('2023-06-20')],
        [['phi-2'], new Date('2023-12-12')],
        [['phi-3'], new Date('2024-04-23')],
        [['phi-4'], new Date('2024-12-12')],
        [['wizardlm'], new Date('2023-06-01')],
        [['orca'], new Date('2023-06-01')],
      ],
      'Cohere': [
        [['command-r-plus'], new Date('2024-04-04')],
        [['command-r'], new Date('2024-03-11')],
        [['command'], new Date('2023-02-01')],
        [['embed-multilingual'], new Date('2023-05-01')],
      ],
      'Alibaba': [
        [['qwen2.5'], new Date('2024-09-18')],
        [['qwen2'], new Date('2024-06-06')],
        [['qwen1.5'], new Date('2024-02-05')],
        [['qwen'], new Date('2023-09-25')],
      ],
    }

    const providerDates = knownDates[provider]
    if (!providerDates) return null

    for (const [keys, date] of providerDates) {
      if (keys.some(k => id.includes(k.toLowerCase()))) return date
    }

    return null
  }
  
  getProviderFallbackDate(provider) {
    const fallbacks = {
      'OpenAI': new Date('2022-11-30'),
      'Anthropic': new Date('2023-03-14'),
      'Google': new Date('2023-12-06'),
      'Meta': new Date('2023-02-24'),
      'Mistral': new Date('2023-09-27'),
      'HuggingFace': new Date('2022-01-01'),
      'Microsoft': new Date('2023-06-20'),
      'Cohere': new Date('2023-02-01'),
      'DeepSeek': new Date('2023-11-01'),
      'Alibaba': new Date('2023-09-25'),
      'xAI': new Date('2023-11-04')
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
    if (!this.useSupabase) {
      return this.fileDb.getAllModels()
    }

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
    if (!this.useSupabase) {
      return this.fileDb.getModelsByProvider(provider)
    }

    try {
      const { data, error} = await this.supabase
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
    if (!this.useSupabase) {
      return this.fileDb.getStats()
    }

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

      // Get last update from most recent research run
      const { data: lastCycle, error: cycleError } = await this.supabase
        .from('research_runs')
        .select('completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle() // Use maybeSingle instead of single to handle 0 results gracefully

      if (cycleError) {
        this.logger.warn('Could not fetch last research run:', cycleError.message)
      }

      return {
        total: total || 0,
        byProvider,
        lastUpdate: lastCycle?.completed_at || new Date().toISOString()
      }
    } catch (error) {
      this.logger.error('Failed to get stats:', error)
      throw error
    }
  }

  async getRecentDiscoveries(limit = 10) {
    if (!this.useSupabase) {
      return await this.fileDb.getRecentDiscoveries(limit)
    }

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