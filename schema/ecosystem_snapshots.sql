-- ============================================
-- KHAOS-Researcher Ecosystem Snapshots Schema
-- Captures AI model ecosystem state over time
-- Supports: Timeline, Growth Analysis, Predictions
-- ============================================

-- Main snapshots table
CREATE TABLE IF NOT EXISTS ecosystem_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  captured_at TIMESTAMPTZ DEFAULT NOW(),

  -- Core metrics
  total_models INTEGER NOT NULL,
  curated_models INTEGER NOT NULL,
  providers_count INTEGER NOT NULL,

  -- Growth metrics (calculated from previous snapshot)
  models_added_since_last INTEGER,
  days_since_last DECIMAL,
  growth_rate_per_day DECIMAL,

  -- Provider breakdown (for racing bar chart)
  provider_distribution JSONB DEFAULT '{}',
  -- Example: {"OpenAI": 45, "Anthropic": 12, "Google": 38}

  -- Capability metrics (for heatmap)
  capability_counts JSONB DEFAULT '{}',
  -- Example: {"text-generation": 1200000, "vision": 450000, "reasoning": 89000}

  new_capabilities_discovered TEXT[] DEFAULT '{}',

  -- Quality signals
  multimodal_percentage DECIMAL,
  avg_capabilities_per_model DECIMAL,

  -- Source metadata
  source TEXT DEFAULT 'huggingface',
  research_run_id UUID REFERENCES research_runs(id),
  scrape_duration_ms INTEGER,

  -- Metadata for predictions
  data_quality_score DECIMAL DEFAULT 1.0,
  is_interpolated BOOLEAN DEFAULT false,
  notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON ecosystem_snapshots(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_research_run ON ecosystem_snapshots(research_run_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_source ON ecosystem_snapshots(source);

-- Enable RLS
ALTER TABLE ecosystem_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read snapshots" ON ecosystem_snapshots
  FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access to snapshots" ON ecosystem_snapshots
  FOR ALL USING (auth.role() = 'service_role');

-- View for easy querying
CREATE OR REPLACE VIEW ecosystem_growth_metrics AS
SELECT
  id,
  captured_at,
  total_models,
  curated_models,
  providers_count,
  growth_rate_per_day,
  ROUND((total_models - LAG(total_models) OVER (ORDER BY captured_at))::NUMERIC /
        NULLIF(EXTRACT(EPOCH FROM (captured_at - LAG(captured_at) OVER (ORDER BY captured_at))) / 86400, 0), 2)
    AS actual_daily_growth,
  ROUND(((total_models - LAG(total_models) OVER (ORDER BY captured_at))::NUMERIC /
        NULLIF(LAG(total_models) OVER (ORDER BY captured_at), 0) * 100), 2)
    AS growth_percentage
FROM ecosystem_snapshots
ORDER BY captured_at DESC;

-- Seed with historical data (from current hardcoded timeline)
INSERT INTO ecosystem_snapshots (captured_at, total_models, curated_models, providers_count, is_interpolated, notes) VALUES
  ('2023-01-15 12:00:00+00', 121000, 50, 15, false, 'Historical: Foundation Era start'),
  ('2023-06-15 12:00:00+00', 239000, 65, 22, false, 'Historical: Mid 2023 growth'),
  ('2023-10-15 12:00:00+00', 371000, 85, 28, false, 'Historical: Pre-ChatGPT anniversary'),
  ('2023-12-15 12:00:00+00', 420000, 95, 32, true, 'Interpolated: End of Foundation Era'),
  ('2024-03-15 12:00:00+00', 510000, 105, 35, true, 'Interpolated: Early Acceleration'),
  ('2024-06-15 12:00:00+00', 645000, 120, 38, true, 'Interpolated: Mid 2024'),
  ('2024-09-15 12:00:00+00', 825000, 135, 42, true, 'Interpolated: Late 2024'),
  ('2024-12-15 12:00:00+00', 1050000, 150, 45, false, 'Milestone: 1 Million models'),
  ('2025-01-15 12:00:00+00', 1140000, 155, 46, true, 'Interpolated: Early 2025'),
  ('2025-03-15 12:00:00+00', 1350000, 160, 47, true, 'Interpolated: Mid Q1 2025'),
  ('2025-05-15 12:00:00+00', 1600000, 163, 47, true, 'Interpolated: Mid 2025'),
  ('2025-07-15 12:00:00+00', 1890000, 165, 47, false, 'Historical: Last hardcoded point')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE ecosystem_snapshots IS 'Historical snapshots of AI model ecosystem for dynamic visualizations and trend analysis';
COMMENT ON COLUMN ecosystem_snapshots.is_interpolated IS 'True if this is an estimated/interpolated value rather than actual measurement';
COMMENT ON COLUMN ecosystem_snapshots.provider_distribution IS 'JSON object with provider names as keys and model counts as values';
COMMENT ON COLUMN ecosystem_snapshots.capability_counts IS 'JSON object with capability names as keys and occurrence counts as values';
