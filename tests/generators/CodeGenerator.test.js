import { describe, it, expect, beforeEach } from 'vitest';
import { UnifiedCodeGenerator } from '../../src/generators/index.js';

describe('UnifiedCodeGenerator', () => {
  let generator;
  let mockModels;

  beforeEach(() => {
    generator = new UnifiedCodeGenerator();
    mockModels = {
      'OpenAI-gpt-4': {
        provider: 'OpenAI',
        id: 'gpt-4',
        capabilities: ['reasoning', 'code', 'vision'],
        metadata: {
          owned_by: 'openai',
          family: 'gpt-4'
        },
        created: 1678659856
      },
      'OpenAI-gpt-3.5-turbo': {
        provider: 'OpenAI',
        id: 'gpt-3.5-turbo',
        capabilities: ['reasoning', 'code'],
        metadata: {
          owned_by: 'openai',
          family: 'gpt-3.5'
        },
        created: 1677649963
      },
      'Anthropic-claude-3-5-sonnet': {
        provider: 'Anthropic',
        id: 'claude-3-5-sonnet',
        capabilities: ['reasoning', 'code', 'vision', 'analysis'],
        metadata: {
          family: 'claude-3.5',
          tier: 'sonnet'
        },
        created: 1700000000
      }
    };
  });

  describe('JavaScript Generation', () => {
    it('should generate JavaScript class style code', () => {
      const code = generator.generate(mockModels, {
        language: 'javascript',
        style: 'class'
      });

      expect(code).toContain('export class OpenAIModels');
      expect(code).toContain('export class AnthropicModels');
      expect(code).toContain('export class Models');
      expect(code).toContain('static GPT_4 =');
      expect(code).toContain('static CLAUDE_3_5_SONNET =');
    });

    it('should generate JavaScript object style code', () => {
      const code = generator.generate(mockModels, {
        language: 'javascript',
        style: 'object'
      });

      expect(code).toContain('export const AI_MODELS');
      expect(code).toContain('OpenAI: {');
      expect(code).toContain('Anthropic: {');
      expect(code).toContain('export function getModel(');
    });

    it('should generate JavaScript constants style code', () => {
      const code = generator.generate(mockModels, {
        language: 'javascript',
        style: 'constants'
      });

      expect(code).toContain('export const GPT_4 = "gpt-4"');
      expect(code).toContain('export const CLAUDE_3_5_SONNET = "claude-3-5-sonnet"');
      expect(code).toContain('export const OPENAI_MODELS');
      expect(code).toContain('export const ANTHROPIC_MODELS');
    });
  });

  describe('TypeScript Generation', () => {
    it('should generate TypeScript with type definitions', () => {
      const code = generator.generate(mockModels, {
        language: 'typescript',
        style: 'class'
      });

      expect(code).toContain('export interface Model');
      expect(code).toContain(': Model =');
      expect(code).toContain(': Model[]');
      expect(code).toContain(': Model | undefined');
    });

    it('should generate TypeScript type literals', () => {
      const code = generator.generate(mockModels, {
        language: 'typescript',
        style: 'constants'
      });

      expect(code).toContain('export type ModelId =');
      expect(code).toContain('export type Provider =');
      expect(code).toContain('as const');
    });
  });

  describe('Python Generation', () => {
    it('should generate Python class style code', () => {
      const code = generator.generate(mockModels, {
        language: 'python',
        style: 'class'
      });

      expect(code).toContain('class Model:');
      expect(code).toContain('class OpenAIModels:');
      expect(code).toContain('class AnthropicModels:');
      expect(code).toContain('GPT_4 = Model(');
      expect(code).toContain('CLAUDE_3_5_SONNET = Model(');
    });

    it('should generate Python dataclass style code', () => {
      const code = generator.generate(mockModels, {
        language: 'python',
        style: 'dataclass'
      });

      expect(code).toContain('@dataclass(frozen=True)');
      expect(code).toContain('class Model:');
      expect(code).toContain('GPT_4 = Model(');
      expect(code).toContain('def get_all_models()');
    });

    it('should generate Python enum style code', () => {
      const code = generator.generate(mockModels, {
        language: 'python',
        style: 'enum'
      });

      expect(code).toContain('class ModelID(str, Enum):');
      expect(code).toContain('class Provider(str, Enum):');
      expect(code).toContain('class Capability(str, Enum):');
      expect(code).toContain('MODEL_INFO: Dict[ModelID, Dict[str, any]]');
    });

    it('should generate Python dict style code', () => {
      const code = generator.generate(mockModels, {
        language: 'python',
        style: 'dict'
      });

      expect(code).toContain('AI_MODELS = {');
      expect(code).toContain('"OpenAI": {');
      expect(code).toContain('"Anthropic": {');
      expect(code).toContain('def get_model(provider: str, model_id: str)');
    });
  });

  describe('Provider Filtering', () => {
    it('should filter models by provider', () => {
      const code = generator.generate(mockModels, {
        language: 'javascript',
        style: 'class',
        providers: ['OpenAI']
      });

      expect(code).toContain('export class OpenAIModels');
      expect(code).not.toContain('export class AnthropicModels');
      expect(code).toContain('GPT_4');
      expect(code).not.toContain('CLAUDE_3_5_SONNET');
    });

    it('should include all models when no provider filter', () => {
      const code = generator.generate(mockModels, {
        language: 'javascript',
        style: 'class'
      });

      expect(code).toContain('export class OpenAIModels');
      expect(code).toContain('export class AnthropicModels');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported language', () => {
      expect(() => {
        generator.generate(mockModels, { language: 'ruby' });
      }).toThrow('Unsupported language: ruby');
    });

    it('should use default options when not provided', () => {
      const code = generator.generate(mockModels);
      expect(code).toContain('export class'); // Default is JS class style
    });
  });

  describe('Supported Languages and Styles', () => {
    it('should return supported languages', () => {
      const languages = generator.getSupportedLanguages();
      expect(languages).toEqual(['javascript', 'typescript', 'python']);
    });

    it('should return supported styles for JavaScript', () => {
      const styles = generator.getSupportedStyles('javascript');
      expect(styles).toEqual(['class', 'object', 'constants']);
    });

    it('should return supported styles for Python', () => {
      const styles = generator.getSupportedStyles('python');
      expect(styles).toEqual(['class', 'dataclass', 'enum', 'dict']);
    });
  });
});