/**
 * Testes unitários para CrossPlatformValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import CrossPlatformValidator, { createCrossPlatformValidator } from '../../../src/systems/fase9/CrossPlatformValidator.js';

describe('CrossPlatformValidator', () => {
  let validator;
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

    validator = createCrossPlatformValidator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validations).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar código cross-platform', async () => {
      const result = await validator.execute({
        action: 'validate',
        code: 'const x = 1;',
        platforms: ['windows', 'linux']
      });

      expect(result).toBeDefined();
      expect(result.platforms).toBeDefined();
      expect(result.platforms.length).toBe(2);
    });

    it('deve detectar problemas cross-platform', async () => {
      const result = await validator.execute({
        action: 'validate',
        code: 'const path = "/tmp/file";',
        platforms: ['windows']
      });

      expect(result).toBeDefined();
      expect(result.crossPlatformIssues).toBeDefined();
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = validator.onValidate({
        action: 'validate'
      });
      expect(result.valid).toBe(true);
    });
  });
});
