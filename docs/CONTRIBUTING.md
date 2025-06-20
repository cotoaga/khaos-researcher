# Contributing Guide

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/khaos-researcher.git
   cd khaos-researcher
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy environment template:
   ```bash
   cp .env.example .env
   ```
5. Add your API keys to `.env`

## Development Workflow

### Test-Driven Development

We follow TDD principles:

1. **Write tests first**
2. **Run tests** (they should fail)
3. **Write minimal code** to make tests pass
4. **Refactor** while keeping tests green

```bash
# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Style

- Use ESLint for code quality
- Follow existing naming conventions
- Write clear, descriptive commit messages
- Add JSDoc comments for public APIs

### Adding New Data Sources

1. Create a new file in `src/sources/`
2. Implement the `fetchModels()` method
3. Add tests in `tests/unit/sources/`
4. Update the main KHAOSResearcher class
5. Add documentation

Example:
```javascript
// src/sources/NewSource.js
export class NewSource {
  constructor() {
    this.name = 'NewSource';
  }

  async fetchModels() {
    // Implementation
    return models;
  }
}
```

### Adding New Integrations

1. Create a new file in `src/integrations/`
2. Implement webhook/API methods
3. Add tests
4. Update configuration

## Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following TDD

3. Ensure all tests pass:
   ```bash
   npm test
   ```

4. Commit your changes:
   ```bash
   git commit -m "feat: add new data source for XYZ"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request with:
   - Clear description of changes
   - Link to related issues
   - Screenshots if applicable

## Code Review Guidelines

- Focus on code quality and maintainability
- Ensure adequate test coverage
- Check for security vulnerabilities
- Verify documentation is updated

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a release tag
4. Deploy to production

## Getting Help

- Create an issue for bugs or feature requests
- Use discussions for questions
- Join our Discord for real-time chat

## License

By contributing, you agree that your contributions will be owned by the KHAOS Fellowship.