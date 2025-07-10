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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      let totalModels = null;
      
      // TARGET THE OBVIOUS: "Models 1,854,145" format
      const pageText = $('body').text();
      
      // Primary pattern: exact format from screenshot
      const primaryPattern = /Models\s+(\d{1,3}(?:,\d{3})*)/i;
      const primaryMatch = pageText.match(primaryPattern);
      
      if (primaryMatch) {
        const countStr = primaryMatch[1].replace(/,/g, '');
        const count = parseInt(countStr);
        if (count > 100000) { // Sanity check
          totalModels = count;
          this.logger.info(`✅ Found count with primary pattern: Models ${count.toLocaleString()}`);
        }
      }
      
      // Backup patterns if the primary fails
      if (!totalModels) {
        const backupPatterns = [
          // Various formats of the same data
          /(\d{1,3}(?:,\d{3})*)\s+models/i,
          /models:\s*(\d{1,3}(?:,\d{3})*)/i,
          /total.*?(\d{1,3}(?:,\d{3})*)/i,
          
          // Look for the number in different contexts
          /(\d{7,})/g // Any 7+ digit number (fallback)
        ];
        
        for (const pattern of backupPatterns) {
          const matches = pageText.match(pattern);
          if (matches) {
            if (pattern.global) {
              // For global patterns, find the largest reasonable number
              const numbers = matches.map(m => parseInt(m.replace(/,/g, '')))
                                    .filter(n => n > 1000000 && n < 10000000)
                                    .sort((a, b) => b - a);
              if (numbers.length > 0) {
                totalModels = numbers[0];
                this.logger.info(`✅ Found count with backup pattern: ${totalModels.toLocaleString()}`);
                break;
              }
            } else {
              const countStr = matches[1].replace(/,/g, '');
              const count = parseInt(countStr);
              if (count > 1000000 && count < 10000000) {
                totalModels = count;
                this.logger.info(`✅ Found count with backup pattern: ${count.toLocaleString()}`);
                break;
              }
            }
          }
        }
      }
      
      // Still no luck? Try DOM-specific searches
      if (!totalModels) {
        this.logger.info('🔍 Trying DOM-specific selectors...');
        
        // Look for common element patterns
        const selectors = [
          'h1', 'h2', 'h3', '.text-lg', '.text-xl', '.font-bold',
          '[data-testid*="count"]', '[data-testid*="total"]',
          '.models-count', '.total-models'
        ];
        
        for (const selector of selectors) {
          $(selector).each((i, elem) => {
            const text = $(elem).text().trim();
            const match = text.match(/(\d{1,3}(?:,\d{3})*)/);
            if (match) {
              const count = parseInt(match[1].replace(/,/g, ''));
              if (count > 1000000 && count < 10000000) {
                totalModels = count;
                this.logger.info(`✅ Found count in DOM element ${selector}: ${count.toLocaleString()}`);
                return false; // Break out of .each()
              }
            }
          });
          if (totalModels) break;
        }
      }
      
      // Success or failure handling
      if (totalModels) {
        this.logger.info(`🎯 Successfully scraped HuggingFace: ${totalModels.toLocaleString()} total models`);
        return totalModels;
      } else {
        this.logger.error('❌ Could not find model count with any pattern');
        this.logger.info('📄 Page text sample:', pageText.substring(0, 500));
        
        // Log what we actually found for debugging
        const debugMatches = pageText.match(/(\d{1,3}(?:,\d{3})*)/g);
        this.logger.info('🔍 All numbers found:', debugMatches?.slice(0, 10));
        
        return 1800000; // Fallback
      }

    } catch (error) {
      this.logger.error('Scraping failed:', error);
      return 1800000; // Fallback
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
        .map(model => {
          const dateInfo = this.parseModelDate(model);
          return {
            provider: provider,
            id: model.id || model.modelId,
            created: dateInfo ? dateInfo.timestamp : null,
            capabilities: this.inferCapabilities(model, provider),
            metadata: {
              downloads: model.downloads || 0,
              likes: model.likes || 0,
              tags: model.tags || [],
              pipeline_tag: model.pipeline_tag,
              uploaded_by: model.author,
              hf_id: model.id,
              source: 'huggingface-curated',
              dateSource: dateInfo ? dateInfo.source : 'unknown',
              rawDate: dateInfo ? dateInfo.raw : null,
              quality_score: this.calculateQualityScore(model)
            }
          };
        });

      this.logger.info(`✅ ${provider}: ${filteredModels.length} curated models`);
      return filteredModels;

    } catch (error) {
      this.logger.error(`Failed to fetch ${provider} models:`, error);
      return [];
    }
  }

  parseModelDate(model) {
    // Try multiple date sources in order of preference
    const dateSources = [
      { date: model.lastModified, source: 'last-modified' },
      { date: model.createdAt, source: 'upload-date' },
      { date: model.updatedAt, source: 'updated' }
    ];
    
    for (const { date, source } of dateSources) {
      if (date && date !== null && date !== undefined) {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          const result = {
            timestamp: Math.floor(parsed.getTime() / 1000),
            source: source,
            raw: date
          };
          return result;
        }
      }
    }
    return null; // Will display as "Unknown release date"
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
        dateSource: 'ecosystem-snapshot',
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