/**
 * Testes unitários para InlineValidatedCodeGenerator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import InlineValidatedCodeGenerator, { createInlineValidatedCodeGenerator } from '../../../src/systems/fase1/InlineValidatedCodeGenerator.js';

describe('InlineValidatedCodeGenerator', () => {
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

    mockConfig = {
      validation: {
        maxIterations: 10
      }
    };

    generator = createInlineValidatedCodeGenerator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await generator.initialize();
      expect(generator.generatedCode).toBeDefined();
      expect(generator.maxIterations).toBe(10);
    });
  });

  describe('generateCode', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve gerar código a partir de string template', async () => {
      const template = 'const test = "code";';
      const code = await generator.generateCode(template, {});

      expect(code).toBe(template);
    });

    it('deve gerar código a partir de objeto template', async () => {
      const template = { code: 'const test = "code";' };
      const code = await generator.generateCode(template, {});

      expect(code).toBe('const test = "code";');
    });

    it('deve retornar string vazia para template inválido', async () => {
      const code = await generator.generateCode({}, {});

      expect(code).toBe('');
    });
  });

  describe('validateSyntax', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve validar código com sintaxe correta', () => {
      const code = 'function test() { return true; }';
      const errors = generator.validateSyntax(code);

      expect(errors.length).toBe(0);
    });

    it('deve detectar parênteses não balanceados', () => {
      const code = 'function test( { return true; }';
      const errors = generator.validateSyntax(code);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('Parênteses'))).toBe(true);
    });

    it('deve detectar chaves não balanceadas', () => {
      const code = 'function test() { return true;';
      const errors = generator.validateSyntax(code);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('Chaves'))).toBe(true);
    });
  });

  describe('validatePatterns', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve detectar catch vazio', async () => {
      const code = 'try { } catch (e) {}';
      const errors = await generator.validatePatterns(code);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('Catch block vazio'))).toBe(true);
    });

    it('deve detectar console.log', async () => {
      const code = 'console.log("test");';
      const errors = await generator.validatePatterns(code);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('console'))).toBe(true);
    });

    it('deve retornar array vazio para código limpo', async () => {
      const code = 'function test() { return true; }';
      const errors = await generator.validatePatterns(code);

      expect(errors).toEqual([]);
    });
  });

  describe('validateTypeSafety', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve detectar uso de any', () => {
      const code = 'function test(param: any) { return param; }';
      const errors = generator.validateTypeSafety(code);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('any'))).toBe(true);
    });

    it('deve retornar array vazio se nenhum any encontrado', () => {
      const code = 'function test(param: string) { return param; }';
      const errors = generator.validateTypeSafety(code);

      expect(errors).toEqual([]);
    });
  });

  describe('validateSecurity', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve detectar password hardcoded', () => {
      const code = 'const password = "secret123";';
      const warnings = generator.validateSecurity(code);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.type === 'security')).toBe(true);
    });

    it('deve detectar apiKey hardcoded', () => {
      const code = 'const apiKey = "sk-123456";';
      const warnings = generator.validateSecurity(code);

      expect(warnings.length).toBeGreaterThan(0);
    });

    it('deve retornar array vazio para código seguro', () => {
      const code = 'const value = process.env.API_KEY;';
      const warnings = generator.validateSecurity(code);

      expect(warnings).toEqual([]);
    });
  });

  describe('autoCorrect', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve corrigir catch vazio', async () => {
      const code = 'try { } catch (e) {}';
      const errors = [
        {
          type: 'pattern',
          message: 'Catch block vazio detectado',
          fix: 'Adicionar tratamento de erro'
        }
      ];

      const corrected = await generator.autoCorrect(code, errors, {});

      expect(corrected).not.toContain('catch (e) {}');
      expect(corrected).toContain('catch');
    });

    it('deve corrigir console.log', async () => {
      const code = 'console.log("test");';
      const errors = [
        {
          type: 'pattern',
          message: 'Uso de console detectado',
          fix: 'Substituir por logger'
        }
      ];

      const corrected = await generator.autoCorrect(code, errors, {});

      expect(corrected).toContain('this.logger');
      expect(corrected).not.toContain('console.log');
    });

    it('deve corrigir uso de any', async () => {
      const code = 'function test(param: any) { }';
      const errors = [
        {
          type: 'type',
          message: 'Uso de any detectado',
          fix: 'Especificar tipo'
        }
      ];

      const corrected = await generator.autoCorrect(code, errors, {});

      expect(corrected).toContain(': unknown');
      expect(corrected).not.toContain(': any');
    });
  });

  describe('protectCriticalCode', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve proteger secrets hardcoded', async () => {
      const code = 'const apiKey = "sk-123456";';
      const secured = await generator.protectCriticalCode(code, {});

      expect(secured).not.toContain('sk-123456');
      expect(secured).toContain('SECURED');
    });
  });

  describe('validateInline', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve validar código válido', async () => {
      const code = 'function test() { return true; }';
      const validation = await generator.validateInline(code, {});

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('deve detectar múltiplos tipos de erros', async () => {
      const code = `
        try {
          console.log("test");
        } catch (e) {}
        function test(param: any) { }
      `;

      const validation = await generator.validateInline(code, {});

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('generateWithInlineValidation', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve gerar código válido', async () => {
      const template = 'function test() { return true; }';
      const result = await generator.generateWithInlineValidation(template, {});

      expect(result.code).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.iterations).toBeDefined();
    });

    it('deve corrigir código com problemas', async () => {
      const template = 'try { } catch (e) {}';
      const result = await generator.generateWithInlineValidation(template, {});

      expect(result.code).toBeDefined();
      expect(result.iterations).toBeGreaterThan(0);
    });

    it('deve proteger código crítico', async () => {
      const template = 'const apiKey = "secret";';
      const result = await generator.generateWithInlineValidation(template, {});

      expect(result.isProtected).toBe(true);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve gerar código a partir de template', async () => {
      const result = await generator.execute({
        template: 'const test = "code";',
        context: {}
      });

      expect(result.code).toBeDefined();
      expect(result.valid).toBe(true);
    });

    it('deve validar e corrigir código existente', async () => {
      const result = await generator.execute({
        code: 'try { } catch (e) {}',
        context: {}
      });

      expect(result.code).toBeDefined();
      expect(result.iterations).toBeDefined();
    });

    it('deve lançar erro se template e code não fornecidos', async () => {
      await expect(
        generator.execute({ context: {} })
      ).rejects.toThrow('template ou code é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = generator.validate({
        template: 'code'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(generator.validate(null).valid).toBe(false);
      expect(generator.validate({}).valid).toBe(false);
    });
  });
});
