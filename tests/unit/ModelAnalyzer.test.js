import { describe, it, expect } from 'vitest';
import { ModelAnalyzer } from '../../src/models/ModelAnalyzer.js';

describe('ModelAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new ModelAnalyzer();
  });

  it('should identify significant models', () => {
    const significantModel = {
      provider: 'OpenAI',
      id: 'gpt-4-turbo',
      capabilities: ['reasoning', 'code']
    };

    const insignificantModel = {
      provider: 'OpenAI',
      id: 'text-embedding-ada-002',
      capabilities: ['embeddings']
    };

    expect(analyzer.isSignificantModel(significantModel)).toBe(true);
    expect(analyzer.isSignificantModel(insignificantModel)).toBe(false);
  });

  it('should calculate significance scores', () => {
    const modelWithManyCapabilities = {
      provider: 'OpenAI',
      id: 'gpt-4',
      capabilities: ['reasoning', 'code', 'vision', 'audio']
    };

    const modelWithFewCapabilities = {
      provider: 'OpenAI', 
      id: 'gpt-4',
      capabilities: ['reasoning']
    };

    const highScore = analyzer.calculateSignificance(modelWithManyCapabilities);
    const lowScore = analyzer.calculateSignificance(modelWithFewCapabilities);

    expect(highScore).toBeGreaterThan(lowScore);
    expect(highScore).toBeLessThanOrEqual(100);
  });

  it('should analyze models and return discoveries', async () => {
    const testModels = [
      {
        provider: 'OpenAI',
        id: 'gpt-4-turbo',
        capabilities: ['reasoning', 'code'],
        created: Date.now()
      },
      {
        provider: 'OpenAI',
        id: 'text-embedding-ada-002',
        capabilities: ['embeddings'],
        created: Date.now()
      }
    ];

    const discoveries = await analyzer.analyzeNewModels(testModels);
    
    expect(discoveries).toHaveLength(1);
    expect(discoveries[0].type).toBe('new_model');
    expect(discoveries[0].model.id).toBe('gpt-4-turbo');
  });
});