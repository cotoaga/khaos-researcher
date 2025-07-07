import fetch from 'node-fetch';
import { Logger } from '../utils/Logger.js';

export class MistralSource {
  constructor() {
    this.name = 'Mistral';
    this.apiKey = process.env.MISTRAL_API_KEY;
    this.baseUrl = 'https://api.mistral.ai/v1';
    this.logger = new Logger('MistralSource');
  }

  async fetchModels() {
    if (!this.apiKey) {
      this.logger.warn('No Mistral API key provided, using known models');
      return this.getKnownModels();
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'KHAOS-Researcher/1.0',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const models = (data.data || []).map(model => ({
        provider: 'Mistral',
        id: model.id,
        created: model.created ? model.created * 1000 : Date.now(), // Convert to milliseconds
        capabilities: this.inferCapabilities(model.id),
        metadata: {
          object: model.object,
          owned_by: model.owned_by,
          description: model.description,
          max_context_length: model.max_context_length,
          aliases: model.aliases
        }
      }));

      this.logger.info(`📡 Fetched ${models.length} models from Mistral AI`);
      return models;
    } catch (error) {
      this.logger.error('Failed to fetch Mistral models, using fallback:', error);
      return this.getKnownModels();
    }
  }

  getKnownModels() {
    // Fallback known models if API fails
    return [
      {
        provider: 'Mistral',
        id: 'mistral-large-latest',
        created: Date.now(),
        capabilities: ['reasoning', 'code', 'analysis', 'multilingual'],
        metadata: {
          family: 'mistral-large',
          tier: 'flagship',
          region: 'EU'
        }
      },
      {
        provider: 'Mistral',
        id: 'mistral-medium-latest',
        created: Date.now(),
        capabilities: ['reasoning', 'code', 'multilingual'],
        metadata: {
          family: 'mistral-medium',
          tier: 'balanced',
          region: 'EU'
        }
      },
      {
        provider: 'Mistral',
        id: 'mistral-small-latest',
        created: Date.now(),
        capabilities: ['reasoning', 'fast-response', 'multilingual'],
        metadata: {
          family: 'mistral-small',
          tier: 'efficient',
          region: 'EU'
        }
      },
      {
        provider: 'Mistral',
        id: 'pixtral-12b-2409',
        created: Date.now(),
        capabilities: ['reasoning', 'vision', 'multilingual'],
        metadata: {
          family: 'pixtral',
          tier: 'multimodal',
          region: 'EU'
        }
      }
    ];
  }

  inferCapabilities(modelId) {
    const capabilities = ['reasoning'];
    const id = modelId.toLowerCase();
    
    // Language capabilities
    capabilities.push('multilingual');
    
    if (id.includes('large') || id.includes('medium')) {
      capabilities.push('code', 'analysis');
    }
    
    if (id.includes('small') || id.includes('7b')) {
      capabilities.push('fast-response');
    }
    
    if (id.includes('pixtral') || id.includes('vision')) {
      capabilities.push('vision');
    }
    
    if (id.includes('codestral')) {
      capabilities.push('code', 'programming');
    }
    
    if (id.includes('embed')) {
      capabilities.push('embeddings');
    }
    
    return capabilities;
  }
}