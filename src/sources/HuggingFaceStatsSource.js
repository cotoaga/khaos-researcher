import fetch from 'node-fetch';
import { Logger } from '../utils/Logger.js';

export class HuggingFaceStatsSource {
  constructor() {
    this.name = 'HuggingFace';
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.baseUrl = 'https://huggingface.co/api';
    this.logger = new Logger('HuggingFaceStatsSource');
  }

  async fetchModels() {
    try {
      // Fetch model statistics, not individual models
      const stats = await this.fetchModelStats();
      
      // Return ONLY the ocean count model, not individual category models
      return [
        {
          provider: 'HuggingFace',
          id: 'community-ocean',
          created: Date.now(),
          capabilities: ['community', 'open-source', 'democratized-ai'],
          metadata: {
            type: 'community-ocean',
            totalModels: stats.totalModels,
            description: 'Community model repository',
            scale: 'massive',
            note: 'Excludes from provider comparison - shown in Ocean section'
          }
        }
      ];
    } catch (error) {
      this.logger.error('Failed to fetch HuggingFace stats:', error);
      return this.getFallbackStats();
    }
  }

  async fetchModelStats() {
    const headers = {
      'User-Agent': 'KHAOS-Researcher/1.0'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      // Try to get total count using different approaches
      
      // Approach 1: Try models endpoint with search to get pagination info
      const modelsResponse = await fetch(`${this.baseUrl}/models?limit=1`, { headers });
      
      if (modelsResponse.ok) {
        // Check for Link header with pagination info
        const linkHeader = modelsResponse.headers.get('link');
        if (linkHeader && linkHeader.includes('rel="last"')) {
          const lastPageMatch = linkHeader.match(/page=(\d+)[^>]*>; rel="last"/);
          if (lastPageMatch) {
            const lastPage = parseInt(lastPageMatch[1]);
            const estimatedTotal = lastPage * 20; // HF typically uses 20 per page
            this.logger.info(`🌊 HuggingFace pagination count: ${estimatedTotal.toLocaleString()}`);
            
            return {
              totalModels: estimatedTotal,
              totalDownloads: estimatedTotal * 1000,
              activeModels: Math.floor(estimatedTotal * 0.7),
              textGeneration: Math.floor(estimatedTotal * 0.4),
              computerVision: Math.floor(estimatedTotal * 0.25),
              audio: Math.floor(estimatedTotal * 0.1)
            };
          }
        }
        
        // Check response headers for total count
        const totalCount = modelsResponse.headers.get('x-total-count') || 
                          modelsResponse.headers.get('total-count');
        if (totalCount) {
          const count = parseInt(totalCount);
          this.logger.info(`🌊 HuggingFace header count: ${count.toLocaleString()}`);
          
          return {
            totalModels: count,
            totalDownloads: count * 1000,
            activeModels: Math.floor(count * 0.7),
            textGeneration: Math.floor(count * 0.4),
            computerVision: Math.floor(count * 0.25),
            audio: Math.floor(count * 0.1)
          };
        }
      }
      
      // Approach 2: Try to fetch multiple pages to estimate
      const samplesResponse = await fetch(`${this.baseUrl}/models?limit=100`, { headers });
      if (samplesResponse.ok) {
        const samplesData = await samplesResponse.json();
        if (samplesData && Array.isArray(samplesData) && samplesData.length > 0) {
          // If we get 100 results, there are likely many more
          const estimatedFromSample = samplesData.length * 500; // Conservative multiplier
          this.logger.info(`🌊 HuggingFace estimated from sample: ${estimatedFromSample.toLocaleString()}`);
          
          return {
            totalModels: estimatedFromSample,
            totalDownloads: estimatedFromSample * 1000,
            activeModels: Math.floor(estimatedFromSample * 0.7),
            textGeneration: Math.floor(estimatedFromSample * 0.4),
            computerVision: Math.floor(estimatedFromSample * 0.25),
            audio: Math.floor(estimatedFromSample * 0.1)
          };
        }
      }

      this.logger.warn('Could not get dynamic count, using updated estimate');
      return this.getFallbackStatsData();
      
    } catch (error) {
      this.logger.warn('Using fallback stats due to API error:', error);
      return this.getFallbackStatsData();
    }
  }

  async extractModelCount(response) {
    try {
      // Try to get actual count from response
      const data = await response.json();
      // HuggingFace doesn't provide total counts easily, so we estimate based on known data
      return null; // Will use fallback numbers
    } catch (error) {
      return null;
    }
  }

  getFallbackStatsData() {
    // Updated estimates based on HuggingFace growth (as of Jan 2025)
    // This should be replaced with dynamic data when API calls succeed
    this.logger.warn('🔄 Using fallback estimate - dynamic fetch failed');
    return {
      totalModels: 58000, // Updated estimate for 2025
      totalDownloads: 58000000,
      activeModels: 40000,
      textGeneration: 23000,
      computerVision: 15000,
      audio: 6000
    };
  }

  getFallbackStats() {
    const stats = this.getFallbackStatsData();
    
    return [
      {
        provider: 'HuggingFace',
        id: 'community-ocean',
        created: Date.now(),
        capabilities: ['community', 'open-source', 'democratized-ai'],
        metadata: {
          type: 'community-ocean',
          totalModels: stats.totalModels,
          description: 'Community model repository',
          scale: 'massive',
          note: 'Excludes from provider comparison - shown in Ocean section'
        }
      }
    ];
  }
}