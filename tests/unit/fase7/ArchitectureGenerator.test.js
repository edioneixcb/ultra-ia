/**
 * Testes unitários para ArchitectureGenerator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ArchitectureGenerator, { createArchitectureGenerator } from '../../../src/systems/fase7/ArchitectureGenerator.js';

describe('ArchitectureGenerator', () => {
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

    generator = createArchitectureGenerator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await generator.initialize();
      expect(generator.generations).toBeDefined();
    });
  });

  describe('generateDomainEntity', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve gerar Domain Entity', async () => {
      const code = await generator.generateDomainEntity({
        entityName: 'User',
        properties: [
          { name: 'id', defaultValue: null },
          { name: 'name', defaultValue: '' }
        ],
        validations: [
          { field: 'name', message: 'Name is required' }
        ]
      }, {});

      expect(code).toBeDefined();
      expect(code).toContain('class User');
      expect(code).toContain('validate()');
    });

    it('deve lançar erro se entityName não fornecido', async () => {
      await expect(
        generator.generateDomainEntity({}, {})
      ).rejects.toThrow('entityName é obrigatório');
    });
  });

  describe('generateUseCase', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve gerar Use Case', async () => {
      const code = await generator.generateUseCase({
        useCaseName: 'CreateUser',
        repositoryName: 'User',
        validations: [
          { field: 'name', message: 'Name is required' }
        ]
      }, {});

      expect(code).toBeDefined();
      expect(code).toContain('CreateUserUseCase');
      expect(code).toContain('execute');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve executar geração de código', async () => {
      const result = await generator.execute({
        action: 'generate',
        type: 'domain-entity',
        parameters: {
          entityName: 'User',
          properties: []
        }
      });

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.type).toBe('domain-entity');
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
