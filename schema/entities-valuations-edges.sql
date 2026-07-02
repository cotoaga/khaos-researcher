-- ================================================================
-- COT-71: Gem ↔ KHAOS-Researcher shared tables
-- entities  : who owns whom (capital actors + state actors)
-- valuations: value per entity per quarter
-- edges     : relationships between entities
-- model_entity_join: the Kilonova — capital flow overlaid on
--             model release cadence
-- ================================================================

-- entities -------------------------------------------------------
CREATE TABLE IF NOT EXISTS entities (
  id         TEXT PRIMARY KEY,           -- lowercase slug, matches gem node IDs
  label      TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'commercial'
    CHECK (actor_type IN ('commercial', 'state'))
);

-- valuations -----------------------------------------------------
CREATE TABLE IF NOT EXISTS valuations (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id   TEXT    NOT NULL REFERENCES entities(id),
  value       NUMERIC NOT NULL,          -- in $T (trillions), 0 for non-commercial
  value_type  TEXT    NOT NULL DEFAULT 'PRIVATE_POST_MONEY'
    CHECK (value_type IN ('PUBLIC_MARKET_CAP','PRIVATE_POST_MONEY','AUM','NONE')),
  as_of_date  DATE    NOT NULL,          -- quarter end date
  quarter     TEXT    NOT NULL,          -- e.g. '2026Q2'
  source_url  TEXT,
  source_tier TEXT    CHECK (source_tier IN ('T1','T2','T3')),
  quality     TEXT    NOT NULL DEFAULT 'C'
    CHECK (quality IN ('V','C','D')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, quarter)
);

-- capital_edges --------------------------------------------------
-- Note: public.edges already exists for the KHAOS social graph.
-- These are capital-flow edges between AI industry entities.
CREATE TABLE IF NOT EXISTS capital_edges (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  source     TEXT    NOT NULL REFERENCES entities(id),
  target     TEXT    NOT NULL REFERENCES entities(id),
  edge_type  TEXT    NOT NULL
    CHECK (edge_type IN ('investment','services','hardware-software','venture-capital','regulatory')),
  value      NUMERIC,                    -- deal/flow size in $B
  quarter    TEXT    NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, target, edge_type, quarter)
);

-- Indexes --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_valuations_entity     ON valuations(entity_id);
CREATE INDEX IF NOT EXISTS idx_valuations_quarter    ON valuations(quarter);
CREATE INDEX IF NOT EXISTS idx_capital_edges_quarter ON capital_edges(quarter);
CREATE INDEX IF NOT EXISTS idx_capital_edges_source  ON capital_edges(source);
CREATE INDEX IF NOT EXISTS idx_capital_edges_target  ON capital_edges(target);

-- The Kilonova join: model releases overlaid on capital flow -----
-- "When SoftBank's $41B landed, what did OpenAI ship next?"
CREATE OR REPLACE VIEW model_entity_join AS
SELECT
  m.id             AS model_uuid,
  m.provider,
  m.model_id,
  m.capabilities,
  m.created_at     AS model_release_date,
  m.metadata,
  e.id             AS entity_id,
  e.label          AS entity_label,
  e.actor_type
FROM models m
LEFT JOIN entities e ON LOWER(m.provider) = e.id;

-- RLS ------------------------------------------------------------
ALTER TABLE entities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read entities"      ON entities      FOR SELECT USING (true);
CREATE POLICY "Public read valuations"    ON valuations    FOR SELECT USING (true);
CREATE POLICY "Public read capital_edges" ON capital_edges FOR SELECT USING (true);

CREATE POLICY "Service write entities"      ON entities      FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write valuations"    ON valuations    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write capital_edges" ON capital_edges FOR ALL USING (auth.role() = 'service_role');
