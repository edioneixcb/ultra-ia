/**
 * Testes unitários para BatchResolver
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import BatchResolver, { createBatchResolver } from '../../../src/systems/fase2/BatchResolver.js';

describe('BatchResolver', () => {
  let resolver;
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

    resolver = createBatchResolver(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await resolver.initialize();
      expect(resolver.batches).toBeDefined();
      expect(resolver.resolutions).toBeDefined();
    });
  });

  describe('groupRelatedErrors', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('deve agrupar erros relacionados por padrão', async () => {
      const errors = [
        { id: 'error1', type: 'syntax', message: 'Syntax error 1' },
        { id: 'error2', type: 'syntax', message: 'Syntax error 2' },
        { id: 'error3', type: 'type', message: 'Type error' }
      ];

      const codebase = { files: {} };
      const groups = await resolver.groupRelatedErrors(errors, codebase);

      expect(groups.length).toBeGreaterThan(0);
      expect(groups[0].errors.length).toBeGreaterThan(1);
    });

    it('deve agrupar erros do mesmo arquivo', async () => {
      const errors = [
        { id: 'error1', file: 'test.js', message: 'Error 1' },
        { id: 'error2', file: 'test.js', message: 'Error 2' }
      ];

      const codebase = { files: {} };
      const groups = await resolver.groupRelatedErrors(errors, codebase);

      expect(groups.length).toBeGreaterThan(0);
    });
  });

  describe('resolveBatch', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('deve resolver grupo de erros', async () => {
      const errorGroup = {
        id: 'group-1',
        errors: [
          { id: 'error1', type: 'syntax' }
        ],
        pattern: 'syntax'
      };

      const codebase = { files: {} };
      const result = await resolver.resolveBatch(errorGroup, codebase);

      expect(result).toBeDefined();
      expect(result.groupId).toBe('group-1');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('deve executar resolução em lote', async () => {
      const errors = [
        { id: 'error1', type: 'syntax' },
        { id: 'error2', type: 'syntax' }
      ];

      const codebase = { files: {} };
      const result = await resolver.execute({ errors, codebase });

      expect(result.totalErrors).toBe(2);
      expect(result.groups).toBeGreaterThan(0);
    });

    it('deve lançar erro se errors não fornecido', async () => {
      await expect(
        resolver.execute({ codebase: {} })
      ).rejects.toThrow('errors é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = resolver.onValidate({
        errors: [],
        codebase: {}
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(resolver.onValidate(null).valid).toBe(false);
      expect(resolver.onValidate({}).valid).toBe(false);
    });
  });
});
