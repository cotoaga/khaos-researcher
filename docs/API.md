# API Documentation

## Endpoints

### GET /api/research

Triggers a research cycle and returns discoveries.

**Response:**
```json
{
  "success": true,
  "discoveries": 3,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": [
    {
      "type": "new_model",
      "model": {
        "provider": "OpenAI",
        "id": "gpt-4-turbo",
        "created": 1677610602,
        "capabilities": ["reasoning", "code", "vision"],
        "metadata": {
          "owned_by": "openai"
        }
      },
      "significance": 85,
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/webhook

Receives webhook notifications.

**Request Body:**
```json
{
  "type": "discovery",
  "data": [...],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook received successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## CLI Commands

```bash
# Run single research cycle
npm run research

# Start continuous monitoring
npm run monitor

# Run tests
npm test

# Deploy to Vercel  
npm run deploy
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `ANTHROPIC_API_KEY` | Anthropic API key | Optional |
| `DISCORD_WEBHOOK_URL` | Discord webhook for notifications | Optional |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | Optional |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | Optional |
| `RESEARCH_INTERVAL` | Research cycle interval in ms | Optional |