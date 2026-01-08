import { Logger } from '../utils/Logger.js';

export class AnthropicSource {
  constructor() {
    this.name = 'Anthropic';
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.logger = new Logger('AnthropicSource');
  }

  async fetchModels() {
    // Anthropic doesn't have a public models listing endpoint
    // Maintaining curated list of official Claude models

    this.logger.info('📡 Loading curated Anthropic Claude models');

    const curatedModels = [
      // Claude 4.5 Series (Latest - January 2025)
      {
        provider: 'Anthropic',
        id: 'claude-sonnet-4-5-20250929',
        // NOTE: Model name has "20250929" but release date is Jan 7, 2025
        // The suffix is Anthropic's version identifier, not the release date
        created: 1736208000, // January 7, 2025 (actual public release)
        capabilities: ['reasoning', 'code', 'vision', 'analysis', 'advanced-reasoning', 'extended-context'],
        metadata: {
          family: 'claude-4.5',
          tier: 'sonnet',
          display_name: 'Claude Sonnet 4.5',
          release_date: '2025-01-07',
          context_window: 200000,
          max_output: 8192,
          official: true,
          api_model_name: 'claude-sonnet-4-5-20250929'
        }
      },

      // Claude 3.5 Series (October 2024)
      {
        provider: 'Anthropic',
        id: 'claude-3-5-sonnet-20241022',
        created: 1729555200, // October 22, 2024
        capabilities: ['reasoning', 'code', 'vision', 'analysis', 'fast-response'],
        metadata: {
          family: 'claude-3.5',
          tier: 'sonnet',
          display_name: 'Claude 3.5 Sonnet',
          release_date: '2024-10-22',
          context_window: 200000,
          max_output: 8192,
          official: true,
          api_model_name: 'claude-3-5-sonnet-20241022'
        }
      },
      {
        provider: 'Anthropic',
        id: 'claude-3-5-haiku-20241022',
        created: 1729555200, // October 22, 2024
        capabilities: ['reasoning', 'code', 'fast-response', 'cost-effective'],
        metadata: {
          family: 'claude-3.5',
          tier: 'haiku',
          display_name: 'Claude 3.5 Haiku',
          release_date: '2024-10-22',
          context_window: 200000,
          max_output: 8192,
          official: true,
          api_model_name: 'claude-3-5-haiku-20241022'
        }
      },

      // Claude 3 Series (February-March 2024)
      {
        provider: 'Anthropic',
        id: 'claude-3-opus-20240229',
        created: 1709164800, // February 29, 2024
        capabilities: ['reasoning', 'code', 'vision', 'complex-analysis', 'advanced-reasoning'],
        metadata: {
          family: 'claude-3',
          tier: 'opus',
          display_name: 'Claude 3 Opus',
          release_date: '2024-02-29',
          context_window: 200000,
          max_output: 4096,
          official: true,
          api_model_name: 'claude-3-opus-20240229'
        }
      },
      {
        provider: 'Anthropic',
        id: 'claude-3-sonnet-20240229',
        created: 1709164800, // February 29, 2024
        capabilities: ['reasoning', 'code', 'vision', 'analysis'],
        metadata: {
          family: 'claude-3',
          tier: 'sonnet',
          display_name: 'Claude 3 Sonnet',
          release_date: '2024-02-29',
          context_window: 200000,
          max_output: 4096,
          official: true,
          api_model_name: 'claude-3-sonnet-20240229'
        }
      },
      {
        provider: 'Anthropic',
        id: 'claude-3-haiku-20240307',
        created: 1709769600, // March 7, 2024
        capabilities: ['reasoning', 'code', 'vision', 'fast-response', 'cost-effective'],
        metadata: {
          family: 'claude-3',
          tier: 'haiku',
          display_name: 'Claude 3 Haiku',
          release_date: '2024-03-07',
          context_window: 200000,
          max_output: 4096,
          official: true,
          api_model_name: 'claude-3-haiku-20240307'
        }
      }
    ];

    this.logger.info(`✅ Loaded ${curatedModels.length} official Claude models`);
    return curatedModels;
  }

  async checkForUpdates() {
    // Future: Could scrape Anthropic's website or documentation for announcements
    this.logger.info('🔍 Checking for Anthropic model updates...');

    // For now, return empty - manual updates to curated list
    return [];
  }
}
