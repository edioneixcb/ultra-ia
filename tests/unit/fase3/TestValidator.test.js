/**
 * Testes unitários para TestValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import TestValidator, { createTestValidator } from '../../../src/systems/fase3/TestValidator.js';

describe('TestValidator', () => {
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

    validator = createTestValidator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validations).toBeDefined();
      expect(validator.updates).toBeDefined();
    });
  });

  describe('validateTest', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar teste correto', async () => {
      const test = {
        targetFunction: 'testFunction',
        expectations: { returnValue: 'result' }
      };

      const implementation = {
        code: 'function testFunction() { return "result"; }'
      };

      const result = await validator.validateTest(test, implementation);

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
    });

    it('deve detectar teste que não corresponde à implementação', async () => {
      const test = {
        targetFunction: 'nonExistentFunction',
        expectations: {}
      };

      const implementation = {
        code: 'function otherFunction() { }'
      };

      const result = await validator.validateTest(test, implementation);

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(i => i.type === 'implementation_mismatch')).toBe(true);
    });
  });

  describe('updateTest', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve atualizar teste para nova implementação', async () => {
      const test = {
        targetFunction: 'testFunction',
        expectations: { returnValue: 'old' }
      };

      const newImplementation = {
        code: 'function testFunction() { return "new"; }'
      };

      const result = await validator.updateTest(test, newImplementation);

      expect(result).toBeDefined();
      expect(result.test).toBeDefined();
    });
  });

  describe('validateMocks', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar mocks corretos', async () => {
      const test = {
        mocks: [
          { target: 'function1', returns: 'value1' }
        ]
      };

      const result = await validator.validateMocks(test);

      expect(result.valid).toBe(true);
    });

    it('deve detectar mocks inválidos', async () => {
      const test = {
        mocks: [
          { target: 'function1' } // Sem returns
        ]
      };

      const result = await validator.validateMocks(test);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve executar validação de teste', async () => {
      const result = await validator.execute({
        action: 'validate',
        test: { expectations: {} },
        implementation: { code: 'test' }
      });

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
    });

    it('deve executar atualização de teste', async () => {
      const result = await validator.execute({
        action: 'update',
        test: { expectations: {} },
        implementation: { code: 'test' }
      });

      expect(result).toBeDefined();
      expect(result.test).toBeDefined();
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

    it('deve rejeitar contexto inválido', () => {
      expect(validator.onValidate(null).valid).toBe(false);
      expect(validator.onValidate({}).valid).toBe(false);
    });
  });
});
