import { SupabaseDatabase } from '../database/SupabaseDatabase.js';
import { FileModelDatabase } from './FileModelDatabase.js';

// Export the appropriate database based on environment
export const ModelDatabase = process.env.SUPABASE_URL 
  ? SupabaseDatabase 
  : FileModelDatabase;