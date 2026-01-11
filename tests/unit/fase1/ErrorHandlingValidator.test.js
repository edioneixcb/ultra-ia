/**
 * Testes unitários para ErrorHandlingValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ErrorHandlingValidator, { createErrorHandlingValidator } from '../../../src/systems/fase1/ErrorHandlingValidator.js';

describe('ErrorHandlingValidator', () => {
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

    validator = createErrorHandlingValidator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validations).toBeDefined();
    });
  });

  describe('detectEmptyCatches', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve detectar catch vazio', () => {
      const code = 'try { } catch (e) {}';
      const issues = validator.detectEmptyCatches(code);

      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].type).toBe('empty_catch');
      expect(issues[0].severity).toBe('high');
    });

    it('deve retornar array vazio se nenhum catch vazio', () => {
      const code = 'try { } catch (e) { console.log(e); }';
      const issues = validator.detectEmptyCatches(code);

      expect(issues).toEqual([]);
    });
  });

  describe('detectConsoleLogs', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve detectar console.log', () => {
      const code = 'console.log("test");';
      const issues = validator.detectConsoleLogs(code);

      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].type).toBe('console_usage');
      expect(issues[0].method).toBe('log');
    });

    it('deve detectar console.error', () => {
      const code = 'console.error("error");';
      const issues = validator.detectConsoleLogs(code);

      expect(issues.some(i => i.method === 'error')).toBe(true);
    });
  });

  describe('detectMissingErrorHandling', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve detectar falta de tratamento em código assíncrono', () => {
      const code = 'async function test() { await fetchData(); }';
      const issues = validator.detectMissingErrorHandling(code);

      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(i => i.type === 'missing_error_handling')).toBe(true);
    });

    it('não deve detectar se há try-catch', () => {
      const code = 'async function test() { try { await fetchData(); } catch (e) {} }';
      const issues = validator.detectMissingErrorHandling(code);

      expect(issues.length).toBe(0);
    });
  });

  describe('validate', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar código válido', () => {
      const code = 'function test() { return true; }';
      const result = validator.validate(code);

      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('deve detectar múltiplos problemas', () => {
      const code = 'try { } catch (e) {} console.log("test");';
      const result = validator.validate(code);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(1);
    });

    it('deve gerar sugestões', () => {
      const code = 'try { } catch (e) {}';
      const result = validator.validate(code);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0].example).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve executar validação completa', async () => {
      const code = 'try { } catch (e) {}';
      const result = await validator.execute({ code });

      expect(result.valid).toBe(false);
      expect(result.issues).toBeDefined();
    });

    it('deve lançar erro se code não fornecido', async () => {
      await expect(
        validator.execute({})
      ).rejects.toThrow('code é obrigatório');
    });
  });

  describe('validate (context validation)', () => {
    it('deve validar contexto válido', () => {
      const result = validator.onValidate({
        code: 'const test = "code";'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(validator.onValidate(null).valid).toBe(false);
      expect(validator.onValidate({}).valid).toBe(false);
    });
  });
});
