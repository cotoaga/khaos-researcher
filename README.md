# 🗡️ KHAOS-Researcher v1.0

> AI Model Intelligence Agent for the KHAOS Fellowship

A comprehensive AI model intelligence platform that monitors the rapidly evolving AI landscape and provides real-time insights with professional tag-style capability visualization. Built with KHAOS-Coder principles: simple, tested, and effective.

**✅ v1.0 Release: Professional Dashboard with Tag-Style Capabilities and Complete Intelligence System!**

## 🚀 Live Deployment Status

**Production URL**: https://khaos-researcher.vercel.app

**API Endpoints**:
- **Research API**: `GET/POST /api/research` - Trigger model discovery
- **Data API**: `GET /api/data` - Get current model database  
- **Generate API**: `GET /api/generate` - Generate client SDK code
- **Dashboard**: `/` - Interactive web interface with progress tracking

**Current Status**: ✅ **v1.0 Production Release**
- **Dashboard**: Professional web interface with tag-style capability visualization
- **Architecture**: Single HuggingFace Universal Source (simplified from 5 sources)
- **Database**: Supabase-only (no file fallbacks)
- **Models**: 165+ curated high-quality models from major providers
- **Ecosystem**: 1.8M+ total AI models tracked with real-time metrics
- **Capabilities**: Color-coded tag system with legend for easy identification
- **Dates**: Enhanced date intelligence with source indicators (📤📋🏢)
- **UX**: Chaos Star logo, progress tracking, and professional styling

**Intelligence**: Curated enterprise-grade models + ecosystem-wide metrics + visual capability intelligence

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
1. **Scrapes** ecosystem metrics from HuggingFace (1.8M+ total models)
2. **Curates** high-quality models from major providers (OpenAI, Anthropic, Google, Meta, etc.)
3. **Analyzes** changes and new model releases with intelligent date handling
4. **Saves** everything to Supabase with enhanced metadata and date sources
5. **Provides** both ecosystem intelligence and curated enterprise models
6. **Schedules** automatic updates every 6 hours with progress tracking

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

### 🎨 **v1.0 Dashboard Features**
- 🗡️ **Chaos Star Logo**: Animated 8-pointed star representing infinite dimensional AI possibilities
- 🏷️ **Tag-Style Capabilities**: Color-coded capability tags with professional styling
- 📖 **Capability Legend**: Visual guide explaining each capability type and color
- 🎯 **Enhanced UX**: Professional model cards with structured layouts
- 🔍 **Smart Filtering**: Search and filter by providers, capabilities, and model names

### 🧠 **Intelligence System**
- 🌊 **Universal Source**: Single HuggingFace-powered intelligence system
- 📊 **Ecosystem Intelligence**: 1.8M+ total AI models tracked with real-time metrics
- 🎯 **Smart Curation**: Quality-filtered models from 10+ major providers
- 📅 **Enhanced Date Intelligence**: Multi-tier date sources (📤📋🏢) with accuracy indicators
- 🚀 **Progress Tracking**: Real-time research progress with visual feedback

### 🏗️ **Architecture**
- 🗄️ **Supabase-Only**: Production-ready PostgreSQL with no file fallbacks
- 🔄 **Automated Updates**: Cron-based research cycles every 6 hours
- 🧪 **Test Driven**: Comprehensive test coverage with TDD approach
- 📡 **Clean Architecture**: Simplified from 5 sources to 1 comprehensive system
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
- **Simple**: Single HuggingFace Universal Source replaces complex multi-source system
- **Tested**: TDD approach with comprehensive coverage
- **Reliable**: Enhanced date intelligence with 3-tier fallback system
- **Intelligent**: Ecosystem-wide metrics + curated enterprise models
- **Scalable**: Supabase-only architecture handles production loads
- **Transparent**: Date source indicators (📤📋🏢) show data quality

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