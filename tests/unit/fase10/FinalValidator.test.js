/**
 * Testes unitários para FinalValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import FinalValidator, { createFinalValidator } from '../../../src/systems/fase10/FinalValidator.js';

describe('FinalValidator', () => {
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

    validator = createFinalValidator(mockConfig, mockLogger, mockErrorHandler);
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

    it('deve executar validação completa', async () => {
      const result = await validator.execute({
        action: 'validate'
      });

      expect(result).toBeDefined();
      expect(result.validations).toBeDefined();
      expect(result.overallScore).toBeDefined();
    });

    it('deve lançar erro se action não fornecido', async () => {
      await expect(
        validator.execute({})
      ).rejects.toThrow('action é obrigatório');
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
