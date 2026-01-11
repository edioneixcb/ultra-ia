/**
 * Testes unitários para PatternDocumentationSystem
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import PatternDocumentationSystem, { createPatternDocumentationSystem } from '../../../src/systems/fase4/PatternDocumentationSystem.js';

describe('PatternDocumentationSystem', () => {
  let system;
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

    system = createPatternDocumentationSystem(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await system.initialize();
      expect(system.patterns).toBeDefined();
      expect(system.practices).toBeDefined();
      expect(system.antiPatterns).toBeDefined();
    });
  });

  describe('documentPattern', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve documentar padrão', async () => {
      const pattern = {
        name: 'Repository Pattern',
        type: 'architecture',
        description: 'Pattern for data access'
      };

      const result = await system.documentPattern(pattern);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Repository Pattern');
      expect(result.category).toBe('architecture');
    });
  });

  describe('documentPractice', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve documentar prática', async () => {
      const practice = {
        name: 'Clean Code',
        domain: 'general',
        description: 'Best practices for clean code'
      };

      const result = await system.documentPractice(practice);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Clean Code');
    });
  });

  describe('documentAntiPattern', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve documentar anti-padrão', async () => {
      const antiPattern = {
        name: 'God Object',
        description: 'Anti-pattern: object with too many responsibilities',
        alternatives: ['Single Responsibility Principle']
      };

      const result = await system.documentAntiPattern(antiPattern);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('God Object');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve executar documentação de padrão', async () => {
      const result = await system.execute({
        action: 'documentPattern',
        pattern: {
          name: 'Test Pattern',
          description: 'Test'
        }
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('deve lançar erro se action não fornecido', async () => {
      await expect(
        system.execute({})
      ).rejects.toThrow('action é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = system.onValidate({
        action: 'documentPattern'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(system.onValidate(null).valid).toBe(false);
      expect(system.onValidate({}).valid).toBe(false);
    });
  });
});
