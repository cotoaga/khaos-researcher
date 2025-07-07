# 🗡️ KHAOS-Researcher

> AI Model Intelligence Agent for the KHAOS Fellowship

A simple, reliable AI agent that monitors the rapidly evolving AI model landscape and keeps your knowledge current. Built with KHAOS-Coder principles: test-driven, pragmatic, and effective.

**Now with production-ready Supabase persistence and rate limiting!**

## 🚀 Live Deployment Status

**Production URL**: https://khaos-researcher.vercel.app

**API Endpoints**:
- **Research API**: `GET/POST /api/research` - Trigger model discovery
- **Data API**: `GET /api/data` - Get current model database
- **Generate API**: `GET /api/generate` - Generate client SDK code
- **Dashboard**: `/` - Interactive web interface

**Current Status**: ⚠️ **Under Active Development**
- **Issue**: Memory mode inconsistency in serverless environment
- **Rate Limiting**: Temporarily disabled for testing
- **Database**: Supabase configured with file storage fallback
- **Sources**: 5 AI providers (OpenAI, Anthropic, Google, Mistral, HuggingFace)

**Expected Models**: ~63 discoveries per research cycle

## Quick Start

### 1. Setup Local Development

```bash
# Clone repository
git clone https://github.com/cotoaga/khaos-researcher.git
cd khaos-researcher

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your API keys:
# - OPENAI_API_KEY=sk-...
# - ANTHROPIC_API_KEY=sk-ant-...
# - SUPABASE_URL=https://[PROJECT_ID].supabase.co (for production)
# - SUPABASE_ANON_KEY=eyJ... (for production)
# - SUPABASE_SERVICE_KEY=eyJ... (for production)
```

### 2. Running Locally

```bash
# Run a single research cycle (fetches latest AI models)
npm run research

# Start continuous monitoring (runs every 6 hours)
npm run monitor

# Run in development mode (same as monitor)
npm run dev

# Run tests
npm test

# Generate client SDK code
npm run generate                   # JavaScript (default)
npm run generate:js                # JavaScript
npm run generate:ts                # TypeScript
npm run generate:py                # Python
```

### 3. What It Does

When you run the researcher:
1. **Fetches** latest AI models from OpenAI and Anthropic APIs
2. **Analyzes** changes and new model releases
3. **Saves** data to Supabase (production) or `data/ai_models.json` (local)
4. **Logs** activity to console (look for green checkmarks ✅)
5. **Schedules** automatic updates every 6 hours (in monitor mode)
6. **Tracks** research runs and enforces rate limiting

### 4. Vercel Deployment

The app is deployed at: https://khaos-researcher.vercel.app

To update the Vercel deployment:

```bash
# Add environment variables to Vercel (one-time setup)
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_KEY production

# Deploy to production
vercel --prod
```

Available endpoints:
- `/api/data` - View current AI models database (reads from Supabase)
- `/api/research` - Trigger a research cycle (rate limited: 2/hour/IP)
- `/api/webhook` - Webhook receiver for external triggers
- `/api/generate` - Generate client SDK code for AI models

## Features

- 🔍 **Multi-Source Monitoring**: OpenAI, Anthropic, Google, HuggingFace
- 📊 **Intelligent Analysis**: Detects capability changes and new releases
- 🔄 **Continuous Updates**: Automated research cycles via cron
- 🚀 **Vercel Ready**: Deploy as serverless functions
- 🗄️ **Supabase Persistence**: Production-ready PostgreSQL database
- 🛡️ **Rate Limiting**: Prevents abuse (2 requests/hour/IP)
- 📈 **Analytics**: Track research runs and discoveries
- 🧪 **Test Driven**: Comprehensive test coverage
- 📡 **Webhook Integration**: Discord, Slack, DAGGER notifications
- 🔨 **Code Generation**: Generate client SDKs in JavaScript, TypeScript, and Python

## Code Generation

Generate client SDK code for all discovered AI models:

### CLI Usage

```bash
# Generate JavaScript SDK (default)
node src/index.js --generate

# Generate TypeScript SDK
node src/index.js --generate --language typescript --style class

# Generate Python SDK
node src/index.js --generate --language python --style dataclass

# Filter by providers
node src/index.js --generate --providers OpenAI,Anthropic
```

### API Usage

```bash
# Generate JavaScript class-style SDK
curl https://khaos-researcher.vercel.app/api/generate

# Generate TypeScript object-style SDK
curl "https://khaos-researcher.vercel.app/api/generate?language=typescript&style=object"

# Generate Python enum-style SDK
curl "https://khaos-researcher.vercel.app/api/generate?language=python&style=enum"

# Get JSON response with code
curl "https://khaos-researcher.vercel.app/api/generate?format=json"
```

### Supported Options

**Languages:**
- `javascript` / `js` - Modern ES6+ JavaScript
- `typescript` / `ts` - TypeScript with full type definitions  
- `python` / `py` - Python 3.6+ with type hints

**JavaScript/TypeScript Styles:**
- `class` - Class-based with static methods
- `object` - Object literal with helper functions
- `constants` - Simple constants and arrays

**Python Styles:**
- `class` - Traditional class hierarchy
- `dataclass` - Modern dataclass approach
- `enum` - Enum-based with metadata
- `dict` - Dictionary structure with helpers

## Supabase Setup

For production deployment, you'll need a Supabase project:

1. **Create Supabase Project**: Go to https://supabase.com and create a new project
2. **Run Database Schema**: Execute the SQL schema (see CLAUDE.md for full schema)
3. **Get Credentials**: Copy your project URL and API keys
4. **Set Environment Variables**: Add to Vercel or your .env file

The system automatically detects Supabase configuration and switches from file-based storage to database persistence.

## Architecture

Built with the KHAOS-Coder philosophy:
- **Simple**: No over-engineering, just effective solutions
- **Tested**: TDD approach with comprehensive coverage
- **Reliable**: Error handling and graceful degradation
- **Extensible**: Easy to add new data sources
- **Scalable**: Supabase backend handles production loads

## Deployment

Deploy to Vercel with automatic cron scheduling:

```bash
npm run deploy
```

Set environment variables in Vercel dashboard.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests first (TDD)
4. Implement functionality
5. Submit pull request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details.

## License

Built by the KHAOS Fellowship - All rights reserved