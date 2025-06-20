import { describe, it, expect, beforeEach } from 'vitest';
import { AnthropicSource } from '../../../src/sources/AnthropicSource.js';

describe('AnthropicSource', () => {
  let source;

  beforeEach(() => {
    source = new AnthropicSource();
  });

  it('should return known Anthropic models', async () => {
    const models = await source.fetchModels();
    
    expect(models.length).toBeGreaterThan(0);
    expect(models.every(model => model.provider === 'Anthropic')).toBe(true);
    
    const claudeModels = models.filter(model => model.id.includes('claude'));
    expect(claudeModels.length).toBeGreaterThan(0);
  });

  it('should include proper capabilities for Claude models', async () => {
    const models = await source.fetchModels();
    
    const sonnetModel = models.find(model => model.id.includes('sonnet'));
    expect(sonnetModel?.capabilities).toContain('reasoning');
    expect(sonnetModel?.capabilities).toContain('code');
    
    const opusModel = models.find(model => model.id.includes('opus'));
    expect(opusModel?.capabilities).toContain('complex-analysis');
  });

  it('should have proper metadata structure', async () => {
    const models = await source.fetchModels();
    
    models.forEach(model => {
      expect(model).toHaveProperty('provider');
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('created');
      expect(model).toHaveProperty('capabilities');
      expect(model).toHaveProperty('metadata');
      expect(model.metadata).toHaveProperty('family');
      expect(model.metadata).toHaveProperty('tier');
    });
  });
});