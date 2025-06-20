# 🗡️ KHAOS-Researcher

> AI Model Intelligence Agent for the KHAOS Fellowship

A simple, reliable AI agent that monitors the rapidly evolving AI model landscape and keeps your knowledge current. Built with KHAOS-Coder principles: test-driven, pragmatic, and effective.

## Quick Start

```bash
# Clone and setup
git clone https://github.com/cotoaga/khaos-researcher.git
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
```

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

MIT License - Built by the KHAOS Fellowship