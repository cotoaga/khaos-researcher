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
      // Approach 1: Try search API with different strategies
      const searchEndpoints = [
        // Try search with minimal query to get all models
        `${this.baseUrl}/models?search=&limit=1`,
        // Try with sort to potentially get better pagination
        `${this.baseUrl}/models?sort=trending&limit=1`,
        // Try with specific filters that should match most models
        `${this.baseUrl}/models?filter=model-index&limit=1`,
        // Try the basic models endpoint
        `${this.baseUrl}/models?limit=1`
      ];

      for (const endpoint of searchEndpoints) {
        try {
          this.logger.info(`🔍 Trying endpoint: ${endpoint}`);
          const response = await fetch(endpoint, { headers });
          
          if (response.ok) {
            // Method 1: Check Link header for pagination
            const linkHeader = response.headers.get('link');
            if (linkHeader) {
              this.logger.info(`📄 Link header: ${linkHeader}`);
              
              // Look for last page in various formats
              const patterns = [
                /page=(\d+)[^>]*>;\s*rel=["']?last["']?/i,
                /\?.*page=(\d+).*>;\s*rel=["']?last["']?/i,
                /page%3D(\d+)/i
              ];
              
              for (const pattern of patterns) {
                const match = linkHeader.match(pattern);
                if (match) {
                  const lastPage = parseInt(match[1]);
                  // HF uses different page sizes, try to detect from URL params or assume 20
                  let pageSize = 20;
                  const limitMatch = linkHeader.match(/limit=(\d+)/);
                  if (limitMatch) pageSize = parseInt(limitMatch[1]);
                  
                  const totalEstimate = lastPage * pageSize;
                  this.logger.info(`🎯 HuggingFace pagination found: page ${lastPage}, size ${pageSize} = ${totalEstimate.toLocaleString()} models`);
                  
                  return this.buildStatsFromTotal(totalEstimate);
                }
              }
            }
            
            // Method 2: Check various total count headers
            const countHeaders = [
              'x-total-count',
              'total-count', 
              'x-total',
              'count',
              'x-count'
            ];
            
            for (const headerName of countHeaders) {
              const headerValue = response.headers.get(headerName);
              if (headerValue) {
                const count = parseInt(headerValue);
                if (!isNaN(count) && count > 0) {
                  this.logger.info(`📊 Found count in header ${headerName}: ${count.toLocaleString()}`);
                  return this.buildStatsFromTotal(count);
                }
              }
            }
            
            // Method 3: Parse response body for clues
            const responseText = await response.text();
            let responseData;
            try {
              responseData = JSON.parse(responseText);
            } catch (e) {
              // Not JSON, maybe HTML with stats
              const countMatch = responseText.match(/(\d{1,3}(?:[,.]?\d{3})*)\s*models?/i);
              if (countMatch) {
                const countStr = countMatch[1].replace(/[,.]/g, '');
                const count = parseInt(countStr);
                if (!isNaN(count) && count > 1000) { // Sanity check
                  this.logger.info(`🔍 Found count in response text: ${count.toLocaleString()}`);
                  return this.buildStatsFromTotal(count);
                }
              }
              continue;
            }
            
            // Check for total in JSON response
            if (responseData) {
              const possibleTotals = [
                responseData.total,
                responseData.totalCount,
                responseData.count,
                responseData.numFound,
                responseData.length
              ];
              
              for (const total of possibleTotals) {
                if (typeof total === 'number' && total > 1000) {
                  this.logger.info(`📊 Found total in JSON: ${total.toLocaleString()}`);
                  return this.buildStatsFromTotal(total);
                }
              }
              
              // If we get an array, try to estimate from sample size
              if (Array.isArray(responseData) && responseData.length > 0) {
                // Conservative estimate: if we get full page, multiply by large factor
                const sampleSize = responseData.length;
                const estimatedTotal = sampleSize >= 20 ? sampleSize * 50000 : sampleSize * 10000;
                this.logger.info(`📊 Estimated from sample size ${sampleSize}: ${estimatedTotal.toLocaleString()}`);
                return this.buildStatsFromTotal(estimatedTotal);
              }
            }
          }
        } catch (endpointError) {
          this.logger.warn(`❌ Endpoint ${endpoint} failed:`, endpointError.message);
          continue;
        }
      }

      // Approach 2: Try datasets API (might give better pagination)
      try {
        const datasetsResponse = await fetch(`https://huggingface.co/api/datasets?limit=1`, { headers });
        if (datasetsResponse.ok) {
          const linkHeader = datasetsResponse.headers.get('link');
          if (linkHeader && linkHeader.includes('rel="last"')) {
            const lastPageMatch = linkHeader.match(/page=(\d+)/);
            if (lastPageMatch) {
              const datasetsPages = parseInt(lastPageMatch[1]);
              // Rough estimate: models are typically 10x more numerous than datasets
              const estimatedModels = datasetsPages * 20 * 10;
              this.logger.info(`📊 Estimated from datasets pagination: ${estimatedModels.toLocaleString()} models`);
              return this.buildStatsFromTotal(estimatedModels);
            }
          }
        }
      } catch (e) {
        this.logger.warn('Datasets API approach failed:', e.message);
      }

      this.logger.warn('🔄 All dynamic methods failed, using updated realistic estimate');
      return this.getFallbackStatsData();
      
    } catch (error) {
      this.logger.error('🚨 Critical error in fetchModelStats:', error);
      return this.getFallbackStatsData();
    }
  }

  buildStatsFromTotal(totalModels) {
    return {
      totalModels,
      totalDownloads: totalModels * 1000,
      activeModels: Math.floor(totalModels * 0.7),
      textGeneration: Math.floor(totalModels * 0.4),
      computerVision: Math.floor(totalModels * 0.25),
      audio: Math.floor(totalModels * 0.1)
    };
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
    // Realistic estimates based on HuggingFace homepage showing "1M+ models" (Jan 2025)
    // This should be replaced with dynamic data when API calls succeed
    this.logger.warn('🔄 Using realistic fallback - HuggingFace shows 1M+ models on homepage');
    return {
      totalModels: 1200000, // Based on "1M+ models" from homepage
      totalDownloads: 1200000000,
      activeModels: 840000, // ~70% active
      textGeneration: 480000, // ~40% text generation
      computerVision: 300000, // ~25% computer vision
      audio: 120000 // ~10% audio
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