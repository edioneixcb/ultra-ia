/**
 * Testes unitários para TestExpectationValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import TestExpectationValidator, { createTestExpectationValidator } from '../../../src/systems/fase3/TestExpectationValidator.js';

describe('TestExpectationValidator', () => {
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

    validator = createTestExpectationValidator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validations).toBeDefined();
      expect(validator.isolationReports).toBeDefined();
    });
  });

  describe('validateExpectationsBeforeWriting', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar expectativas corretas', async () => {
      const test = {
        expectations: {
          returnValue: null,
          output: 'executed'
        }
      };

      const implementation = {
        code: 'function test() { return null; }'
      };

      const result = await validator.validateExpectationsBeforeWriting(test, implementation);

      expect(result).toBeDefined();
      expect(result.actualBehavior).toBeDefined();
    });

    it('deve detectar mismatches', async () => {
      const test = {
        expectations: {
          returnValue: 'expected',
          output: 'expected_output'
        }
      };

      const implementation = {
        code: 'function test() { return "actual"; }'
      };

      const result = await validator.validateExpectationsBeforeWriting(test, implementation);

      expect(result.mismatches).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('ensureTestIsolation', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve analisar isolamento de testes', async () => {
      const testSuite = {
        tests: [
          { name: 'test1', setup: { state: { var1: 'value1' } } },
          { name: 'test2', setup: { state: { var2: 'value2' } } }
        ]
      };

      const result = await validator.ensureTestIsolation(testSuite);

      expect(result).toBeDefined();
      expect(result.dependencies).toBeDefined();
      expect(result.stateLeaks).toBeDefined();
      expect(result.isolationCode).toBeDefined();
    });

    it('deve detectar vazamentos de estado', async () => {
      const testSuite = {
        tests: [
          { name: 'test1', setup: { state: {} }, code: 'global.testVar = "value";' }
        ]
      };

      const result = await validator.ensureTestIsolation(testSuite);

      expect(result.stateLeaks.length).toBeGreaterThan(0);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve executar validação de expectativas', async () => {
      const result = await validator.execute({
        action: 'validateExpectations',
        test: { expectations: {} },
        implementation: { code: 'test' }
      });

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
    });

    it('deve executar isolamento de testes', async () => {
      const result = await validator.execute({
        action: 'ensureIsolation',
        testSuite: { tests: [] }
      });

      expect(result).toBeDefined();
      expect(result.isolated).toBeDefined();
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
        action: 'validateExpectations'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(validator.onValidate(null).valid).toBe(false);
      expect(validator.onValidate({}).valid).toBe(false);
    });
  });
});
