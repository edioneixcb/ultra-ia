/**
 * Testes unitários para IncrementalCodeGenerator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import IncrementalCodeGenerator, { createIncrementalCodeGenerator } from '../../../src/systems/fase8/IncrementalCodeGenerator.js';

describe('IncrementalCodeGenerator', () => {
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

    generator = createIncrementalCodeGenerator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await generator.initialize();
      expect(generator.generations).toBeDefined();
      expect(generator.parts).toBeDefined();
    });
  });

  describe('generateIncremental', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve gerar código incrementalmente', async () => {
      const result = await generator.generateIncremental('test-template', {
        className: 'TestClass'
      }, {});

      expect(result).toBeDefined();
      expect(result.complete).toBe(true);
      expect(result.parts).toBeDefined();
      expect(result.code).toBeDefined();
    });

    it('deve validar cada parte gerada', async () => {
      const result = await generator.generateIncremental('test-template', {}, {});

      expect(result.validations.length).toBeGreaterThan(0);
      expect(result.validations.every(v => v !== undefined)).toBe(true);
    });
  });

  describe('refineCode', () => {
    beforeEach(async () => {
      await generator.initialize();
      // Criar geração inicial
      await generator.generateIncremental('test-template', {}, {});
    });

    it('deve refinar código gerado', async () => {
      const generations = Array.from(generator.generations.values());
      if (generations.length > 0) {
        const generationId = generations[0].id;
        const result = await generator.refineCode(generationId, {});

        expect(result).toBeDefined();
        expect(result.refined).toBeDefined();
      }
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve executar geração incremental', async () => {
      const result = await generator.execute({
        action: 'generate',
        template: 'test-template',
        parameters: {}
      });

      expect(result).toBeDefined();
      expect(result.complete).toBeDefined();
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
  });
});
