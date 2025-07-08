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
import { HuggingFaceUniversalSource } from './sources/HuggingFaceUniversalSource.js';
import { Logger } from './utils/Logger.js';
import { Scheduler } from './utils/Scheduler.js';
import { UnifiedCodeGenerator } from './generators/index.js';

class KHAOSResearcher {
  constructor() {
    this.logger = new Logger('KHAOSResearcher');
    this.database = new ModelDatabase();
    this.analyzer = new ModelAnalyzer();
    this.sources = [
      new HuggingFaceUniversalSource() // Single comprehensive source
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
    
    // Start tracking this cycle
    const sources = this.sources.map(s => s.name || s.constructor.name);
    await this.database.startResearchCycle(sources);
    
    let allDiscoveries = [];
    
    for (const source of this.sources) {
      try {
        const models = await source.fetchModels();
        const discoveries = await this.database.updateModels(models);
        allDiscoveries.push(...discoveries);
        
        this.logger.info(`📡 Processed ${models.length} models from ${source.name || source.constructor.name}`);
      } catch (error) {
        this.logger.error(`Source ${source.name || source.constructor.name} failed:`, error);
      }
    }

    // Complete the cycle
    await this.database.completeResearchCycle(allDiscoveries.length);
    await this.database.save(); // This is now a no-op but keeps interface consistent

    if (allDiscoveries.length > 0) {
      await this.notifyDiscoveries(allDiscoveries);
    }

    this.logger.info(`✅ Research cycle complete. Found ${allDiscoveries.length} new discoveries.`);
    return allDiscoveries;
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

  async generateCode(options = {}) {
    this.logger.info('🔨 Generating code...');
    
    const generator = new UnifiedCodeGenerator();
    const models = this.database.getAllModels();
    
    const code = generator.generate(models, options);
    
    this.logger.info(`✅ Code generated for ${options.language || 'javascript'}`);
    return code;
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
  } else if (process.argv.includes('--generate')) {
    // Parse code generation options
    const langIndex = process.argv.indexOf('--language');
    const styleIndex = process.argv.indexOf('--style');
    const providersIndex = process.argv.indexOf('--providers');
    
    const options = {
      language: langIndex > -1 ? process.argv[langIndex + 1] : 'javascript',
      style: styleIndex > -1 ? process.argv[styleIndex + 1] : null,
      providers: providersIndex > -1 ? process.argv[providersIndex + 1].split(',') : null
    };
    
    researcher.initialize()
      .then(() => researcher.generateCode(options))
      .then(code => {
        console.log(code);
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
  
Code Generation:
  node src/index.js --generate [options]
    --language <lang>    # js, ts, python (default: js)
    --style <style>      # class, object, etc.
    --providers <list>   # Comma-separated providers
    `);
  }
}

export { KHAOSResearcher };