#!/usr/bin/env node

/**
 * KHAOS-Researcher v1.0
 * AI Model Intelligence Agent
 * 
 * Built with KHAOS-Coder principles:
 * - Simple and focused
 * - Test-driven development
 * - Pragmatic architecture
 */

import 'dotenv/config';

import { ModelDatabase } from './models/ModelDatabase.js';
import { ModelAnalyzer } from './models/ModelAnalyzer.js';
import { OpenAISource } from './sources/OpenAISource.js';
import { AnthropicSource } from './sources/AnthropicSource.js';
import { Logger } from './utils/Logger.js';
import { Scheduler } from './utils/Scheduler.js';

class KHAOSResearcher {
  constructor() {
    this.logger = new Logger('KHAOSResearcher');
    this.database = new ModelDatabase();
    this.analyzer = new ModelAnalyzer();
    this.sources = [
      new OpenAISource(),
      new AnthropicSource()
    ];
    this.scheduler = new Scheduler();
  }

  async initialize() {
    this.logger.info('🚀 KHAOS-Researcher initializing...');
    await this.database.load();
    this.logger.info('✅ Initialization complete');
  }

  async runResearchCycle() {
    this.logger.info('🔍 Starting research cycle...');
    
    const discoveries = [];
    
    for (const source of this.sources) {
      try {
        const models = await source.fetchModels();
        const newDiscoveries = await this.analyzer.analyzeNewModels(models);
        discoveries.push(...newDiscoveries);
        
        await this.database.updateModels(models);
      } catch (error) {
        this.logger.error(`Source ${source.name} failed:`, error);
      }
    }

    await this.database.save();
    
    if (discoveries.length > 0) {
      await this.notifyDiscoveries(discoveries);
    }

    this.logger.info(`✅ Research cycle complete. Found ${discoveries.length} new discoveries.`);
    return discoveries;
  }

  async notifyDiscoveries(discoveries) {
    // Implement webhook notifications here
    this.logger.info(`📢 Notifying about ${discoveries.length} discoveries`);
  }

  async startMonitoring() {
    this.logger.info('🔄 Starting continuous monitoring...');
    
    await this.initialize();
    
    // Run immediate cycle
    await this.runResearchCycle();
    
    // Schedule regular cycles
    this.scheduler.start(() => this.runResearchCycle());
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const researcher = new KHAOSResearcher();
  
  if (process.argv.includes('--monitor')) {
    researcher.startMonitoring();
  } else if (process.argv.includes('--run')) {
    researcher.initialize()
      .then(() => researcher.runResearchCycle())
      .then(discoveries => {
        console.log(`\n📊 Research complete: ${discoveries.length} discoveries`);
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  } else {
    console.log(`
🗡️ KHAOS-Researcher v1.0

Usage:
  npm run research     # Run single research cycle
  npm run monitor      # Start continuous monitoring
  npm run dev          # Same as monitor
  npm test             # Run test suite
    `);
  }
}

export { KHAOSResearcher };