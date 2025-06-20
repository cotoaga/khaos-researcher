import { describe, it, expect, beforeEach } from 'vitest';
import { OpenAISource } from '../../../src/sources/OpenAISource.js';

describe('OpenAISource', () => {
  let source;

  beforeEach(() => {
    source = new OpenAISource();
  });

  it('should infer capabilities correctly', () => {
    const gpt4Capabilities = source.inferCapabilities('gpt-4');
    expect(gpt4Capabilities).toContain('reasoning');
    expect(gpt4Capabilities).toContain('text-generation');

    const codeCapabilities = source.inferCapabilities('gpt-4-code');
    expect(codeCapabilities).toContain('code');

    const visionCapabilities = source.inferCapabilities('gpt-4-vision');
    expect(visionCapabilities).toContain('vision');

    const whisperCapabilities = source.inferCapabilities('whisper-1');
    expect(whisperCapabilities).toContain('audio');
    expect(whisperCapabilities).toContain('transcription');

    const dalleCapabilities = source.inferCapabilities('dall-e-3');
    expect(dalleCapabilities).toContain('image-generation');
  });

  it('should handle missing API key gracefully', async () => {
    // Temporarily remove API key
    const originalKey = source.apiKey;
    source.apiKey = null;

    const models = await source.fetchModels();
    expect(models).toEqual([]);

    // Restore API key
    source.apiKey = originalKey;
  });
});