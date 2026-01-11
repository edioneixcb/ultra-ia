/**
 * Testes unitários para TemplateGenerator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import TemplateGenerator, { createTemplateGenerator } from '../../../src/systems/fase4/TemplateGenerator.js';

describe('TemplateGenerator', () => {
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

    mockConfig = { test: true };

    generator = createTemplateGenerator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await generator.initialize();
      expect(generator.templates).toBeDefined();
      expect(generator.generations).toBeDefined();
    });
  });

  describe('generateTemplate', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve gerar template de Repository', async () => {
      const result = await generator.generateTemplate('repository', null, 'architecture', {
        entityName: 'User'
      });

      expect(result.template).toBeDefined();
      expect(result.template.code).toBeDefined();
      expect(result.template.code).toContain('UserRepository');
    });

    it('deve gerar template de Use Case', async () => {
      const result = await generator.generateTemplate('usecase', null, 'architecture', {
        useCaseName: 'CreateUser'
      });

      expect(result.template).toBeDefined();
      expect(result.template.code).toBeDefined();
      expect(result.template.code).toContain('CreateUser');
    });
  });

  describe('customizeTemplate', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve customizar template com parâmetros', async () => {
      const template = {
        code: 'class {{className}} { }',
        type: 'generic'
      };

      const customized = await generator.customizeTemplate(template, {
        className: 'CustomClass'
      });

      expect(customized.code).toContain('CustomClass');
      expect(customized.code).not.toContain('{{className}}');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve executar geração de template', async () => {
      const result = await generator.execute({
        action: 'generate',
        templateType: 'repository',
        parameters: { entityName: 'User' }
      });

      expect(result).toBeDefined();
      expect(result.template).toBeDefined();
    });

    it('deve lançar erro se action não fornecido', async () => {
      await expect(
        generator.execute({})
      ).rejects.toThrow('action é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = generator.onValidate({
        action: 'generate'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(generator.onValidate(null).valid).toBe(false);
      expect(generator.onValidate({}).valid).toBe(false);
    });
  });
});
