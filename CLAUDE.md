# 🗡️ KHAOS-Researcher - Claude Code Knowledge Base

## Project Overview

KHAOS-Researcher is an AI Model Intelligence Agent that monitors and tracks AI model releases from major providers. It's part of the KHAOS Fellowship ecosystem and follows KHAOS-Coder principles: simple, tested, and effective.

### Key Facts
- **Repository**: https://github.com/cotoaga/khaos-researcher
- **Vercel Deployment**: https://khaos-researcher.vercel.app
- **Purpose**: Monitor AI model landscape, track new releases, maintain living database
- **Tech Stack**: Node.js, Vercel Functions, Supabase, Cron Jobs
- **No Build Step**: Pure Node.js, no compilation needed
- **Data Storage**: Supabase PostgreSQL with file fallback

## Architecture

### Directory Structure
```
khaos-researcher/
├── api/                      # Vercel serverless functions
│   ├── data.js              # GET /api/data - Returns model database
│   ├── research.js          # GET /api/research - Triggers research cycle
│   ├── generate.js          # GET /api/generate - Code generation
│   └── webhook.js           # POST /api/webhook - External triggers
├── data/
│   └── ai_models.json       # Legacy file storage (fallback)
├── src/
│   ├── index.js             # Main entry point, KHAOSResearcher class
│   ├── database/
│   │   └── SupabaseDatabase.js # Supabase persistence layer
│   ├── models/
│   │   ├── ModelDatabase.js # Smart database selector
│   │   ├── FileModelDatabase.js # File-based storage
│   │   └── ModelAnalyzer.js # Change detection logic
│   ├── sources/
│   │   ├── OpenAISource.js  # Fetches from OpenAI API
│   │   └── AnthropicSource.js # Known Anthropic models
│   ├── generators/          # Code generation system
│   │   ├── CodeGenerator.js # Base generator class
│   │   ├── JavaScriptGenerator.js # JS/TS generator
│   │   ├── PythonGenerator.js # Python generator
│   │   └── index.js         # Unified generator
│   ├── integrations/        # Webhook integrations (future)
│   └── utils/
│       ├── Logger.js        # Winston logging
│       └── Scheduler.js     # Cron job management
├── tests/                   # Vitest test suite
├── .env.example             # Environment template
├── vercel.json              # Deployment config with cron
└── package.json             # Dependencies and scripts
```

### Core Components

1. **KHAOSResearcher** (src/index.js)
   - Main orchestrator class
   - Manages sources, database, and scheduling
   - CLI interface for different run modes

2. **ModelDatabase** (src/models/ModelDatabase.js)
   - Smart database selector (Supabase or file-based)
   - Automatically uses Supabase when SUPABASE_URL is set
   - Falls back to JSON files for local development
   - Key format: `${provider}-${modelId}`

3. **SupabaseDatabase** (src/database/SupabaseDatabase.js)
   - Production-ready PostgreSQL persistence
   - Rate limiting and research run tracking
   - Real-time data without file system dependencies

4. **Data Sources**
   - OpenAISource: Uses OpenAI API to list models
   - AnthropicSource: Hardcoded known models (no public API)
   - Extensible for Google, HuggingFace, etc.

5. **Vercel Functions**
   - Serverless endpoints for API access
   - Cron job runs every 6 hours
   - Rate limiting (2 requests/hour/IP)
   - Handles CORS for web access

## Running the Project

### Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add API keys to .env:
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# SUPABASE_URL=https://[PROJECT_ID].supabase.co
# SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_KEY=eyJ...

# Run modes
npm run research  # Single research cycle
npm run monitor   # Continuous monitoring (cron)
npm run dev       # Same as monitor
npm test          # Run test suite

# Code generation
npm run generate     # JavaScript (default)
npm run generate:js  # JavaScript
npm run generate:ts  # TypeScript
npm run generate:py  # Python
```

### Environment Variables

Required:
- `OPENAI_API_KEY` - For fetching OpenAI models
- `ANTHROPIC_API_KEY` - For future Anthropic API

Production (with Supabase):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public key for read operations
- `SUPABASE_SERVICE_KEY` - Service key for write operations

Optional:
- `DISCORD_WEBHOOK_URL` - Discord notifications
- `SLACK_WEBHOOK_URL` - Slack notifications
- `LOG_LEVEL` - Logging verbosity (default: info)

### Vercel Deployment

```bash
# Add environment variables (one-time)
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_KEY production

# Deploy
vercel --prod

# Check deployment
vercel ls
vercel inspect https://khaos-researcher.vercel.app
```

## API Endpoints

### GET /api/data
Returns the current model database.

```bash
curl https://khaos-researcher.vercel.app/api/data
```

Response:
```json
{
  "success": true,
  "data": {
    "metadata": {
      "lastUpdate": "2025-06-20T10:14:07.743Z",
      "version": "1.0.0",
      "totalModels": 53
    },
    "models": {
      "OpenAI-gpt-4": { ... },
      "Anthropic-claude-3-5-sonnet": { ... }
    }
  }
}
```

### GET /api/research
Triggers a research cycle to fetch latest models. **Rate limited to 2 requests per hour per IP**.

```bash
curl https://khaos-researcher.vercel.app/api/research
```

Response:
```json
{
  "success": true,
  "runId": "uuid-here",
  "discoveries": 28,
  "timestamp": "2025-06-22T09:10:04.651Z",
  "data": [...],
  "agent": "KHAOS-Researcher v1.0",
  "environment": "Vercel Serverless + Supabase"
}
```

Rate limit exceeded response:
```json
{
  "error": "Rate limit exceeded. Maximum 2 research runs per hour.",
  "retryAfter": 3600,
  "runsInLastHour": 2
}
```

### GET /api/generate
Generates client SDK code for AI models.

```bash
# Default: JavaScript class style
curl https://khaos-researcher.vercel.app/api/generate

# TypeScript with object style
curl "https://khaos-researcher.vercel.app/api/generate?language=typescript&style=object"

# Python dataclass style
curl "https://khaos-researcher.vercel.app/api/generate?language=python&style=dataclass"

# Filter by providers
curl "https://khaos-researcher.vercel.app/api/generate?providers=OpenAI,Anthropic"

# Get JSON response
curl "https://khaos-researcher.vercel.app/api/generate?format=json"
```

Parameters:
- `language`: js, typescript, python (default: js)
- `style`: Language-specific styles (default: class)
- `providers`: Comma-separated provider filter
- `format`: code or json (default: code)

### POST /api/webhook
Receives external triggers (future implementation).

## Data Format

Models are stored with this structure:
```json
{
  "provider": "OpenAI",
  "id": "gpt-4",
  "created": 1678659856,
  "capabilities": ["reasoning", "code", "vision"],
  "metadata": {
    "owned_by": "openai",
    "family": "gpt-4"
  },
  "lastUpdated": "2025-06-22T09:10:04.648Z"
}
```

## Database Schema

### Supabase Tables

If you need to recreate the Supabase tables, run this SQL:

```sql
-- Core models table
CREATE TABLE IF NOT EXISTS models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  capabilities TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, model_id)
);

-- Research runs for tracking
CREATE TABLE IF NOT EXISTS research_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  models_found INTEGER DEFAULT 0,
  new_discoveries INTEGER DEFAULT 0,
  source TEXT NOT NULL,
  trigger_type TEXT DEFAULT 'manual',
  ip_address TEXT,
  status TEXT DEFAULT 'running',
  error TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider);
CREATE INDEX IF NOT EXISTS idx_research_runs_ip ON research_runs(ip_address);
CREATE INDEX IF NOT EXISTS idx_research_runs_started ON research_runs(started_at);

-- Enable RLS
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_runs ENABLE ROW LEVEL SECURITY;

-- Public read access for models
CREATE POLICY "Public can read models" ON models
  FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access to models" ON models
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to runs" ON research_runs
  FOR ALL USING (auth.role() = 'service_role');
```

## Monitoring Output

When running locally with `npm run monitor`:

```
🔄 Starting continuous monitoring...
🚀 KHAOS-Researcher initializing...
📂 Loaded 53 models from Supabase
✅ Initialization complete
🔍 Starting research cycle...
📡 Fetched 50 models from OpenAI
🔍 Analyzed 50 models, found 25 discoveries
🔄 Updated 3 models (2 new)
💾 Models auto-saved to Supabase
📢 Notifying about 28 discoveries
✅ Research cycle complete. Found 28 new discoveries.
⏰ Starting scheduler with cron: 0 */6 * * *
✅ Scheduler started successfully
```

## Common Issues & Solutions

### Issue: "no such file or directory, open 'data/ai_models.json'"
**Solution**: You're running in file mode. Either:
1. Set SUPABASE_URL to enable database mode, or
2. Run locally first to create the data directory:
```bash
npm run research
```

### Issue: 401 Unauthorized on Vercel
**Solution**: API keys not set in Vercel environment:
```bash
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_KEY production
vercel --prod
```

### Issue: "Rate limit exceeded"
**Solution**: Wait 1 hour between research runs, or use different IP address.

### Issue: Supabase connection errors
**Solution**: Check environment variables and database tables exist:
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('models', 'research_runs');
```

### Issue: Research not finding new models
**Solution**: Check API keys are valid and have proper permissions.

## Development Workflow

1. **Make Changes Locally**
   ```bash
   # Edit files
   npm run dev  # Test locally
   npm test     # Run tests
   ```

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

## Testing

Uses Vitest for testing:
```bash
npm test          # Run once
npm run test:watch # Watch mode
npm run test:coverage # Coverage report
```

Test files are in `tests/` directory with `.test.js` extension.

## Future Enhancements

1. **More Data Sources**
   - Google AI models
   - HuggingFace model hub
   - AWS Bedrock models

2. **Webhook Notifications**
   - Discord alerts for new models
   - Slack integration
   - DAGGER knowledge graph updates

3. **Enhanced Analysis**
   - Capability comparison
   - Performance benchmarks
   - Cost analysis

4. **Web Interface**
   - Visual model browser
   - Historical trends
   - Search and filter

## Integration with KHAOS Ecosystem

- **DAGGER**: Can push model updates to knowledge graph
- **Discord Bot**: Can query latest models
- **Other Agents**: Provides model intelligence as a service

## Security Notes

- API keys are never logged or exposed
- Vercel functions have 30s timeout
- CORS enabled for web access
- Rate limiting prevents abuse (2 requests/hour/IP)
- Row Level Security (RLS) enabled on all tables
- Public read access for models, service role for writes
- IP tracking for research runs

## Maintenance

- Check logs regularly for API errors
- Update model schemas as providers change
- Monitor Vercel function usage
- Keep dependencies updated

## Debugging

Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

Check Vercel logs:
```bash
vercel logs
```

Test API endpoints locally:
```bash
vercel dev
```

---

*This document contains all operational knowledge about KHAOS-Researcher for Claude Code sessions.*