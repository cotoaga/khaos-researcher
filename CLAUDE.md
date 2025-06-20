# 🗡️ KHAOS-Researcher Birth Instructions
**AI Model Intelligence Agent - Complete Setup Guide**

*For Claude Code execution in the KHAOS fellowship development environment*

---

## 🎯 Project Overview

**KHAOS-Researcher** is your first AI Agent companion - a simple, reliable intelligence system that monitors the rapidly evolving AI model landscape and keeps your knowledge current. Built with KHAOS-Coder principles: simple, tested, and effective.

### What This Agent Does
- **Monitors** AI model releases from major providers (OpenAI, Anthropic, Google, etc.)
- **Tracks** capability changes and new model announcements
- **Maintains** a living JSON database of current AI models
- **Connects** with your existing KHAOS ecosystem via webhooks and APIs
- **Deploys** as a simple Vercel function with cron scheduling

---

## 📁 Repository Structure

```
khaos-researcher/
├── README.md                    # Project documentation
├── package.json                 # Dependencies and scripts
├── .gitignore                   # Ignore patterns
├── .env.example                 # Environment template
├── vercel.json                  # Deployment configuration
├── src/
│   ├── index.js                 # Main agent logic
│   ├── models/
│   │   ├── ModelDatabase.js     # Data management
│   │   └── ModelAnalyzer.js     # Intelligence layer
│   ├── sources/
│   │   ├── OpenAISource.js      # OpenAI API integration
│   │   ├── AnthropicSource.js   # Anthropic documentation scraper
│   │   ├── GoogleSource.js      # Google AI platform monitor
│   │   └── HuggingFaceSource.js # HF model hub integration
│   ├── integrations/
│   │   ├── DiscordWebhook.js    # Discord notifications
│   │   ├── SlackWebhook.js      # Slack integration
│   │   └── DAGGERConnector.js   # DAGGER knowledge graph
│   └── utils/
│       ├── Logger.js            # Structured logging
│       └── Scheduler.js         # Cron job management
├── api/
│   ├── research.js              # Vercel function endpoint
│   └── webhook.js               # Webhook receiver
├── tests/
│   ├── unit/
│   │   ├── ModelDatabase.test.js
│   │   ├── ModelAnalyzer.test.js
│   │   └── sources/
│   │       ├── OpenAISource.test.js
│   │       └── AnthropicSource.test.js
│   ├── integration/
│   │   └── end-to-end.test.js
│   └── fixtures/
│       └── sample-responses.json
├── data/
│   ├── ai_models.json           # Current model database
│   └── schemas/
│       └── model-schema.json    # Data validation schema
└── docs/
    ├── API.md                   # API documentation
    ├── DEPLOYMENT.md            # Deployment guide
    └── CONTRIBUTING.md          # Development guide
```

---

## 🛠️ Step-by-Step Setup Instructions

### Phase 1: Repository Creation & Basic Structure

**Execute in terminal:**

```bash
# Navigate to development directory (IMPORTANT: Not in iCloud sync!)
cd ~/Development

# Create new repository
mkdir khaos-researcher
cd khaos-researcher

# Initialize Git
git init
git branch -M main

# Create GitHub repository (using GitHub CLI if available)
gh repo create khaos-researcher --public --description "AI Model Intelligence Agent for KHAOS Fellowship"

# If no GitHub CLI, create manually at github.com and add remote:
# git remote add origin https://github.com/[your-username]/khaos-researcher.git
```

### Phase 2: Project Foundation

**Create package.json:**

```bash
# Initialize Node.js project
npm init -y

# Edit package.json to add:
```

```json
{
  "name": "khaos-researcher",
  "version": "1.0.0",
  "description": "AI Model Intelligence Agent for KHAOS Fellowship",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "dev": "node src/index.js",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "research": "node src/index.js --run",
    "monitor": "node src/index.js --monitor",
    "build": "echo 'No build step needed for Node.js'",
    "deploy": "vercel --prod"
  },
  "keywords": ["ai", "models", "research", "agent", "khaos"],
  "author": "KHAOS Fellowship",
  "license": "MIT",
  "dependencies": {
    "node-fetch": "^3.3.2",
    "cheerio": "^1.0.0-rc.12",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "vitest": "^3.2.3",
    "@types/node": "^20.10.5",
    "eslint": "^9.25.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Install dependencies:**

```bash
npm install
```

### Phase 3: Core Files Creation

**Create .gitignore:**

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# Coverage reports
coverage/
.nyc_output

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Optional caches
.npm
.eslintcache

# Output
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Project specific
data/backup/
exports/
*.backup

# API keys and sensitive data
api-keys.txt
secrets.json
```

**Create .env.example:**

```env
# API Keys (copy to .env and fill in real values)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
HUGGINGFACE_API_KEY=hf_...

# Webhook URLs
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# DAGGER Integration
DAGGER_API_URL=http://localhost:5173/api
DAGGER_API_KEY=optional

# Configuration
LOG_LEVEL=info
RESEARCH_INTERVAL=21600000
MAX_RETRIES=3
```

**Create vercel.json:**

```json
{
  "functions": {
    "api/research.js": {
      "runtime": "nodejs18.x",
      "maxDuration": 30
    },
    "api/webhook.js": {
      "runtime": "nodejs18.x",
      "maxDuration": 10
    }
  },
  "crons": [
    {
      "path": "/api/research",
      "schedule": "0 */6 * * *"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Phase 4: Core Application Structure

**Create src/index.js (Main Agent Logic):**

```javascript
#!/usr/bin/env node

/**
 * KHAOS-Researcher v1.0
 * AI Model Intelligence Agent
 * 
 * Built with KHAOS-Coder principles:
 * - Simple and focused
 * - Test-driven development
 * - Pragmatic architecture
 */

import { ModelDatabase } from './models/ModelDatabase.js';
import { ModelAnalyzer } from './models/ModelAnalyzer.js';
import { OpenAISource } from './sources/OpenAISource.js';
import { AnthropicSource } from './sources/AnthropicSource.js';
import { Logger } from './utils/Logger.js';
import { Scheduler } from './utils/Scheduler.js';

class KHAOSResearcher {
  constructor() {
    this.logger = new Logger('KHAOSResearcher');
    this.database = new ModelDatabase();
    this.analyzer = new ModelAnalyzer();
    this.sources = [
      new OpenAISource(),
      new AnthropicSource()
    ];
    this.scheduler = new Scheduler();
  }

  async initialize() {
    this.logger.info('🚀 KHAOS-Researcher initializing...');
    await this.database.load();
    this.logger.info('✅ Initialization complete');
  }

  async runResearchCycle() {
    this.logger.info('🔍 Starting research cycle...');
    
    const discoveries = [];
    
    for (const source of this.sources) {
      try {
        const models = await source.fetchModels();
        const newDiscoveries = await this.analyzer.analyzeNewModels(models);
        discoveries.push(...newDiscoveries);
        
        await this.database.updateModels(models);
      } catch (error) {
        this.logger.error(`Source ${source.name} failed:`, error);
      }
    }

    await this.database.save();
    
    if (discoveries.length > 0) {
      await this.notifyDiscoveries(discoveries);
    }

    this.logger.info(`✅ Research cycle complete. Found ${discoveries.length} new discoveries.`);
    return discoveries;
  }

  async notifyDiscoveries(discoveries) {
    // Implement webhook notifications here
    this.logger.info(`📢 Notifying about ${discoveries.length} discoveries`);
  }

  async startMonitoring() {
    this.logger.info('🔄 Starting continuous monitoring...');
    
    await this.initialize();
    
    // Run immediate cycle
    await this.runResearchCycle();
    
    // Schedule regular cycles
    this.scheduler.start(() => this.runResearchCycle());
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const researcher = new KHAOSResearcher();
  
  if (process.argv.includes('--monitor')) {
    researcher.startMonitoring();
  } else if (process.argv.includes('--run')) {
    researcher.initialize()
      .then(() => researcher.runResearchCycle())
      .then(discoveries => {
        console.log(`\n📊 Research complete: ${discoveries.length} discoveries`);
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  } else {
    console.log(`
🗡️ KHAOS-Researcher v1.0

Usage:
  npm run research     # Run single research cycle
  npm run monitor      # Start continuous monitoring
  npm run dev          # Same as monitor
  npm test             # Run test suite
    `);
  }
}

export { KHAOSResearcher };
```

### Phase 5: Model Data Management

**Create src/models/ModelDatabase.js:**

```javascript
import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/Logger.js';

export class ModelDatabase {
  constructor(filePath = 'data/ai_models.json') {
    this.filePath = filePath;
    this.models = new Map();
    this.metadata = {
      lastUpdate: null,
      version: '1.0.0',
      totalModels: 0
    };
    this.logger = new Logger('ModelDatabase');
  }

  async load() {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      
      const data = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.models = new Map(Object.entries(parsed.models || {}));
      this.metadata = { ...this.metadata, ...parsed.metadata };
      
      this.logger.info(`📂 Loaded ${this.models.size} models from ${this.filePath}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.info('📄 No existing database found, starting fresh');
      } else {
        this.logger.error('Failed to load database:', error);
        throw error;
      }
    }
  }

  async save() {
    const data = {
      metadata: {
        ...this.metadata,
        lastUpdate: new Date().toISOString(),
        totalModels: this.models.size
      },
      models: Object.fromEntries(this.models)
    };

    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    this.logger.info(`💾 Saved ${this.models.size} models to ${this.filePath}`);
  }

  async updateModels(newModels) {
    let updatedCount = 0;
    
    for (const model of newModels) {
      const key = `${model.provider}-${model.id}`;
      const existing = this.models.get(key);
      
      if (!existing || this.hasModelChanged(existing, model)) {
        this.models.set(key, {
          ...model,
          lastUpdated: new Date().toISOString()
        });
        updatedCount++;
      }
    }

    this.logger.info(`🔄 Updated ${updatedCount} models`);
    return updatedCount;
  }

  hasModelChanged(existing, newModel) {
    // Simple comparison - can be enhanced
    return (
      existing.created !== newModel.created ||
      JSON.stringify(existing.capabilities) !== JSON.stringify(newModel.capabilities)
    );
  }

  getModelsByProvider(provider) {
    return Array.from(this.models.values())
      .filter(model => model.provider === provider);
  }

  getAllModels() {
    return Array.from(this.models.values());
  }

  getStats() {
    const stats = {};
    for (const model of this.models.values()) {
      stats[model.provider] = (stats[model.provider] || 0) + 1;
    }
    return {
      total: this.models.size,
      byProvider: stats,
      lastUpdate: this.metadata.lastUpdate
    };
  }
}
```

### Phase 6: Testing Foundation

**Create tests/unit/ModelDatabase.test.js:**

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ModelDatabase } from '../../src/models/ModelDatabase.js';
import fs from 'fs/promises';

describe('ModelDatabase', () => {
  let db;
  const testFilePath = 'test-data/models.json';

  beforeEach(async () => {
    db = new ModelDatabase(testFilePath);
    
    // Clean up any existing test file
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // File doesn't exist, that's fine
    }
  });

  afterEach(async () => {
    // Clean up test file
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // File doesn't exist, that's fine
    }
  });

  it('should initialize with empty models', () => {
    expect(db.models.size).toBe(0);
    expect(db.metadata.totalModels).toBe(0);
  });

  it('should save and load models correctly', async () => {
    const testModels = [
      {
        provider: 'OpenAI',
        id: 'gpt-4',
        capabilities: ['reasoning', 'code'],
        created: Date.now()
      }
    ];

    await db.updateModels(testModels);
    await db.save();

    const newDb = new ModelDatabase(testFilePath);
    await newDb.load();

    expect(newDb.models.size).toBe(1);
    expect(newDb.getModelsByProvider('OpenAI')).toHaveLength(1);
  });

  it('should detect model changes', () => {
    const existing = {
      provider: 'OpenAI',
      id: 'gpt-4',
      capabilities: ['reasoning'],
      created: 1000
    };

    const updated = {
      provider: 'OpenAI',
      id: 'gpt-4',
      capabilities: ['reasoning', 'code'],
      created: 1000
    };

    expect(db.hasModelChanged(existing, updated)).toBe(true);
    expect(db.hasModelChanged(existing, existing)).toBe(false);
  });
});
```

### Phase 7: Vercel API Endpoints

**Create api/research.js:**

```javascript
import { KHAOSResearcher } from '../src/index.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const researcher = new KHAOSResearcher();
    await researcher.initialize();
    
    const discoveries = await researcher.runResearchCycle();
    
    res.status(200).json({
      success: true,
      discoveries: discoveries.length,
      timestamp: new Date().toISOString(),
      data: discoveries
    });
  } catch (error) {
    console.error('Research cycle failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

### Phase 8: Documentation

**Create README.md:**

```markdown
# 🗡️ KHAOS-Researcher

> AI Model Intelligence Agent for the KHAOS Fellowship

A simple, reliable AI agent that monitors the rapidly evolving AI model landscape and keeps your knowledge current. Built with KHAOS-Coder principles: test-driven, pragmatic, and effective.

## Quick Start

\`\`\`bash
# Clone and setup
git clone https://github.com/[username]/khaos-researcher.git
cd khaos-researcher
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run research cycle
npm run research

# Start continuous monitoring
npm run monitor

# Run tests
npm test
\`\`\`

## Features

- 🔍 **Multi-Source Monitoring**: OpenAI, Anthropic, Google, HuggingFace
- 📊 **Intelligent Analysis**: Detects capability changes and new releases
- 🔄 **Continuous Updates**: Automated research cycles via cron
- 🚀 **Vercel Ready**: Deploy as serverless functions
- 🧪 **Test Driven**: Comprehensive test coverage
- 📡 **Webhook Integration**: Discord, Slack, DAGGER notifications

## Architecture

Built with the KHAOS-Coder philosophy:
- **Simple**: No over-engineering, just effective solutions
- **Tested**: TDD approach with comprehensive coverage
- **Reliable**: Error handling and graceful degradation
- **Extensible**: Easy to add new data sources

## Deployment

Deploy to Vercel with automatic cron scheduling:

\`\`\`bash
npm run deploy
\`\`\`

Set environment variables in Vercel dashboard.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests first (TDD)
4. Implement functionality
5. Submit pull request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details.

## License

MIT License - Built by the KHAOS Fellowship
```

---

## 🚀 Deployment Instructions

### Initial Setup

```bash
# Execute all above steps to create the repository structure
# Then push to GitHub:

git add .
git commit -m "🎉 Initial commit: KHAOS-Researcher birth"
git push -u origin main
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (first time will prompt for configuration)
vercel

# For production deployment
vercel --prod
```

### Environment Configuration

In Vercel dashboard, add these environment variables:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `DISCORD_WEBHOOK_URL` (optional)
- `SLACK_WEBHOOK_URL` (optional)

---

## 🧬 KHAOS Integration Points

1. **DAGGER Knowledge Graph**: Connect via `DAGGERConnector.js`
2. **Discord/Slack**: Real-time notifications of discoveries
3. **Data Export**: JSON format for integration with other tools
4. **API Endpoints**: RESTful interface for external consumption

---

## 🎯 Next Evolution Steps

1. **Phase 1**: Get basic monitoring working
2. **Phase 2**: Add webhook notifications
3. **Phase 3**: Integrate with DAGGER
4. **Phase 4**: Add intelligent model recommendations
5. **Phase 5**: Build web interface for visual monitoring

---

*Built with ❤️ by the KHAOS Fellowship*  
*"The spice must flow... and so must the knowledge."*