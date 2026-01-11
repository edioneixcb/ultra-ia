/**
 * Testes unitários para LoggingValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import LoggingValidator, { createLoggingValidator } from '../../../src/systems/fase1/LoggingValidator.js';

describe('LoggingValidator', () => {
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

    validator = createLoggingValidator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validations).toBeDefined();
    });
  });

  describe('detectConsoleUsage', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve detectar console.log', () => {
      const code = 'console.log("test");';
      const usage = validator.detectConsoleUsage(code);

      expect(usage.length).toBeGreaterThan(0);
      expect(usage[0].method).toBe('log');
    });

    it('deve detectar console.error', () => {
      const code = 'console.error("error");';
      const usage = validator.detectConsoleUsage(code);

      expect(usage.some(u => u.method === 'error')).toBe(true);
      expect(usage.find(u => u.method === 'error').severity).toBe('high');
    });

    it('deve retornar array vazio se nenhum console usado', () => {
      const code = 'this.logger?.info("test");';
      const usage = validator.detectConsoleUsage(code);

      expect(usage).toEqual([]);
    });
  });

  describe('detectLoggerUsage', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve detectar uso de logger', () => {
      const code = 'this.logger?.info("test");';
      const usage = validator.detectLoggerUsage(code);

      expect(usage.length).toBeGreaterThan(0);
      expect(usage[0].method).toBe('info');
    });

    it('deve retornar array vazio se nenhum logger usado', () => {
      const code = 'console.log("test");';
      const usage = validator.detectLoggerUsage(code);

      expect(usage).toEqual([]);
    });
  });

  describe('suggestLoggerReplacement', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve sugerir substituição para console.log', () => {
      const usage = {
        method: 'log',
        args: '"test"'
      };

      const suggestion = validator.suggestLoggerReplacement(usage);

      expect(suggestion).toContain('this.logger');
      expect(suggestion).toContain('info');
    });

    it('deve sugerir substituição para console.error', () => {
      const usage = {
        method: 'error',
        args: '"error"'
      };

      const suggestion = validator.suggestLoggerReplacement(usage);

      expect(suggestion).toContain('error');
    });
  });

  describe('validate', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar código sem console', () => {
      const code = 'this.logger?.info("test");';
      const result = validator.validate(code);

      expect(result.valid).toBe(true);
      expect(result.consoleUsage.length).toBe(0);
    });

    it('deve invalidar código com console', () => {
      const code = 'console.log("test");';
      const result = validator.validate(code);

      expect(result.valid).toBe(false);
      expect(result.consoleUsage.length).toBeGreaterThan(0);
    });

    it('deve gerar sugestões', () => {
      const code = 'console.log("test");';
      const result = validator.validate(code);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0].replacement).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve executar validação completa', async () => {
      const code = 'console.log("test");';
      const result = await validator.execute({ code });

      expect(result.valid).toBe(false);
      expect(result.consoleUsage).toBeDefined();
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
      expect(validator.onValidate({ code: 123 }).valid).toBe(false);
    });
  });
});
