-- Delete invalid snapshot with 0 or very low model counts
-- Run this in your Supabase SQL Editor

-- First, let's see what we're deleting
SELECT id, captured_at, total_models, curated_models, research_run_id
FROM ecosystem_snapshots
WHERE total_models < 100000
ORDER BY captured_at DESC;

-- If the above looks correct (should show the 2026-01-08 snapshot with 0 models), then run:
DELETE FROM ecosystem_snapshots
WHERE total_models < 100000;

-- Verify it's gone
SELECT COUNT(*) as remaining_snapshots,
       MIN(captured_at) as first_snapshot,
       MAX(captured_at) as last_snapshot,
       MAX(total_models) as peak_models
FROM ecosystem_snapshots;
