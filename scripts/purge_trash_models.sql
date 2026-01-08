-- ============================================================================
-- PURGE TRASH MODELS - Keep only official sources
-- ============================================================================
--
-- This script removes all community models and keeps only:
-- - OpenAI official models (excluding fine-tunes)
-- - Anthropic official Claude models
-- - Google official Gemini models
-- - HuggingFace ecosystem-ocean (for ecosystem metrics)
-- - Future: xAI, Meta, Mistral (when added)
--
-- ⚠️  WARNING: This will permanently delete models. Review carefully!
-- ============================================================================

-- First, let's see what we're about to delete
SELECT
  provider,
  COUNT(*) as model_count,
  STRING_AGG(DISTINCT model_id, ', ') as sample_models
FROM models
WHERE
  -- Keep official providers
  provider NOT IN ('OpenAI', 'Anthropic', 'Google')
  -- Remove ecosystem-ocean (we want to keep it)
  AND NOT (provider = 'HuggingFace' AND model_id = 'ecosystem-ocean')
  -- Remove OpenAI fine-tunes (model_id contains ':')
  OR (provider = 'OpenAI' AND model_id LIKE '%:%')
GROUP BY provider
ORDER BY model_count DESC;

-- ============================================================================
-- EXECUTE DELETE (uncomment when ready)
-- ============================================================================

-- Step 1: Delete all non-official providers (except ecosystem-ocean)
DELETE FROM models
WHERE
  provider NOT IN ('OpenAI', 'Anthropic', 'Google')
  AND NOT (provider = 'HuggingFace' AND model_id = 'ecosystem-ocean');

-- Step 2: Delete OpenAI fine-tunes (contain ':' in model_id)
DELETE FROM models
WHERE
  provider = 'OpenAI'
  AND model_id LIKE '%:%';

-- Step 3: Delete community conversions (gguf, awq, etc.)
DELETE FROM models
WHERE
  model_id ILIKE '%gguf%'
  OR model_id ILIKE '%awq%'
  OR model_id ILIKE '%gptq%'
  OR model_id ILIKE '%bnb%'
  OR model_id ILIKE '%quantized%';

-- Step 4: Delete models from suspicious sources (community accounts)
DELETE FROM models
WHERE
  model_id LIKE 'RichardErkhov/%'
  OR model_id LIKE 'TheBloke/%'
  OR model_id LIKE '%unsloth%'
  OR model_id LIKE '%lora%';

-- ============================================================================
-- VERIFY RESULTS
-- ============================================================================

-- Check what's left
SELECT
  provider,
  COUNT(*) as model_count,
  STRING_AGG(model_id, ', ') as models
FROM models
GROUP BY provider
ORDER BY provider;

-- Check total before and after
-- Before: ~298 models (with trash)
-- After: ~26-30 models (official only)

SELECT COUNT(*) as total_models FROM models;
