# Database Schema Setup

## Quick Start

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of ecosystem_snapshots.sql
```

Or use the Supabase CLI:

```bash
supabase db push
```

## What Gets Created

### Tables
- `ecosystem_snapshots` - Historical AI model ecosystem data points
  - Core metrics (total_models, curated_models, providers_count)
  - Growth metrics (growth_rate_per_day, models_added_since_last)
  - Provider distribution (JSONB for racing bar chart)
  - Capability counts (JSONB for heatmap)
  - Quality signals (multimodal_percentage, avg_capabilities_per_model)

### Views
- `ecosystem_growth_metrics` - Calculated growth rates and percentages

### Policies
- Public read access for all snapshots
- Service role full access for writes

### Seed Data
- Historical data from 2023-01 to 2025-07 (12 data points)
- Marked as `is_interpolated` where estimated

## Verification

After running the schema, verify with:

```sql
-- Check if table exists
SELECT COUNT(*) FROM ecosystem_snapshots;
-- Should return: 12 (historical seed data)

-- Check latest snapshot
SELECT
  captured_at,
  total_models,
  growth_rate_per_day
FROM ecosystem_snapshots
ORDER BY captured_at DESC
LIMIT 1;

-- View growth metrics
SELECT * FROM ecosystem_growth_metrics LIMIT 5;
```

## Next Steps

1. ✅ Run the schema SQL
2. ✅ Deploy the application (it will start capturing snapshots automatically)
3. ✅ Trigger a research run: `curl https://khaos-researcher.cotoaga.ai/api/research`
4. ✅ View the dynamic timeline: Visit dashboard
5. 🚀 Ready for Advanced features (Phase 2)

## Future Enhancements (Phase 2)

The schema is already prepared for:
- **Provider Racing Bar Chart**: Uses `provider_distribution` JSONB
- **Capability Heatmap**: Uses `capability_counts` JSONB
- **Predictive Analytics**: Uses `growth_rate_per_day` time series
- **Quality Tracking**: Uses `multimodal_percentage`, `avg_capabilities_per_model`

No schema changes needed for these features!
