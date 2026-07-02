# Quarterly Refresh Ritual — COT-71

**Owner:** Kurt  
**Cadence:** After each quarter closes (Q end + ~2 weeks for data to settle)  
**Tool:** Perplexity Pro (or equivalent deep-research tool)  
**Automation:** Do NOT automate. Human triage is the point.

---

## Purpose

The gem (Industrial AI Complex) and the researcher (KHAOS-Researcher) share a Supabase project. This ritual keeps both instruments honest. Automation would remove the human quality gate that makes the V/C/D trust system meaningful.

---

## Step 1 — Perplexity Research Run

Run the following prompts for the closing quarter (e.g. `2026Q3`). Run each separately to avoid context contamination.

### Public market caps (T1 / T2)
```
What was [COMPANY]'s market capitalization at the end of [QUARTER, e.g. September 30 2026]?
Provide the figure in USD trillions (e.g. "$2.4T"). Cite your source.
```
Run for: Microsoft, Google (Alphabet), Meta, NVIDIA, Amazon, Apple, Oracle, Adobe,
Salesforce, SoftBank Group, Uber, Tesla.

### Private post-money valuations (T1 / T2)
```
What is the most recent confirmed post-money valuation for [COMPANY] as of [QUARTER END]?
Include the round name, date, and lead investors. Cite primary source if available.
```
Run for: OpenAI, Anthropic, xAI, DeepSeek, Mistral, Scale AI, Stripe (until IPO).

### VC AUM
```
What is Sequoia Capital's current assets under management (AUM) as of [QUARTER END]?
```

### New edges or relationship changes
```
Were there any significant investment rounds, acquisitions, or partnership agreements
between major AI companies in [QUARTER]? Focus on: OpenAI, Anthropic, xAI, Google,
Microsoft, Meta, NVIDIA, Amazon, SoftBank, Sequoia.
```

### Regulatory activity
```
Were there any new antitrust investigations, regulatory rulings, or government
interventions targeting AI companies in the EU or US in [QUARTER]?
```

---

## Step 2 — Triage NOT FOUNDs by Species

After the research run, classify each data gap:

| Species | Example | Action |
|---------|---------|--------|
| **Retrieval artifact** | Perplexity cites stale data | Re-run with more specific date range |
| **Sourcing gap** | Private company, no announcement | Mark `quality: 'C'` (carried) |
| **Tool failure** | Perplexity refuses / hallucinates | Direct pull from primary source |

---

## Step 3 — Direct Pulls for Public Caps

For public companies where Perplexity is uncertain:
1. Yahoo Finance → search ticker → "Statistics" tab → Market Cap
2. Cross-check with Bloomberg / CNBC if >5% discrepancy
3. Source tier: T1 (company IR) > T2 (Bloomberg/CNBC/WSJ) > T3 (secondary / aggregator)

---

## Step 4 — Pinpoint Prompts for Private Marks

For private companies with no confirmed round:
```
Has [COMPANY] raised any funding or had any secondary transactions or tender offers
that would establish a new valuation mark in [QUARTER]? Be specific about the date.
```
If no new mark: **carry the previous quarter's value** with `quality: 'C'`.  
If disputed: `quality: 'D'` + add a comment in source_url field.

---

## Step 5 — INSERT with source_tier + quality

Use the Supabase MCP or a direct SQL insert:

```sql
-- Example: update OpenAI valuation for 2026Q3
INSERT INTO valuations (entity_id, value, value_type, as_of_date, quarter, source_url, source_tier, quality)
VALUES (
  'openai',
  1.200,                          -- $1.2T post-money
  'PRIVATE_POST_MONEY',
  '2026-09-30',
  '2026Q3',
  'https://bloomberg.com/...',    -- primary source URL
  'T2',
  'V'                             -- V = verified
)
ON CONFLICT (entity_id, quarter)
DO UPDATE SET
  value       = EXCLUDED.value,
  source_url  = EXCLUDED.source_url,
  source_tier = EXCLUDED.source_tier,
  quality     = EXCLUDED.quality;
```

For new edges (new investments/relationships):
```sql
INSERT INTO capital_edges (source, target, edge_type, value, quarter, source_url)
VALUES ('amazon', 'openai', 'investment', 50, '2026Q3', 'https://...')
ON CONFLICT (source, target, edge_type, quarter)
DO UPDATE SET value = EXCLUDED.value, source_url = EXCLUDED.source_url;
```

If a new entity appears (new company entering the graph):
```sql
INSERT INTO entities (id, label, actor_type) VALUES ('newco', 'NewCo Inc.', 'commercial');
```

---

## Step 6 — Regenerate Static Export

After all inserts are verified:

```bash
cd khaos-researcher
node scripts/generate-timeline.js
# Writes: ../cotoaga-ai-gems/industrial-ai-complex/timeline-data.json
```

Review the diff, then commit both repos:
```bash
# in khaos-researcher:
git add scripts/generate-timeline.js
git commit -m "chore: Q[N] valuation refresh — [quarter]"

# in cotoaga-ai-gems:
git add industrial-ai-complex/timeline-data.json
git commit -m "data: regenerate timeline for [quarter]"
```

Deploy both.

---

## Open Verification Items (carry until resolved)

| Item | Status | Action |
|------|--------|--------|
| xAI/SpaceX all-stock acquisition | D (disputed, T3-only) | Needs T2 confirmation before graph restructure |
| Sequoia AUM | C (carried) | Verify current AUM each quarter |
| Scale AI post-money | C (carried) | Needs new round or confirmed mark |
| DeepSeek round | C (carried) | $52-59B projected range only |
| SoftBank FX rate | V (verified, ¥35.3T → $0.225T used) | Re-pin FX at quarter close |

---

## Yak Tripwire (binding)

Steps 1–5 kill a recurring quarterly chore — legitimate infrastructure.  
**If any step starts sprouting feature ideas**, ship what exists and walk away from the machinery.
