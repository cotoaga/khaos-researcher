# 🗡️ KHAOS-Researcher: Vercel Cloud Deployment
**From Local Pet to Production Beast**

---

## 🎯 Deployment Strategy

**Transform your local Node.js agent into a cloud-native intelligence platform:**

1. **API Functions** - Research cycles as serverless functions
2. **Cron Jobs** - Automated 6-hour intelligence gathering  
3. **Static Dashboard** - Your beautiful visualizer hosted globally
4. **Edge Storage** - Fast global access to intelligence data
5. **Webhook Endpoints** - Real-time notifications to Discord/Slack

---

## 📁 Required File Structure for Vercel

```
khaos-researcher/
├── api/                          # Serverless functions
│   ├── research.js              # Main research endpoint
│   ├── data.js                  # Serve model data
│   ├── webhook.js               # Receive notifications
│   └── dashboard.js             # Dashboard API
├── public/                      # Static files
│   ├── index.html              # Your beautiful dashboard
│   ├── style.css               # Extracted styles
│   └── dashboard.js            # Frontend JavaScript
├── src/                        # Shared logic (imported by API functions)
│   ├── models/
│   ├── sources/
│   ├── integrations/
│   └── utils/
├── vercel.json                 # Deployment configuration
├── package.json                # Dependencies
└── .env.example                # Environment template
```

---

## 🔧 Step 1: Restructure for Vercel

### Create `vercel.json` (Production-Ready)

```json
{
  "version": 2,
  "functions": {
    "api/research.js": {
      "runtime": "nodejs18.x",
      "maxDuration": 30,
      "memory": 1024
    },
    "api/data.js": {
      "runtime": "nodejs18.x", 
      "maxDuration": 10,
      "memory": 512
    },
    "api/webhook.js": {
      "runtime": "nodejs18.x",
      "maxDuration": 5,
      "memory": 256
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
  },
  "regions": ["fra1", "iad1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods", 
          "value": "GET, POST, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/",
      "destination": "/public/index.html"
    },
    {
      "source": "/dashboard",
      "destination": "/public/index.html"
    }
  ]
}
```

### Create `api/research.js` (Serverless Function)

```javascript
import { KHAOSResearcher } from '../src/index.js';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET and POST
  if (!['GET', 'POST'].includes(req.method)) {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('🚀 KHAOS-Researcher starting research cycle...');
    
    const researcher = new KHAOSResearcher();
    await researcher.initialize();
    
    const discoveries = await researcher.runResearchCycle();
    
    console.log(`✅ Research complete: ${discoveries.length} discoveries`);
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      discoveries: discoveries.length,
      data: discoveries,
      agent: 'KHAOS-Researcher v1.0',
      environment: 'Vercel Serverless',
      runtime: process.env.VERCEL_REGION || 'unknown'
    });
  } catch (error) {
    console.error('❌ Research cycle failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      agent: 'KHAOS-Researcher v1.0',
      environment: 'Vercel Serverless'
    });
  }
}
```

### Create `api/data.js` (Data Endpoint)

```javascript
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // In production, this would read from a database or external storage
    // For now, we'll serve the latest data from the research function
    
    const dataPath = path.join(process.cwd(), 'data', 'ai_models.json');
    let modelData;
    
    try {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      modelData = JSON.parse(rawData);
    } catch (error) {
      // If no data file exists, return empty structure
      modelData = {
        metadata: {
          lastUpdate: new Date().toISOString(),
          version: '1.0.0',
          totalModels: 0
        },
        models: {}
      };
    }

    res.status(200).json({
      success: true,
      data: modelData,
      timestamp: new Date().toISOString(),
      cached: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

### Create `api/webhook.js` (Notification Endpoint)

```javascript
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { discoveries, source } = req.body;
    
    console.log(`📢 Webhook received: ${discoveries?.length || 0} discoveries from ${source}`);
    
    // Here you would send to Discord, Slack, etc.
    if (process.env.DISCORD_WEBHOOK_URL && discoveries?.length > 0) {
      await sendDiscordNotification(discoveries);
    }
    
    res.status(200).json({
      success: true,
      message: 'Webhook processed',
      discoveries: discoveries?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function sendDiscordNotification(discoveries) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const message = {
    content: `🗡️ **KHAOS-Researcher Alert**`,
    embeds: [{
      title: `${discoveries.length} New AI Model${discoveries.length > 1 ? 's' : ''} Discovered!`,
      color: 0x4ECDC4,
      fields: discoveries.slice(0, 5).map(d => ({
        name: d.id,
        value: `Provider: ${d.provider}\nCapabilities: ${d.capabilities.join(', ') || 'Unknown'}`,
        inline: true
      })),
      timestamp: new Date().toISOString(),
      footer: {
        text: 'KHAOS-Researcher v1.0 | Vercel Cloud'
      }
    }]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      console.error('Discord webhook failed:', response.statusText);
    }
  } catch (error) {
    console.error('Discord webhook error:', error);
  }
}
```

---

## 🌐 Step 2: Update Dashboard for Cloud

### Create `public/index.html` (Cloud-Ready)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KHAOS AI Model Intelligence Dashboard</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="header">
        <h1>🗡️ KHAOS AI Model Intelligence Dashboard</h1>
        <div class="status-indicator">
            <span id="status-dot" class="status-dot online"></span>
            <span id="status-text">Cloud Agent Online</span>
        </div>
        <!-- Your existing stats HTML -->
    </div>

    <!-- Your existing dashboard HTML -->

    <script>
        // Cloud-ready dashboard JavaScript
        class CloudDashboard {
            constructor() {
                this.apiBase = window.location.origin;
                this.modelData = null;
                this.lastUpdate = null;
            }

            async loadData() {
                try {
                    const response = await fetch(`${this.apiBase}/api/data`);
                    const result = await response.json();
                    
                    if (result.success) {
                        this.modelData = result.data;
                        this.lastUpdate = new Date();
                        this.updateStatus('online', 'Cloud Agent Online');
                        return true;
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    console.error('Failed to load data:', error);
                    this.updateStatus('error', 'Connection Error');
                    return false;
                }
            }

            async triggerResearch() {
                try {
                    this.updateStatus('working', 'Research in Progress...');
                    
                    const response = await fetch(`${this.apiBase}/api/research`, {
                        method: 'POST'
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                        this.updateStatus('online', `Research Complete: ${result.discoveries} discoveries`);
                        await this.loadData(); // Refresh data
                        this.renderAll();
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    console.error('Research failed:', error);
                    this.updateStatus('error', 'Research Failed');
                }
            }

            updateStatus(status, text) {
                const dot = document.getElementById('status-dot');
                const statusText = document.getElementById('status-text');
                
                dot.className = `status-dot ${status}`;
                statusText.textContent = text;
            }

            async init() {
                const loaded = await this.loadData();
                if (loaded) {
                    this.renderAll();
                } else {
                    // Show empty state or error
                    this.showEmptyState();
                }

                // Set up auto-refresh every 5 minutes
                setInterval(() => {
                    this.loadData().then(loaded => {
                        if (loaded) this.renderAll();
                    });
                }, 5 * 60 * 1000);
            }

            renderAll() {
                if (!this.modelData) return;
                
                // Use your existing render functions, but with this.modelData
                currentModels = Object.values(this.modelData.models);
                renderProviderChart();
                renderTimelineChart();
                renderFullTimeline();
                renderModelGrid();
                updateStats();
            }

            showEmptyState() {
                document.getElementById('model-grid').innerHTML = `
                    <div class="empty-state">
                        <h3>🔄 Initializing KHAOS-Researcher...</h3>
                        <p>Triggering first research cycle...</p>
                        <button onclick="dashboard.triggerResearch()">Start Research</button>
                    </div>
                `;
            }
        }

        // Initialize cloud dashboard
        const dashboard = new CloudDashboard();
        dashboard.init();

        // Your existing dashboard functions...
    </script>
</body>
</html>
```

---

## 🚀 Step 3: Deploy to Vercel

### Quick Deployment

```bash
# Navigate to your project
cd khaos-researcher

# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time setup)
vercel

# Follow prompts:
# ? Set up and deploy "~/Development/khaos-researcher"? [Y/n] y
# ? Which scope do you want to deploy to? [Your Account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? khaos-researcher
# ? In which directory is your code located? ./

# Production deployment
vercel --prod
```

### Environment Variables (Set in Vercel Dashboard)

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
NODE_ENV=production
```

---

## 🎯 Step 4: Verify Cloud Operation

### Test Endpoints

```bash
# Test research endpoint
curl https://your-app.vercel.app/api/research

# Test data endpoint  
curl https://your-app.vercel.app/api/data

# Test webhook (from Discord/Slack)
curl -X POST https://your-app.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"discoveries": [], "source": "test"}'
```

### Monitor Functions

1. **Vercel Dashboard** → Functions tab
2. **Real-time logs** during cron execution
3. **Performance metrics** and error rates
4. **Analytics** on function invocations

---

## 🔄 Step 5: Continuous Intelligence

### Automatic Research Cycles

- **Every 6 hours**: `0 */6 * * *` cron schedule
- **Serverless execution**: No server maintenance
- **Global edge**: Fast response times
- **Auto-scaling**: Handles traffic spikes

### Real-time Notifications

```javascript
// Webhook integration example
async function notifyDiscoveries(discoveries) {
  if (discoveries.length === 0) return;
  
  // Send to your Vercel webhook
  await fetch('https://your-app.vercel.app/api/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      discoveries,
      source: 'KHAOS-Researcher',
      timestamp: new Date().toISOString()
    })
  });
}
```

---

## 🎊 Cloud Benefits Unlocked

✅ **24/7 Operation** - Never misses a model release  
✅ **Global Access** - Dashboard available worldwide  
✅ **Zero Maintenance** - Serverless infrastructure  
✅ **Automatic Scaling** - Handles any load  
✅ **Real-time Notifications** - Instant alerts  
✅ **Professional URLs** - Share with clients  
✅ **SSL/HTTPS** - Secure by default  
✅ **Edge Caching** - Lightning fast responses  

---

## 🗡️ KHAOS Achievement Unlocked

**"From Laptop Script to Global Intelligence Platform"**

Your simple Node.js research agent is now a **production-grade AI intelligence service** running in the cloud, monitoring the entire AI landscape 24/7, and delivering insights to your fellowship in real-time!

*The spice flows through the cloud...*