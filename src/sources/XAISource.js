import fetch from 'node-fetch';
import { Logger } from '../utils/Logger.js';

/**
 * XAISource - Official xAI (Grok) models
 *
 * xAI API is compatible with OpenAI API format
 * Base URL: https://api.x.ai/v1
 */
export class XAISource {
  constructor() {
    this.name = 'xAI';
    this.apiKey = process.env.XAI_API_KEY;
    this.baseUrl = 'https://api.x.ai/v1';
    this.logger = new Logger('XAISource');
  }

  async fetchModels() {
    if (!this.apiKey) {
      this.logger.warn('No xAI API key provided, using curated models');
      return this.getCuratedModels();
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`xAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Filter to main Grok models only
      const models = (data.data || [])
        .filter(model => {
          const id = model.id;
          // Include Grok models, exclude fine-tunes
          return id.startsWith('grok-') && !id.includes(':');
        })
        .map(model => ({
          provider: 'xAI',
          id: model.id,
          created: model.created || Math.floor(Date.now() / 1000),
          capabilities: this.inferCapabilities(model.id),
          metadata: {
            owned_by: model.owned_by || 'xai',
            family: 'grok',
            official: true,
            api_model_name: model.id
          }
        }));

      this.logger.info(`📡 Fetched ${models.length} Grok models from xAI API`);
      return models;
    } catch (error) {
      this.logger.error('Failed to fetch xAI models, using curated list:', error);
      return this.getCuratedModels();
    }
  }

  getCuratedModels() {
    // Curated list of official Grok models
    return [
      {
        provider: 'xAI',
        id: 'grok-beta',
        created: 1699315200, // November 7, 2023 (xAI announcement)
        capabilities: ['reasoning', 'code', 'real-time', 'analysis', 'humor'],
        metadata: {
          displayName: 'Grok Beta',
          family: 'grok',
          tier: 'beta',
          release_date: '2023-11-07',
          owned_by: 'xai',
          official: true,
          api_model_name: 'grok-beta',
          description: 'xAI\'s conversational AI with real-time knowledge and humor'
        }
      },
      {
        provider: 'xAI',
        id: 'grok-1',
        created: 1709251200, // March 1, 2024 (estimated)
        capabilities: ['reasoning', 'code', 'real-time', 'analysis', 'humor', 'extended-context'],
        metadata: {
          displayName: 'Grok-1',
          family: 'grok',
          tier: 'v1',
          release_date: '2024-03-01',
          owned_by: 'xai',
          official: true,
          api_model_name: 'grok-1',
          description: 'First generation Grok model'
        }
      },
      {
        provider: 'xAI',
        id: 'grok-1.5',
        created: 1717200000, // June 1, 2024 (estimated)
        capabilities: ['reasoning', 'code', 'real-time', 'analysis', 'humor', 'extended-context', 'vision'],
        metadata: {
          displayName: 'Grok-1.5',
          family: 'grok',
          tier: 'v1.5',
          release_date: '2024-06-01',
          owned_by: 'xai',
          official: true,
          api_model_name: 'grok-1.5',
          description: 'Enhanced Grok with vision capabilities'
        }
      },
      {
        provider: 'xAI',
        id: 'grok-2',
        created: 1723680000, // August 15, 2024 (estimated)
        capabilities: ['reasoning', 'code', 'real-time', 'analysis', 'humor', 'extended-context', 'vision', 'advanced-reasoning'],
        metadata: {
          displayName: 'Grok-2',
          family: 'grok',
          tier: 'v2',
          release_date: '2024-08-15',
          owned_by: 'xai',
          official: true,
          api_model_name: 'grok-2',
          description: 'Second generation Grok with advanced reasoning'
        }
      }
    ];
  }

  inferCapabilities(modelId) {
    const capabilities = ['reasoning', 'code', 'real-time', 'humor'];
    const id = modelId.toLowerCase();

    if (id.includes('1.5') || id.includes('2')) {
      capabilities.push('vision', 'extended-context');
    }

    if (id.includes('2')) {
      capabilities.push('advanced-reasoning', 'analysis');
    }

    return capabilities;
  }
}
