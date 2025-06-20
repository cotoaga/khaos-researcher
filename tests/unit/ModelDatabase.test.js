import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ModelDatabase } from '../../src/models/ModelDatabase.js';
import fs from 'fs/promises';

describe('ModelDatabase', () => {
  let db;
  const testFilePath = 'test-data/models.json';

  beforeEach(async () => {
    db = new ModelDatabase(testFilePath);
    
    // Clean up any existing test file
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // File doesn't exist, that's fine
    }
  });

  afterEach(async () => {
    // Clean up test file
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // File doesn't exist, that's fine
    }
  });

  it('should initialize with empty models', () => {
    expect(db.models.size).toBe(0);
    expect(db.metadata.totalModels).toBe(0);
  });

  it('should save and load models correctly', async () => {
    const testModels = [
      {
        provider: 'OpenAI',
        id: 'gpt-4',
        capabilities: ['reasoning', 'code'],
        created: Date.now()
      }
    ];

    await db.updateModels(testModels);
    await db.save();

    const newDb = new ModelDatabase(testFilePath);
    await newDb.load();

    expect(newDb.models.size).toBe(1);
    expect(newDb.getModelsByProvider('OpenAI')).toHaveLength(1);
  });

  it('should detect model changes', () => {
    const existing = {
      provider: 'OpenAI',
      id: 'gpt-4',
      capabilities: ['reasoning'],
      created: 1000
    };

    const updated = {
      provider: 'OpenAI',
      id: 'gpt-4',
      capabilities: ['reasoning', 'code'],
      created: 1000
    };

    expect(db.hasModelChanged(existing, updated)).toBe(true);
    expect(db.hasModelChanged(existing, existing)).toBe(false);
  });
});