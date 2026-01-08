# 🏷️ Model Capabilities Classification System

## Overview

KHAOS-Researcher automatically classifies AI models by their capabilities using a standardized tagging system. This helps users quickly understand what each model can do.

## How Capabilities are Determined

### 1. **Official API Metadata** (Preferred)
When available, we use official metadata from provider APIs:

- **OpenAI**: Uses `supportedGenerationMethods` from `/v1/models` API
- **Google**: Uses `supportedGenerationMethods` from Gemini API
- **xAI**: Inferred from official model documentation

### 2. **Curated Model Lists** (Most Accurate)
For providers without public APIs:

- **Anthropic**: Manually curated based on official documentation
- Each model has capabilities explicitly defined in source code

### 3. **Inference Rules** (Fallback)
When API data is incomplete, we use model name patterns:

```javascript
// Example from GeminiSource.js
if (name.includes('2.0')) {
  capabilities.push('code', 'vision', 'audio', 'multimodal');
} else if (name.includes('1.5')) {
  capabilities.push('code', 'vision');
}

if (name.includes('flash')) {
  capabilities.push('fast-response');
}
```

## Standard Capability Tags

### Core Capabilities
- **`reasoning`** - General reasoning and problem-solving
- **`code`** - Code generation and understanding
- **`vision`** - Image understanding and analysis
- **`audio`** - Audio processing (speech, sound)
- **`analysis`** - Data analysis and insights

### Advanced Capabilities
- **`advanced-reasoning`** - Complex multi-step reasoning (o1, Claude Opus)
- **`extended-context`** - Large context windows (100K+ tokens)
- **`multimodal`** - Multiple modalities (text + image + audio)
- **`real-time`** - Real-time knowledge/search (Grok)

### Specialized Capabilities
- **`text-generation`** - Text completion and generation
- **`image-generation`** - Image creation (DALL-E, Imagen)
- **`text-to-speech`** - TTS/voice synthesis
- **`embeddings`** - Vector embeddings for semantic search
- **`semantic-search`** - Semantic similarity and search

### Performance Tags
- **`fast-response`** - Optimized for speed (Haiku, Flash, mini)
- **`cost-effective`** - Budget-friendly options
- **`high-quality`** - Premium quality output

### Community Tags (Ecosystem Only)
- **`community`** - Community-developed
- **`open-source`** - Open-source models
- **`democratized-ai`** - Publicly accessible

## Capability Sources by Provider

### Anthropic (Curated)
```javascript
// src/sources/AnthropicSource.js
{
  id: 'claude-sonnet-4-5-20250929',
  capabilities: [
    'reasoning',
    'code',
    'vision',
    'analysis',
    'advanced-reasoning',
    'extended-context'
  ]
}
```

**Source**: Official Anthropic documentation + testing

### OpenAI (API-driven)
```javascript
// src/sources/OpenAISource.js
inferCapabilities(modelId, modelData) {
  // Uses model.id patterns + API metadata
  if (id.startsWith('gpt-4o')) {
    return ['reasoning', 'code', 'vision', 'analysis', 'multimodal'];
  }
  if (id.includes('mini')) {
    return ['reasoning', 'code', 'vision', 'fast-response', 'cost-effective'];
  }
}
```

**Source**: OpenAI API + official documentation

### Google Gemini (API-driven with fallback)
```javascript
// src/sources/GeminiSource.js
inferCapabilities(modelName, methods = []) {
  // Uses API supportedGenerationMethods + model name patterns
  if (name.includes('2.0')) {
    capabilities.push('code', 'vision', 'audio', 'multimodal');
  }
}
```

**Source**: Google AI API + Gemini documentation

### xAI (Curated)
```javascript
// src/sources/XAISource.js
{
  id: 'grok-2',
  capabilities: [
    'reasoning',
    'code',
    'real-time',
    'analysis',
    'humor',
    'extended-context',
    'vision',
    'advanced-reasoning'
  ]
}
```

**Source**: xAI documentation + API inference

## Adding New Capabilities

To add a new capability tag:

1. **Choose a clear, descriptive name** (kebab-case)
2. **Add to relevant source files**:
   ```javascript
   capabilities: [..., 'new-capability']
   ```
3. **Document in this file**
4. **Add CSS styling** in `public/index.html` if needed:
   ```css
   .capability.new-capability {
     background: #color;
     color: #text-color;
   }
   ```

## Capability Colors (Dashboard)

Capabilities are color-coded in the dashboard:

- **Blue** - Core reasoning/text
- **Green** - Code/technical
- **Purple** - Vision/multimodal
- **Orange** - Advanced/premium
- **Yellow** - Performance (fast/cost)
- **Red** - Specialized (audio/image)

## Validation

Capabilities are validated during model updates:

1. **Consistency**: Same model always has same capabilities
2. **Accuracy**: Cross-referenced with official docs
3. **Freshness**: Updated when providers release new features

## Future Enhancements

- [ ] Automatic capability detection via model testing
- [ ] Capability confidence scores
- [ ] Capability version tracking (when features are added)
- [ ] Benchmark-based capability verification
