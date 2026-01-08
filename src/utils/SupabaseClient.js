import { createClient } from '@supabase/supabase-js'
import { Logger } from './Logger.js'

class SupabaseClient {
  constructor() {
    this.logger = new Logger('SupabaseClient')
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('⚠️ No Supabase credentials - will use file-based fallback')
      this.supabase = null
      return
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    this.logger.info('🛸 Supabase client initialized (cloud-native mode)')
  }

  async testConnection() {
    if (!this.supabase) {
      return false
    }

    try {
      const { data, error } = await this.supabase
        .from('models')
        .select('id')
        .limit(1)

      if (error) throw error
      this.logger.info('✅ Supabase connection verified')
      return true
    } catch (error) {
      this.logger.error('❌ Supabase connection failed:', error)
      return false
    }
  }

  isAvailable() {
    return this.supabase !== null
  }

  getClient() {
    return this.supabase
  }
}

// Singleton pattern for serverless
let instance = null

export function getSupabaseClient() {
  if (!instance) {
    instance = new SupabaseClient()
  }
  return instance
}

export { SupabaseClient }