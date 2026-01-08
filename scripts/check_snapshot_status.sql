-- Check all snapshots to see what data we actually have
SELECT
  id,
  captured_at,
  total_models,
  curated_models,
  is_interpolated,
  notes,
  research_run_id
FROM ecosystem_snapshots
ORDER BY captured_at DESC
LIMIT 20;

-- Check if auto-research has been running at all
SELECT
  id,
  started_at,
  completed_at,
  status,
  models_found,
  new_discoveries,
  trigger_type,
  error
FROM research_runs
ORDER BY started_at DESC
LIMIT 10;

-- Check when the table was created
SELECT
  MIN(captured_at) as first_snapshot,
  MAX(captured_at) as last_snapshot,
  COUNT(*) as total_snapshots,
  COUNT(CASE WHEN is_interpolated = false THEN 1 END) as actual_snapshots,
  COUNT(CASE WHEN research_run_id IS NOT NULL THEN 1 END) as auto_captured_snapshots
FROM ecosystem_snapshots;
