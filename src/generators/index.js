/**
 * Unified Code Generator
 * Main entry point for code generation
 */

import { JavaScriptGenerator } from './JavaScriptGenerator.js';
import { PythonGenerator } from './PythonGenerator.js';

class UnifiedCodeGenerator {
  constructor() {
    this.jsGenerator = new JavaScriptGenerator();
    this.pyGenerator = new PythonGenerator();
  }

  /**
   * Generate code for the specified language
   * @param {Object} models - Model data from database
   * @param {Object} options - Generation options
   * @returns {string} Generated code
   */
  generate(models, options = {}) {
    const language = options.language?.toLowerCase() || 'javascript';
    
    switch (language) {
      case 'javascript':
      case 'js':
        return this.jsGenerator.generate(models, options);
      
      case 'typescript':
      case 'ts':
        return this.jsGenerator.generate(models, { ...options, language: 'typescript' });
      
      case 'python':
      case 'py':
        return this.pyGenerator.generate(models, options);
      
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return ['javascript', 'typescript', 'python'];
  }

  /**
   * Get supported styles for a language
   */
  getSupportedStyles(language) {
    switch (language?.toLowerCase()) {
      case 'javascript':
      case 'js':
      case 'typescript':
      case 'ts':
        return ['class', 'object', 'constants'];
      
      case 'python':
      case 'py':
        return ['class', 'dataclass', 'enum', 'dict'];
      
      default:
        return [];
    }
  }
}

export { UnifiedCodeGenerator };
export default UnifiedCodeGenerator;