-- 🗡️ KHAOS-Researcher Supabase Tables Setup
-- Execute this SQL in your Supabase SQL Editor

-- Create research_cycles table if it doesn't exist
CREATE TABLE IF NOT EXISTS research_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  discoveries_count INTEGER DEFAULT 0,
  sources_checked TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'running',
  error_message TEXT,
  vercel_region TEXT
);

-- Create model_discoveries table if it doesn't exist  
CREATE TABLE IF NOT EXISTS model_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_cycle_id UUID REFERENCES research_cycles(id),
  model_id TEXT REFERENCES ai_models(id),
  discovery_type TEXT,
  significance_score INTEGER,
  previous_state JSONB,
  new_state JSONB,
  discovered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_cycles_started ON research_cycles(started_at);
CREATE INDEX IF NOT EXISTS idx_discoveries_cycle ON model_discoveries(research_cycle_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_type ON model_discoveries(discovery_type);

-- Enable RLS
ALTER TABLE research_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_discoveries ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY IF NOT EXISTS "Anyone can read cycles" ON research_cycles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can read discoveries" ON model_discoveries FOR SELECT USING (true);

-- Service role full access policies
CREATE POLICY IF NOT EXISTS "Service role full access to cycles" ON research_cycles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role full access to discoveries" ON model_discoveries
  FOR ALL USING (auth.role() = 'service_role');

-- Verify table creation
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('research_cycles', 'model_discoveries')
ORDER BY table_name, ordinal_position;