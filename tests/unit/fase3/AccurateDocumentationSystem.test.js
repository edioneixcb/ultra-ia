/**
 * Testes unitários para AccurateDocumentationSystem
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import AccurateDocumentationSystem, { createAccurateDocumentationSystem } from '../../../src/systems/fase3/AccurateDocumentationSystem.js';

describe('AccurateDocumentationSystem', () => {
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

    system = createAccurateDocumentationSystem(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await system.initialize();
      expect(system.validations).toBeDefined();
      expect(system.documentationCache).toBeDefined();
      expect(system.traceabilityMap).toBeDefined();
    });
  });

  describe('extractClaims', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve extrair afirmações sobre funções', async () => {
      const documentation = {
        content: 'function testFunction() { }'
      };

      const claims = await system.extractClaims(documentation);

      expect(claims.length).toBeGreaterThan(0);
      expect(claims.some(c => c.type === 'function')).toBe(true);
    });

    it('deve extrair afirmações sobre classes', async () => {
      const documentation = {
        content: 'class TestClass { }'
      };

      const claims = await system.extractClaims(documentation);

      expect(claims.some(c => c.type === 'class')).toBe(true);
    });
  });

  describe('collectDirectEvidence', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve coletar evidências do codebase', async () => {
      const claim = {
        type: 'function',
        name: 'testFunction'
      };

      const codebase = {
        files: {
          'test.js': {
            content: 'function testFunction() { }'
          }
        }
      };

      const evidence = await system.collectDirectEvidence(claim, codebase);

      expect(evidence.found).toBe(true);
      expect(evidence.location).toBe('test.js');
    });

    it('deve retornar não encontrado se função não existe', async () => {
      const claim = {
        type: 'function',
        name: 'nonExistent'
      };

      const codebase = {
        files: {
          'test.js': {
            content: 'function otherFunction() { }'
          }
        }
      };

      const evidence = await system.collectDirectEvidence(claim, codebase);

      expect(evidence.found).toBe(false);
    });
  });

  describe('validateDocumentationWithEvidence', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve validar documentação precisa', async () => {
      const documentation = {
        content: 'function testFunction() { }'
      };

      const codebase = {
        files: {
          'test.js': {
            content: 'function testFunction() { }'
          }
        }
      };

      const result = await system.validateDocumentationWithEvidence(documentation, codebase);

      expect(result).toBeDefined();
      expect(result.accuracyRate).toBeDefined();
      expect(result.validations).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve executar validação de documentação', async () => {
      const result = await system.execute({
        action: 'validate',
        documentation: { content: 'test' },
        codebase: { files: {} }
      });

      expect(result).toBeDefined();
      expect(result.accuracyRate).toBeDefined();
    });

    it('deve executar detecção de documentação desatualizada', async () => {
      const result = await system.execute({
        action: 'detectOutdated',
        documentation: { content: 'test' },
        codebase: { files: {} }
      });

      expect(result).toBeDefined();
      expect(result.isOutdated).toBeDefined();
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
        action: 'validate'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(system.onValidate(null).valid).toBe(false);
      expect(system.onValidate({}).valid).toBe(false);
    });
  });
});
