/**
 * Testes unitários para MultiLayerValidatorEnhanced
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import MultiLayerValidatorEnhanced, { createMultiLayerValidatorEnhanced } from '../../../src/systems/fase8/MultiLayerValidatorEnhanced.js';

describe('MultiLayerValidatorEnhanced', () => {
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

    validator = createMultiLayerValidatorEnhanced(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validations).toBeDefined();
      expect(validator.feedbackHistory).toBeDefined();
    });
  });

  describe('validateMultiLayer', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar código em múltiplas camadas', async () => {
      const code = 'class Test { }';
      const result = await validator.validateMultiLayer(code, ['syntax', 'structure']);

      expect(result).toBeDefined();
      expect(result.layers).toBeDefined();
      expect(result.layers.length).toBe(2);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve executar validação multi-camada', async () => {
      const result = await validator.execute({
        action: 'validate',
        code: 'class Test { }'
      });

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
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
