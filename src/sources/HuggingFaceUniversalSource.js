import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { Logger } from '../utils/Logger.js';

export class HuggingFaceUniversalSource {
  constructor() {
    this.name = 'HuggingFace-Universal';
    this.baseUrl = 'https://huggingface.co/api';
    this.webUrl = 'https://huggingface.co';
    this.logger = new Logger('HuggingFaceUniversal');
  }

  // Provider search strategies for intelligent curation
  getProviderQueries() {
    return {
      'OpenAI': {
        terms: ['openai', 'gpt-4', 'gpt-3.5', 'dall-e', 'whisper'],
        quality_threshold: 1000 // Higher threshold for popular models
      },
      'Anthropic': {
        terms: ['anthropic', 'claude', 'claude-3', 'claude-4'],
        quality_threshold: 500
      },
      'Google': {
        terms: ['google', 'gemini', 'palm', 'bard', 'gemma'],
        quality_threshold: 1000
      },
      'Meta': {
        terms: ['meta', 'llama', 'llama-2', 'llama-3', 'facebook'],
        quality_threshold: 2000
      },
      'Mistral': {
        terms: ['mistral', 'mixtral', 'mistral-7b'],
        quality_threshold: 500
      },
      'DeepSeek': {
        terms: ['deepseek', 'deepseek-r1', 'deepseek-v2'],
        quality_threshold: 100
      },
      'Microsoft': {
        terms: ['microsoft', 'phi', 'orca', 'wizardlm'],
        quality_threshold: 500
      },
      'Cohere': {
        terms: ['cohere', 'command', 'command-r'],
        quality_threshold: 100
      },
      'Alibaba': {
        terms: ['alibaba', 'qwen', 'qwen2'],
        quality_threshold: 300
      },
      'xAI': {
        terms: ['xai', 'grok', 'grok-1'],
        quality_threshold: 100
      }
    };
  }

  async scrapeEcosystemMetrics() {
    try {
      this.logger.info('🌊 Scraping HuggingFace ecosystem metrics...');
      
      const response = await fetch(`${this.webUrl}/models`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KHAOS-Researcher/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Multiple strategies to find the total count
      let totalModels = null;
      
      // Strategy 1: Look for text like "1,234,567 models"
      const pageText = $('body').text();
      const countPatterns = [
        /(\d{1,3}(?:[,\.]\d{3})+)\s+models?/i,
        /(\d{6,})\s+models?/i,
        /models?\s*[:\-]?\s*(\d{1,3}(?:[,\.]\d{3})+)/i
      ];

      for (const pattern of countPatterns) {
        const match = pageText.match(pattern);
        if (match) {
          const countStr = match[1].replace(/[,\.]/g, '');
          const count = parseInt(countStr);
          if (count > 100000) { // Sanity check - HF has way more than 100k
            totalModels = count;
            break;
          }
        }
      }

      // Strategy 2: Look in meta tags or structured data
      if (!totalModels) {
        const metaDescription = $('meta[name="description"]').attr('content') || '';
        const metaMatch = metaDescription.match(/(\d{1,3}(?:[,\.]\d{3})+)/);
        if (metaMatch) {
          const count = parseInt(metaMatch[1].replace(/[,\.]/g, ''));
          if (count > 100000) {
            totalModels = count;
          }
        }
      }

      // Strategy 3: Conservative estimate if scraping fails
      if (!totalModels) {
        this.logger.warn('Could not scrape exact count, using conservative estimate');
        totalModels = 1800000; // Updated conservative estimate
      }

      this.logger.info(`🎯 HuggingFace ecosystem: ${totalModels.toLocaleString()} total models`);
      return totalModels;

    } catch (error) {
      this.logger.error('Scraping failed:', error);
      return 1800000; // Fallback estimate
    }
  }

  async fetchProviderModels(provider, config, limit = 25) {
    try {
      const { terms, quality_threshold } = config;
      
      // Search for highest quality models from this provider
      const searchQuery = terms[0]; // Use primary term for search
      const response = await fetch(
        `${this.baseUrl}/models?search=${encodeURIComponent(searchQuery)}&limit=${limit}&sort=downloads&direction=-1`,
        {
          headers: {
            'User-Agent': 'KHAOS-Researcher/1.0'
          }
        }
      );

      if (!response.ok) {
        this.logger.warn(`HTTP ${response.status} for ${provider}`);
        return [];
      }

      const models = await response.json();
      
      const filteredModels = models
        .filter(model => this.isRelevantModel(model, provider, terms, quality_threshold))
        .slice(0, 10) // Limit to top 10 per provider
        .map(model => ({
          provider: provider,
          id: model.id || model.modelId,
          created: this.parseModelDate(model),
          capabilities: this.inferCapabilities(model, provider),
          metadata: {
            downloads: model.downloads || 0,
            likes: model.likes || 0,
            tags: model.tags || [],
            pipeline_tag: model.pipeline_tag,
            uploaded_by: model.author,
            hf_id: model.id,
            source: 'huggingface-curated',
            dateSource: model.createdAt ? 'hf-upload' : 'n.a. via API',
            quality_score: this.calculateQualityScore(model)
          }
        }));

      this.logger.info(`✅ ${provider}: ${filteredModels.length} curated models`);
      return filteredModels;

    } catch (error) {
      this.logger.error(`Failed to fetch ${provider} models:`, error);
      return [];
    }
  }

  parseModelDate(model) {
    if (model.createdAt) {
      const date = new Date(model.createdAt);
      if (!isNaN(date.getTime())) {
        return Math.floor(date.getTime() / 1000);
      }
    }
    return null; // Will display as "n.a. via API"
  }

  calculateQualityScore(model) {
    const downloads = model.downloads || 0;
    const likes = model.likes || 0;
    return Math.log10(downloads + 1) * 10 + likes;
  }

  isRelevantModel(model, provider, terms, qualityThreshold) {
    const modelId = (model.id || '').toLowerCase();
    const author = (model.author || '').toLowerCase();
    
    // Must match at least one provider term
    const matchesTerm = terms.some(term => 
      modelId.includes(term.toLowerCase()) ||
      author.includes(term.toLowerCase())
    );

    // Quality and relevance filters
    const hasMinQuality = (model.downloads || 0) >= qualityThreshold;
    const isNotFake = !modelId.includes('uncensored') && 
                     !modelId.includes('nsfw') && 
                     !modelId.includes('roleplay');
    
    return matchesTerm && hasMinQuality && isNotFake;
  }

  inferCapabilities(model, provider) {
    const capabilities = [];
    const tags = model.tags || [];
    const pipelineTag = model.pipeline_tag || '';
    const modelId = (model.id || '').toLowerCase();
    
    // Infer from pipeline tag
    if (pipelineTag.includes('text-generation')) capabilities.push('text-generation');
    if (pipelineTag.includes('text-to-image')) capabilities.push('image-generation');
    if (pipelineTag.includes('automatic-speech-recognition')) capabilities.push('speech-recognition');
    if (pipelineTag.includes('image-classification')) capabilities.push('vision');
    
    // Provider-specific capabilities
    if (['OpenAI', 'Anthropic', 'Google'].includes(provider)) {
      capabilities.push('reasoning', 'enterprise');
    }
    
    if (modelId.includes('code') || modelId.includes('coder')) {
      capabilities.push('code');
    }
    
    // Always add community source
    capabilities.push('community-hosted');
    
    return capabilities.length > 0 ? capabilities : ['general'];
  }

  async fetchModels() {
    this.logger.info('🚀 Starting universal HuggingFace intelligence gathering...');
    
    const allModels = [];
    const providers = this.getProviderQueries();
    
    // Get ecosystem-wide metrics
    const totalEcosystem = await this.scrapeEcosystemMetrics();
    
    // Add ecosystem overview model
    allModels.push({
      provider: 'HuggingFace',
      id: 'ecosystem-ocean',
      created: Math.floor(Date.now() / 1000),
      capabilities: ['community', 'open-source', 'democratized-ai'],
      metadata: {
        type: 'ecosystem-ocean',
        totalModels: totalEcosystem,
        description: 'Global AI model ecosystem',
        lastScraped: new Date().toISOString(),
        source: 'web-scraping',
        note: 'Curated subset shown below'
      }
    });

    // Fetch curated models from each provider
    let totalCurated = 0;
    for (const [provider, config] of Object.entries(providers)) {
      this.logger.info(`🔍 Curating ${provider} models...`);
      
      const providerModels = await this.fetchProviderModels(provider, config);
      allModels.push(...providerModels);
      totalCurated += providerModels.length;
      
      // Be nice to HuggingFace API
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    this.logger.info(`🎯 Intelligence summary: ${totalCurated} curated models from ${totalEcosystem.toLocaleString()} ecosystem total`);
    return allModels;
  }
}