/**
 * Base Code Generator
 * Converts AI model data into client SDK code
 */

import { Logger } from '../utils/Logger.js';

export class CodeGenerator {
  constructor() {
    this.logger = new Logger('CodeGenerator');
  }

  /**
   * Generate client code for given models
   * @param {Object} models - Model data from database
   * @param {Object} options - Generation options
   * @returns {string} Generated code
   */
  generate(models, options = {}) {
    const {
      language = 'javascript',
      style = 'class',
      includeTypes = true,
      providers = null
    } = options;

    // Filter models by provider if specified
    const filteredModels = this.filterModels(models, providers);
    
    // Generate code based on language
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return this.generateJavaScript(filteredModels, { style, includeTypes });
      case 'typescript':
      case 'ts':
        return this.generateTypeScript(filteredModels, { style });
      case 'python':
      case 'py':
        return this.generatePython(filteredModels, { style });
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  /**
   * Filter models by providers
   */
  filterModels(models, providers) {
    if (!providers || providers.length === 0) {
      return models;
    }

    const filtered = {};
    for (const [key, model] of Object.entries(models)) {
      if (providers.includes(model.provider)) {
        filtered[key] = model;
      }
    }
    return filtered;
  }

  /**
   * Group models by provider
   */
  groupByProvider(models) {
    const grouped = {};
    for (const [key, model] of Object.entries(models)) {
      if (!grouped[model.provider]) {
        grouped[model.provider] = [];
      }
      grouped[model.provider].push(model);
    }
    return grouped;
  }

  /**
   * Generate JavaScript code - to be implemented by subclass
   */
  generateJavaScript(models, options) {
    throw new Error('generateJavaScript must be implemented by subclass');
  }

  /**
   * Generate TypeScript code - to be implemented by subclass
   */
  generateTypeScript(models, options) {
    throw new Error('generateTypeScript must be implemented by subclass');
  }

  /**
   * Generate Python code - to be implemented by subclass
   */
  generatePython(models, options) {
    throw new Error('generatePython must be implemented by subclass');
  }

  /**
   * Common utility to format model ID for use as identifier
   */
  formatIdentifier(modelId) {
    return modelId
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/^(\d)/, '_$1')
      .toUpperCase();
  }

  /**
   * Format model capabilities as code comment
   */
  formatCapabilities(capabilities) {
    if (!capabilities || capabilities.length === 0) {
      return 'No specific capabilities listed';
    }
    return capabilities.join(', ');
  }

  /**
   * Get timestamp for generated code
   */
  getTimestamp() {
    return new Date().toISOString();
  }
}