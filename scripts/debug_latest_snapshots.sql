-- Check all 2026 snapshots
SELECT
  id,
  captured_at,
  total_models,
  curated_models,
  research_run_id,
  is_interpolated
FROM ecosystem_snapshots
WHERE captured_at >= '2026-01-01'
ORDER BY captured_at DESC;

-- Check the latest research runs to see if snapshot capture succeeded
SELECT
  r.id,
  r.started_at,
  r.completed_at,
  r.status,
  r.models_found,
  r.new_discoveries,
  r.trigger_type,
  r.error
FROM research_runs r
ORDER BY r.started_at DESC
LIMIT 5;

-- Check if there's a snapshot linked to the latest research run
SELECT
  r.id as run_id,
  r.started_at,
  r.status,
  s.id as snapshot_id,
  s.captured_at,
  s.total_models
FROM research_runs r
LEFT JOIN ecosystem_snapshots s ON s.research_run_id = r.id
WHERE r.started_at >= '2026-01-08'
ORDER BY r.started_at DESC;
