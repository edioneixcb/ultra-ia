/**
 * Testes unitários para MobileGenerator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import MobileGenerator, { createMobileGenerator } from '../../../src/systems/fase7/MobileGenerator.js';

describe('MobileGenerator', () => {
  let generator;
  let mockLogger;
  let mockErrorHandler;
  let mockConfig;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };

    mockErrorHandler = {
      handleError: vi.fn()
    };

    mockConfig = { test: true };

    generator = createMobileGenerator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await generator.initialize();
      expect(generator.generations).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve gerar Expo Screen', async () => {
      const result = await generator.execute({
        action: 'generate',
        type: 'expo-screen',
        parameters: { screenName: 'Home', screenTitle: 'Home' }
      });

      expect(result.code).toBeDefined();
      expect(result.code).toContain('HomeScreen');
    });

    it('deve gerar WatermelonDB Model', async () => {
      const result = await generator.execute({
        action: 'generate',
        type: 'watermelon-model',
        parameters: { modelName: 'User', tableName: 'users' }
      });

      expect(result.code).toBeDefined();
      expect(result.code).toContain('class User');
    });
  });
});
