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
      this.logger.warn('No Google AI API key provided, using curated models');
      return this.getCuratedModels();
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
      const models = (data.models || [])
        .filter(model => {
          // Filter to main Gemini models only
          const name = model.name.toLowerCase();
          return name.includes('gemini') && !name.includes('embedding');
        })
        .map(model => {
          const modelId = model.name.replace('models/', '');
          const enrichedMetadata = this.enrichModelMetadata(modelId);

          return {
            provider: 'Google',
            id: modelId,
            created: this.parseCreateTime(model.createTime || enrichedMetadata.release_date),
            capabilities: this.inferCapabilities(modelId, model.supportedGenerationMethods),
            metadata: {
              displayName: model.displayName || enrichedMetadata.display_name,
              description: model.description,
              version: model.version,
              inputTokenLimit: model.inputTokenLimit,
              outputTokenLimit: model.outputTokenLimit,
              supportedGenerationMethods: model.supportedGenerationMethods,
              ...enrichedMetadata,
              official: true,
              api_model_name: modelId
            }
          };
        });

      this.logger.info(`📡 Fetched ${models.length} Gemini models from Google AI API`);
      return models;
    } catch (error) {
      this.logger.error('Failed to fetch Google AI models, using curated list:', error);
      return this.getCuratedModels();
    }
  }

  enrichModelMetadata(modelId) {
    const knownModels = {
      'gemini-2.0-flash-exp': {
        display_name: 'Gemini 2.0 Flash (Experimental)',
        family: 'gemini-2.0',
        tier: 'flash-exp',
        release_date: '2024-12-11',
        context_window: 1048576,
        experimental: true
      },
      'gemini-2.0-pro-exp': {
        display_name: 'Gemini 2.0 Pro (Experimental)',
        family: 'gemini-2.0',
        tier: 'pro-exp',
        release_date: '2024-12-11',
        context_window: 1048576,
        experimental: true
      },
      'gemini-1.5-pro': {
        display_name: 'Gemini 1.5 Pro',
        family: 'gemini-1.5',
        tier: 'pro',
        release_date: '2024-02-15',
        context_window: 2097152
      },
      'gemini-1.5-flash': {
        display_name: 'Gemini 1.5 Flash',
        family: 'gemini-1.5',
        tier: 'flash',
        release_date: '2024-05-14',
        context_window: 1048576
      },
      'gemini-1.5-flash-8b': {
        display_name: 'Gemini 1.5 Flash-8B',
        family: 'gemini-1.5',
        tier: 'flash-8b',
        release_date: '2024-10-03',
        context_window: 1048576
      },
      'gemini-1.0-pro': {
        display_name: 'Gemini 1.0 Pro',
        family: 'gemini-1.0',
        tier: 'pro',
        release_date: '2023-12-06',
        context_window: 32768
      }
    };

    // Try exact match first, then partial match
    if (knownModels[modelId]) {
      return knownModels[modelId];
    }

    // Partial match for versioned models (e.g., gemini-1.5-pro-001)
    for (const [knownId, metadata] of Object.entries(knownModels)) {
      if (modelId.startsWith(knownId)) {
        return metadata;
      }
    }

    return {
      display_name: modelId,
      family: 'gemini',
      tier: 'unknown'
    };
  }

  getCuratedModels() {
    // Curated list of official Gemini models
    return [
      {
        provider: 'Google',
        id: 'gemini-2.0-flash-exp',
        created: 1733875200, // December 11, 2024
        capabilities: ['reasoning', 'code', 'vision', 'audio', 'multimodal', 'extended-context'],
        metadata: {
          displayName: 'Gemini 2.0 Flash (Experimental)',
          family: 'gemini-2.0',
          tier: 'flash-exp',
          release_date: '2024-12-11',
          context_window: 1048576,
          experimental: true,
          official: true,
          api_model_name: 'gemini-2.0-flash-exp'
        }
      },
      {
        provider: 'Google',
        id: 'gemini-1.5-pro',
        created: 1708041600, // February 15, 2024
        capabilities: ['reasoning', 'code', 'vision', 'audio', 'analysis', 'extended-context'],
        metadata: {
          displayName: 'Gemini 1.5 Pro',
          family: 'gemini-1.5',
          tier: 'pro',
          release_date: '2024-02-15',
          context_window: 2097152,
          official: true,
          api_model_name: 'gemini-1.5-pro'
        }
      },
      {
        provider: 'Google',
        id: 'gemini-1.5-flash',
        created: 1715644800, // May 14, 2024
        capabilities: ['reasoning', 'code', 'vision', 'fast-response', 'extended-context'],
        metadata: {
          displayName: 'Gemini 1.5 Flash',
          family: 'gemini-1.5',
          tier: 'flash',
          release_date: '2024-05-14',
          context_window: 1048576,
          official: true,
          api_model_name: 'gemini-1.5-flash'
        }
      },
      {
        provider: 'Google',
        id: 'gemini-1.5-flash-8b',
        created: 1727913600, // October 3, 2024
        capabilities: ['reasoning', 'code', 'vision', 'fast-response', 'cost-effective'],
        metadata: {
          displayName: 'Gemini 1.5 Flash-8B',
          family: 'gemini-1.5',
          tier: 'flash-8b',
          release_date: '2024-10-03',
          context_window: 1048576,
          official: true,
          api_model_name: 'gemini-1.5-flash-8b'
        }
      },
      {
        provider: 'Google',
        id: 'gemini-1.0-pro',
        created: 1701820800, // December 6, 2023
        capabilities: ['reasoning', 'code', 'analysis'],
        metadata: {
          displayName: 'Gemini 1.0 Pro',
          family: 'gemini-1.0',
          tier: 'pro',
          release_date: '2023-12-06',
          context_window: 32768,
          official: true,
          api_model_name: 'gemini-1.0-pro'
        }
      }
    ];
  }

  parseCreateTime(createTime) {
    if (!createTime) return Math.floor(Date.now() / 1000);

    const date = new Date(createTime);
    if (isNaN(date.getTime())) {
      return Math.floor(Date.now() / 1000);
    }

    return Math.floor(date.getTime() / 1000);
  }

  inferCapabilities(modelName, methods = []) {
    const capabilities = [];
    const name = modelName.toLowerCase();

    // All Gemini models have reasoning
    capabilities.push('reasoning');

    if (name.includes('2.0')) {
      capabilities.push('code', 'vision', 'audio', 'multimodal', 'extended-context');
    } else if (name.includes('1.5')) {
      capabilities.push('code', 'vision', 'extended-context');
      if (name.includes('pro')) {
        capabilities.push('audio', 'analysis');
      }
    } else if (name.includes('1.0')) {
      capabilities.push('code', 'analysis');
    }

    if (name.includes('flash')) {
      capabilities.push('fast-response');
    }

    if (name.includes('8b')) {
      capabilities.push('cost-effective');
    }

    if (name.includes('pro') && !name.includes('8b')) {
      capabilities.push('complex-analysis');
    }

    if (methods && methods.includes('generateContent')) {
      capabilities.push('text-generation');
    }

    return [...new Set(capabilities)];
  }
}
