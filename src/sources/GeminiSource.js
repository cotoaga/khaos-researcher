import fetch from 'node-fetch';
import { Logger } from '../utils/Logger.js';

export class GeminiSource {
  constructor() {
    this.name = 'Google';
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.logger = new Logger('GeminiSource');
  }

  async fetchModels() {
    if (!this.apiKey) {
      this.logger.warn('No Google AI API key provided, using known models');
      return this.getKnownModels();
    }

    try {
      const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`, {
        headers: {
          'User-Agent': 'KHAOS-Researcher/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Google AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const models = (data.models || []).map(model => ({
        provider: 'Google',
        id: model.name.replace('models/', ''), // Remove "models/" prefix
        created: this.parseCreateTime(model.createTime),
        capabilities: this.inferCapabilities(model.name, model.supportedGenerationMethods),
        metadata: {
          displayName: model.displayName,
          description: model.description,
          version: model.version,
          inputTokenLimit: model.inputTokenLimit,
          outputTokenLimit: model.outputTokenLimit,
          supportedGenerationMethods: model.supportedGenerationMethods
        }
      }));

      this.logger.info(`📡 Fetched ${models.length} models from Google AI`);
      return models;
    } catch (error) {
      this.logger.error('Failed to fetch Google AI models, using fallback:', error);
      return this.getKnownModels();
    }
  }

  getKnownModels() {
    // Fallback known models if API fails
    return [
      {
        provider: 'Google',
        id: 'gemini-1.5-pro',
        created: Date.now(),
        capabilities: ['reasoning', 'code', 'vision', 'analysis'],
        metadata: {
          displayName: 'Gemini 1.5 Pro',
          family: 'gemini-1.5',
          tier: 'pro'
        }
      },
      {
        provider: 'Google',
        id: 'gemini-1.5-flash',
        created: Date.now(),
        capabilities: ['reasoning', 'code', 'fast-response'],
        metadata: {
          displayName: 'Gemini 1.5 Flash',
          family: 'gemini-1.5',
          tier: 'flash'
        }
      },
      {
        provider: 'Google',
        id: 'gemini-2.0-flash-exp',
        created: Date.now(),
        capabilities: ['reasoning', 'code', 'vision', 'audio'],
        metadata: {
          displayName: 'Gemini 2.0 Flash (Experimental)',
          family: 'gemini-2.0',
          tier: 'flash-exp'
        }
      }
    ];
  }

  parseCreateTime(createTime) {
    if (!createTime) return Date.now();
    return new Date(createTime).getTime();
  }

  inferCapabilities(modelName, methods = []) {
    const capabilities = [];
    const name = modelName.toLowerCase();
    
    // All Gemini models have reasoning
    capabilities.push('reasoning');
    
    if (name.includes('pro')) {
      capabilities.push('code', 'vision', 'analysis');
    }
    
    if (name.includes('flash')) {
      capabilities.push('code', 'fast-response');
    }
    
    if (name.includes('2.0') || name.includes('vision')) {
      capabilities.push('vision');
    }
    
    if (methods.includes('generateContent')) {
      capabilities.push('text-generation');
    }
    
    if (methods.includes('generateAnswer')) {
      capabilities.push('qa');
    }
    
    return [...new Set(capabilities)];
  }
}