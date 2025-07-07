import { createClient } from '@supabase/supabase-js'
import { Logger } from './Logger.js'

class SupabaseClient {
  constructor() {
    this.logger = new Logger('SupabaseClient')
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY // Use service key for server-side
    
    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('❌ Missing Supabase credentials')
      throw new Error('Supabase configuration missing')
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    this.logger.info('🛸 Supabase client initialized')
  }

  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('ai_models')
        .select('count')
        .limit(1)
      
      if (error) throw error
      this.logger.info('✅ Supabase connection verified')
      return true
    } catch (error) {
      this.logger.error('❌ Supabase connection failed:', error)
      return false
    }
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