# Deployment Guide

## Vercel Deployment

### Prerequisites

1. Vercel account
2. GitHub repository
3. Vercel CLI (optional)

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

### Step 4: Configure Environment Variables

In the Vercel dashboard, add these environment variables:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `DISCORD_WEBHOOK_URL` (optional)
- `SLACK_WEBHOOK_URL` (optional)
- `LOG_LEVEL=info`

### Step 5: Enable Cron Jobs

The `vercel.json` configuration automatically sets up cron jobs to run research cycles every 6 hours.

## Alternative Deployments

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway deploy
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "run", "monitor"]
```

```bash
docker build -t khaos-researcher .
docker run -d --env-file .env khaos-researcher
```

## Monitoring

### Health Check

Check the deployment health:

```bash
curl https://your-deployment.vercel.app/api/research
```

### Logs

View deployment logs in:
- Vercel Dashboard > Functions tab
- Railway Dashboard > Deployments
- Docker: `docker logs <container-id>`

## Troubleshooting

### Common Issues

1. **Missing API Keys**: Ensure all required environment variables are set
2. **Timeout Errors**: Increase function timeout in `vercel.json`
3. **Memory Issues**: Monitor memory usage and optimize if needed

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug vercel --prod
```