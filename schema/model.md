# Model Schema Contract

## `created_at` type contract

**Type:** ISO 8601 string, timezone-aware (UTC)
**Format:** `YYYY-MM-DDTHH:mm:ss.sssZ`
**Example:** `"2024-05-13T00:00:00.000Z"`

**Invariants:**
- Must never be a Unix epoch integer (e.g. `1715558400`). Epoch ints are the fossil format from `data/ai_models.json` (pre-2025-12-01). Any epoch int in Supabase indicates a migration bug.
- Must never be a bare date string without timezone (e.g. `"2024-05-13"`). Use UTC midnight if only the date is known.
- `updated_at` follows the same contract.

**Date quality (`metadata.date_quality`):**
| Value | Meaning |
|-------|---------|
| `verified` | Known release date from official announcement |
| `api_listing` | API-returned date (upload/modification date); tracks release closely for post-2023 models |
| `sentinel` | Date shared by >3 models of the same provider — almost certainly a batch-stamping artifact |
| `unknown` | No reliable date information |

**Sentinel definition:** Any `created_at` date-day shared by more than 3 models of the same provider is classified as a sentinel. Sentinels are displayed in the UI with ⚠️ but are not excluded from the model grid.

## Reserved table names (for gem linkage — not yet implemented)

The following table names are reserved for the Industrial-AI-Complex gem migration (separate work order):
- `entities` — companies, labs, investors
- `valuations` — funding rounds and valuation snapshots
- `edges` — relationships between entities and models

Do NOT create these tables in this schema until the gem work order is active.
