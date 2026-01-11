/**
 * Testes unitários para TraceabilityMatrixManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import TraceabilityMatrixManager, { createTraceabilityMatrixManager } from '../../../src/systems/fase1/TraceabilityMatrixManager.js';

describe('TraceabilityMatrixManager', () => {
  let manager;
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

    manager = createTraceabilityMatrixManager(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await manager.initialize();
      expect(manager.matrices).toBeDefined();
    });
  });

  describe('createMatrix', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve criar matriz de rastreabilidade', async () => {
      const checks = [
        {
          id: 'req-1',
          artifact: './src/Component.js',
          test: 'Component.test.js',
          evidence: 'Test passed'
        }
      ];

      const result = await manager.execute({
        checks,
        action: 'create'
      });

      expect(result.id).toBeDefined();
      expect(result.matrix.length).toBe(1);
      expect(result.matrix[0].requisito).toBe('req-1');
    });

    it('deve usar matrixId fornecido', async () => {
      const checks = [{ id: 'req-1', artifact: 'test', test: 'test', evidence: 'test' }];

      const result = await manager.execute({
        checks,
        action: 'create',
        matrixId: 'custom-matrix'
      });

      expect(result.id).toBe('custom-matrix');
    });
  });

  describe('validateMatrix', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve validar matriz completa', async () => {
      const checks = [
        {
          id: 'req-1',
          artifact: './src/index.js',
          test: 'index.test.js',
          evidence: 'Test passed'
        }
      ];

      await manager.execute({
        checks,
        action: 'create',
        matrixId: 'matrix-1'
      });

      const result = await manager.execute({
        matrixId: 'matrix-1',
        action: 'validate'
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('totalRows');
    });

    it('deve detectar campos faltando', async () => {
      const matrix = {
        matrix: [
          {
            requisito: 'req-1',
            artefato: null,
            teste: 'test',
            evidencia: 'evidence'
          }
        ]
      };

      const result = await manager.execute({
        matrix,
        action: 'validate'
      });

      expect(result.validations.length).toBeGreaterThan(0);
      expect(result.validations[0].errors.some(e => e.type === 'missing_fields')).toBe(true);
    });
  });

  describe('getMatrix', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve retornar null se matriz não existe', () => {
      expect(manager.getMatrix('missing')).toBeNull();
    });

    it('deve retornar matriz existente', async () => {
      const checks = [{ id: 'req-1', artifact: 'test', test: 'test', evidence: 'test' }];

      await manager.execute({
        checks,
        action: 'create',
        matrixId: 'matrix-1'
      });

      const matrix = await manager.execute({
        matrixId: 'matrix-1',
        action: 'get'
      });

      expect(matrix).toBeDefined();
      expect(matrix.id).toBe('matrix-1');
    });
  });

  describe('listMatrices', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve listar todas as matrizes', async () => {
      await manager.execute({
        checks: [{ id: 'req-1', artifact: 'test', test: 'test', evidence: 'test' }],
        action: 'create',
        matrixId: 'matrix-1'
      });

      await manager.execute({
        checks: [{ id: 'req-2', artifact: 'test', test: 'test', evidence: 'test' }],
        action: 'create',
        matrixId: 'matrix-2'
      });

      const list = manager.listMatrices();
      expect(list.length).toBe(2);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve lançar erro se checks não fornecido para create', async () => {
      await expect(
        manager.execute({ action: 'create' })
      ).rejects.toThrow('checks é obrigatório');
    });

    it('deve lançar erro se matrix/matrixId não fornecido para validate', async () => {
      await expect(
        manager.execute({ action: 'validate' })
      ).rejects.toThrow('matrix ou matrixId é obrigatório');
    });

    it('deve lançar erro se matrixId não fornecido para get', async () => {
      await expect(
        manager.execute({ action: 'get' })
      ).rejects.toThrow('matrixId é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = manager.onValidate({
        action: 'create',
        checks: []
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(manager.onValidate(null).valid).toBe(false);
      expect(manager.onValidate({}).valid).toBe(false);
    });
  });
});
