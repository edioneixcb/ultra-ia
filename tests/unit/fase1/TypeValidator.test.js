/**
 * Testes unitários para TypeValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import TypeValidator, { createTypeValidator } from '../../../src/systems/fase1/TypeValidator.js';

describe('TypeValidator', () => {
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

    validator = createTypeValidator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validations).toBeDefined();
    });
  });

  describe('detectAnyUsage', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve detectar any em parâmetro de função', () => {
      const code = 'function test(param: any) { }';
      const usage = validator.detectAnyUsage(code);

      expect(usage.length).toBeGreaterThan(0);
      expect(usage[0].context).toBe('parameter');
      expect(usage[0].variable).toBe('param');
    });

    it('deve detectar any em variável', () => {
      const code = 'const test: any = "value";';
      const usage = validator.detectAnyUsage(code);

      expect(usage.length).toBeGreaterThan(0);
      expect(usage[0].context).toBe('variable');
    });

    it('deve retornar array vazio se nenhum any encontrado', () => {
      const code = 'function test(param: string) { }';
      const usage = validator.detectAnyUsage(code);

      expect(usage).toEqual([]);
    });
  });

  describe('inferTypes', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve inferir tipo string', async () => {
      const code = 'const name = "test";';
      const types = await validator.inferTypes(code);

      expect(types.name).toBe('string');
    });

    it('deve inferir tipo number', async () => {
      const code = 'const count = 123;';
      const types = await validator.inferTypes(code);

      expect(types.count).toBe('number');
    });

    it('deve inferir tipo boolean', async () => {
      const code = 'const enabled = true;';
      const types = await validator.inferTypes(code);

      expect(types.enabled).toBe('boolean');
    });

    it('deve inferir tipo array', async () => {
      const code = 'const items = [];';
      const types = await validator.inferTypes(code);

      expect(types.items).toBe('Array<unknown>');
    });

    it('deve inferir tipo object', async () => {
      const code = 'const obj = {};';
      const types = await validator.inferTypes(code);

      expect(types.obj).toBe('Record<string, unknown>');
    });
  });

  describe('suggestTypeReplacement', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve sugerir substituição para parâmetro', () => {
      const usage = {
        variable: 'param',
        context: 'parameter',
        code: 'function test(param: any)'
      };

      const suggestion = validator.suggestTypeReplacement(usage, 'string');

      expect(suggestion).toContain(': string');
      expect(suggestion).not.toContain(': any');
    });

    it('deve sugerir substituição para variável', () => {
      const usage = {
        variable: 'test',
        context: 'variable',
        code: 'const test: any = "value"'
      };

      const suggestion = validator.suggestTypeReplacement(usage, 'string');

      expect(suggestion).toContain(': string');
    });
  });

  describe('validate e execute', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar código sem any', async () => {
      const code = 'function test(param: string) { }';
      const result = await validator.execute({ code });

      expect(result.valid).toBe(true);
      expect(result.anyUsage.length).toBe(0);
    });

    it('deve invalidar código com any', async () => {
      const code = 'function test(param: any) { }';
      const result = await validator.execute({ code });

      expect(result.valid).toBe(false);
      expect(result.anyUsage.length).toBeGreaterThan(0);
    });

    it('deve gerar sugestões com tipos inferidos', async () => {
      const code = 'const name: any = "test";';
      const result = await validator.execute({ code });

      expect(result.suggestions.length).toBeGreaterThan(0);
      // Tipo inferido pode ser string ou unknown dependendo da ordem de inferência
      expect(['string', 'unknown']).toContain(result.suggestions[0].suggestedType);
    });
  });

  describe('validate (context validation)', () => {
    it('deve validar contexto válido', () => {
      const result = validator.validate({
        code: 'const test = "code";'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(validator.validate(null).valid).toBe(false);
      expect(validator.validate({}).valid).toBe(false);
    });
  });
});
