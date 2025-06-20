import fetch from 'node-fetch';
import { Logger } from '../utils/Logger.js';

export class OpenAISource {
  constructor() {
    this.name = 'OpenAI';
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
    this.logger = new Logger('OpenAISource');
  }

  async fetchModels() {
    if (!this.apiKey) {
      this.logger.warn('No OpenAI API key provided, skipping');
      return [];
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
      const models = data.data.map(model => ({
        provider: 'OpenAI',
        id: model.id,
        created: model.created,
        capabilities: this.inferCapabilities(model.id),
        metadata: {
          owned_by: model.owned_by,
          object: model.object
        }
      }));

      this.logger.info(`📡 Fetched ${models.length} models from OpenAI`);
      return models;
    } catch (error) {
      this.logger.error('Failed to fetch OpenAI models:', error);
      throw error;
    }
  }

  inferCapabilities(modelId) {
    const capabilities = [];
    const id = modelId.toLowerCase();
    
    if (id.includes('gpt-4') || id.includes('gpt-3.5')) {
      capabilities.push('reasoning', 'text-generation');
    }
    
    if (id.includes('code') || id.includes('davinci-codex')) {
      capabilities.push('code');
    }
    
    if (id.includes('vision') || id.includes('gpt-4v')) {
      capabilities.push('vision');
    }
    
    if (id.includes('whisper')) {
      capabilities.push('audio', 'transcription');
    }
    
    if (id.includes('dall-e') || id.includes('dalle')) {
      capabilities.push('image-generation');
    }
    
    return capabilities;
  }
}