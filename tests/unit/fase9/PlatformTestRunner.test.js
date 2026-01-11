/**
 * Testes unitários para PlatformTestRunner
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import PlatformTestRunner, { createPlatformTestRunner } from '../../../src/systems/fase9/PlatformTestRunner.js';

describe('PlatformTestRunner', () => {
  let runner;
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

    runner = createPlatformTestRunner(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await runner.initialize();
      expect(runner.testRuns).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await runner.initialize();
    });

    it('deve executar testes em múltiplas plataformas', async () => {
      const result = await runner.execute({
        action: 'run',
        testFile: 'test.js',
        platforms: ['windows', 'linux']
      });

      expect(result).toBeDefined();
      expect(result.platforms).toBeDefined();
      expect(result.aggregated).toBeDefined();
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = runner.onValidate({
        action: 'run'
      });
      expect(result.valid).toBe(true);
    });
  });
});
