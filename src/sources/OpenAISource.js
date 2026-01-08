import fetch from 'node-fetch';
import { Logger } from '../utils/Logger.js';

export class OpenAISource {
  constructor() {
    this.name = 'OpenAI';
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
    this.logger = new Logger('OpenAISource');
  }

  // Known model metadata for enrichment
  getKnownModelMetadata() {
    return {
      'gpt-4o': {
        display_name: 'GPT-4o',
        family: 'gpt-4o',
        tier: 'flagship',
        release_date: '2024-05-13',
        context_window: 128000,
        capabilities: ['reasoning', 'code', 'vision', 'analysis', 'multimodal']
      },
      'gpt-4o-mini': {
        display_name: 'GPT-4o Mini',
        family: 'gpt-4o',
        tier: 'mini',
        release_date: '2024-07-18',
        context_window: 128000,
        capabilities: ['reasoning', 'code', 'vision', 'fast-response', 'cost-effective']
      },
      'o1-preview': {
        display_name: 'o1 Preview',
        family: 'o1',
        tier: 'preview',
        release_date: '2024-09-12',
        context_window: 128000,
        capabilities: ['reasoning', 'code', 'complex-reasoning', 'advanced-reasoning', 'problem-solving']
      },
      'o1-mini': {
        display_name: 'o1 Mini',
        family: 'o1',
        tier: 'mini',
        release_date: '2024-09-12',
        context_window: 128000,
        capabilities: ['reasoning', 'code', 'fast-reasoning', 'cost-effective']
      },
      'gpt-4-turbo': {
        display_name: 'GPT-4 Turbo',
        family: 'gpt-4',
        tier: 'turbo',
        release_date: '2024-04-09',
        context_window: 128000,
        capabilities: ['reasoning', 'code', 'vision', 'analysis']
      },
      'gpt-4': {
        display_name: 'GPT-4',
        family: 'gpt-4',
        tier: 'standard',
        release_date: '2023-03-14',
        context_window: 8192,
        capabilities: ['reasoning', 'code', 'analysis']
      },
      'gpt-3.5-turbo': {
        display_name: 'GPT-3.5 Turbo',
        family: 'gpt-3.5',
        tier: 'turbo',
        release_date: '2023-03-01',
        context_window: 16385,
        capabilities: ['reasoning', 'code', 'fast-response', 'cost-effective']
      },
      'dall-e-3': {
        display_name: 'DALL-E 3',
        family: 'dall-e',
        tier: 'standard',
        release_date: '2023-10-01',
        capabilities: ['image-generation', 'creative', 'high-quality']
      },
      'dall-e-2': {
        display_name: 'DALL-E 2',
        family: 'dall-e',
        tier: 'standard',
        release_date: '2022-04-06',
        capabilities: ['image-generation', 'creative']
      },
      'whisper-1': {
        display_name: 'Whisper',
        family: 'whisper',
        tier: 'standard',
        release_date: '2022-09-21',
        capabilities: ['audio', 'transcription', 'speech-to-text']
      },
      'tts-1': {
        display_name: 'TTS',
        family: 'tts',
        tier: 'standard',
        release_date: '2023-11-06',
        capabilities: ['audio', 'text-to-speech', 'voice']
      },
      'text-embedding-3-large': {
        display_name: 'Text Embedding 3 Large',
        family: 'embeddings',
        tier: 'large',
        release_date: '2024-01-25',
        capabilities: ['embeddings', 'semantic-search', 'high-dimension']
      },
      'text-embedding-3-small': {
        display_name: 'Text Embedding 3 Small',
        family: 'embeddings',
        tier: 'small',
        release_date: '2024-01-25',
        capabilities: ['embeddings', 'semantic-search', 'cost-effective']
      }
    };
  }

  async fetchModels() {
    if (!this.apiKey) {
      this.logger.warn('No OpenAI API key provided, using fallback curated list');
      return this.getFallbackModels();
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'KHAOS-Researcher/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const knownMetadata = this.getKnownModelMetadata();

      // Filter to main models only (not fine-tunes or legacy)
      const mainModels = data.data
        .filter(model => {
          const id = model.id;
          // Include GPT models, o1 models, DALL-E, Whisper, TTS, embeddings
          return (
            id.startsWith('gpt-') ||
            id.startsWith('o1-') ||
            id.startsWith('dall-e-') ||
            id.startsWith('whisper-') ||
            id.startsWith('tts-') ||
            id.includes('embedding')
          ) && !id.includes(':') && !id.includes('instruct'); // Exclude fine-tunes and legacy
        })
        .map(model => {
          const metadata = knownMetadata[model.id] || {};
          return {
            provider: 'OpenAI',
            id: model.id,
            created: model.created,
            capabilities: metadata.capabilities || this.inferCapabilities(model.id),
            metadata: {
              owned_by: model.owned_by,
              object: model.object,
              display_name: metadata.display_name || model.id,
              family: metadata.family,
              tier: metadata.tier,
              release_date: metadata.release_date,
              context_window: metadata.context_window,
              official: true,
              api_model_name: model.id
            }
          };
        });

      this.logger.info(`📡 Fetched ${mainModels.length} models from OpenAI API`);
      return mainModels;
    } catch (error) {
      this.logger.error('Failed to fetch OpenAI models, using fallback:', error);
      return this.getFallbackModels();
    }
  }

  getFallbackModels() {
    // Fallback curated list if API fails
    const knownMetadata = this.getKnownModelMetadata();

    return Object.entries(knownMetadata).map(([id, meta]) => ({
      provider: 'OpenAI',
      id: id,
      created: Math.floor(new Date(meta.release_date).getTime() / 1000),
      capabilities: meta.capabilities,
      metadata: {
        ...meta,
        official: true,
        api_model_name: id
      }
    }));
  }

  inferCapabilities(modelId) {
    const capabilities = [];
    const id = modelId.toLowerCase();

    if (id.includes('gpt-4') || id.includes('gpt-3.5')) {
      capabilities.push('reasoning', 'text-generation');
    }

    if (id.includes('o1')) {
      capabilities.push('reasoning', 'code', 'advanced-reasoning', 'problem-solving');
    }

    if (id.includes('code') || id.includes('davinci-codex')) {
      capabilities.push('code');
    }

    if (id.includes('vision') || id.includes('gpt-4') || id.includes('4o')) {
      capabilities.push('vision');
    }

    if (id.includes('whisper')) {
      capabilities.push('audio', 'transcription', 'speech-to-text');
    }

    if (id.includes('tts')) {
      capabilities.push('audio', 'text-to-speech', 'voice');
    }

    if (id.includes('dall-e') || id.includes('dalle')) {
      capabilities.push('image-generation', 'creative');
    }

    if (id.includes('embedding')) {
      capabilities.push('embeddings', 'semantic-search');
    }

    return capabilities.length > 0 ? capabilities : ['general'];
  }
}
