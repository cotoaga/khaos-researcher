# 🧹 KHAOS-Researcher Cleanup Plan

## ✅ Completed: Official Sources Only

**What Changed:**
- ✅ Removed `HuggingFaceUniversalSource` (was adding trash community models)
- ✅ Created `EcosystemSource` (tracks 2.4M ecosystem metric without curated models)
- ✅ Kept only official sources: `AnthropicSource`, `OpenAISource`, `GeminiSource`
- ✅ Deployed to production

**Current Status:**
- Database still has ~298 models (including trash)
- New research runs will only add official models
- Old trash models need to be purged

---

## 📋 Step 1: Add Anthropic API Key to Vercel

```bash
# Add your Anthropic API key to production environment
vercel env add ANTHROPIC_API_KEY production

# When prompted, paste your key: sk-ant-api03-...
```

Then redeploy:
```bash
vercel --prod
```

---

## 📋 Step 2: Purge Trash Models from Database

### Option A: Safe Preview (Recommended First)

Run the preview query in Supabase SQL Editor to see what will be deleted:

```sql
-- See what we're about to delete
SELECT
  provider,
  COUNT(*) as model_count,
  STRING_AGG(DISTINCT model_id, ', ') as sample_models
FROM models
WHERE
  provider NOT IN ('OpenAI', 'Anthropic', 'Google')
  AND NOT (provider = 'HuggingFace' AND model_id = 'ecosystem-ocean')
  OR (provider = 'OpenAI' AND model_id LIKE '%:%')
GROUP BY provider
ORDER BY model_count DESC;
```

### Option B: Execute Full Purge

Once you've reviewed, run the full script:

```bash
# The SQL script is at: scripts/purge_trash_models.sql
# Copy/paste it into Supabase SQL Editor and execute
```

**Expected Result:**
- Before: ~298 models (with trash)
- After: ~26-30 models (official only)

---

## 📋 Step 3: Trigger Research Run

After purging, trigger a fresh research run:

```bash
# Via API (may hit rate limit if you ran recently)
curl https://khaos-researcher.cotoaga.ai/api/research

# Or wait for next auto-run (every 6 hours)
# Next cron: 12:00 UTC, 18:00 UTC, etc.
```

**Expected Outcome:**
- AnthropicSource: 6 official Claude models
- OpenAISource: ~15-20 official OpenAI models
- GeminiSource: 5 official Gemini models (fallback)
- EcosystemSource: 1 ecosystem-ocean model (2.4M metric)
- **Total: ~27-32 official models**

---

## 🔮 Next Steps: Add More Providers

### Step 4: Google Gemini API (Optional)

```bash
# Add Google AI API key for live Gemini data
vercel env add GEMINI_API_KEY production
vercel --prod
```

Without the key, it uses the curated fallback list (5 models).

### Step 5: xAI Support (Future)

Need to research xAI API availability. Options:
1. Official xAI API (if available)
2. Curated list like AnthropicSource
3. Whitelist xai-org/* from HuggingFace

### Step 6: Meta & Mistral (Optional)

For "sunny days" support:
1. Meta: Whitelist meta-llama/* from HuggingFace
2. Mistral: Whitelist mistralai/* from HuggingFace

---

## 📊 Verify Clean Data

After purging and re-running research:

1. **Check Dashboard**: https://khaos-researcher.cotoaga.ai
2. **Curated Models**: Should show ~27-32 official models
3. **Ecosystem Metric**: Should show ~2.4M total models
4. **No More Trash**: No "RichardErkhov", "TheBloke", or GGUF conversions

---

## 🎯 Success Criteria

- ✅ Only official models from OpenAI, Anthropic, Google
- ✅ Ecosystem intelligence (2.4M) still tracked
- ✅ No community conversions or fine-tunes
- ✅ "Curated" truly means "we have the API key"
