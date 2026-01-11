/**
 * Testes unitários para CheckpointManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import CheckpointManager, { createCheckpointManager } from '../../../src/systems/fase0/CheckpointManager.js';

describe('CheckpointManager', () => {
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

    manager = createCheckpointManager(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar checkpoints padrão', async () => {
      await manager.initialize();
      expect(manager.checkpoints.size).toBe(5);
    });
  });

  describe('validateCheckpoint', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve validar checkpoint com dados válidos', async () => {
      const result = await manager.execute({
        checkpointId: 'checkpoint-1',
        data: {
          baseline: { os: 'linux' },
          targets: ['target1'],
          applicableChecks: ['check1']
        },
        action: 'validate'
      });

      expect(result.passed).toBe(true);
      expect(result.blocked).toBe(false);
    });

    it('deve bloquear checkpoint com dados inválidos', async () => {
      const result = await manager.execute({
        checkpointId: 'checkpoint-1',
        data: {},
        action: 'validate'
      });

      expect(result.passed).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('deve lançar erro se checkpoint não encontrado', async () => {
      await expect(
        manager.execute({
          checkpointId: 'missing',
          data: {},
          action: 'validate'
        })
      ).rejects.toThrow('não encontrado');
    });
  });

  describe('enforceCheckpoint', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve lançar erro se checkpoint obrigatório não completado', async () => {
      await expect(
        manager.execute({
          checkpointId: 'checkpoint-1',
          action: 'enforce'
        })
      ).rejects.toThrow('não foi completado');
    });

    it('não deve lançar erro se checkpoint completado', async () => {
      await manager.execute({
        checkpointId: 'checkpoint-1',
        data: {
          baseline: { os: 'linux' },
          targets: ['target1'],
          applicableChecks: ['check1']
        },
        action: 'complete'
      });

      const result = await manager.execute({
        checkpointId: 'checkpoint-1',
        action: 'enforce'
      });

      expect(result.enforced).toBe(true);
    });
  });

  describe('completeCheckpoint', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve completar checkpoint válido', async () => {
      const result = await manager.execute({
        checkpointId: 'checkpoint-1',
        data: {
          baseline: { os: 'linux' },
          targets: ['target1'],
          applicableChecks: ['check1']
        },
        action: 'complete'
      });

      expect(result.completed).toBe(true);
      expect(result.completedAt).toBeDefined();
    });

    it('deve lançar erro se dados inválidos', async () => {
      await expect(
        manager.execute({
          checkpointId: 'checkpoint-1',
          data: {},
          action: 'complete'
        })
      ).rejects.toThrow('não pode ser completado');
    });
  });

  describe('getCheckpoint', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve retornar checkpoint existente', async () => {
      const checkpoint = await manager.execute({
        checkpointId: 'checkpoint-1',
        action: 'get'
      });

      expect(checkpoint).toBeDefined();
      expect(checkpoint.id).toBe('checkpoint-1');
      expect(checkpoint.name).toBe('Scoping e Baseline');
    });

    it('deve retornar null se checkpoint não existe', async () => {
      const checkpoint = await manager.execute({
        checkpointId: 'missing',
        action: 'get'
      });

      expect(checkpoint).toBeNull();
    });
  });

  describe('listCheckpoints', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve listar todos os checkpoints', async () => {
      const list = await manager.execute({
        action: 'list'
      });

      expect(list.length).toBe(5);
      expect(list[0]).toHaveProperty('id');
      expect(list[0]).toHaveProperty('name');
      expect(list[0]).toHaveProperty('required');
      expect(list[0]).toHaveProperty('completed');
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve retornar estatísticas corretas', async () => {
      await manager.execute({
        checkpointId: 'checkpoint-1',
        data: {
          baseline: { os: 'linux' },
          targets: ['target1'],
          applicableChecks: ['check1']
        },
        action: 'complete'
      });

      const stats = manager.getStats();

      expect(stats.total).toBe(5);
      expect(stats.completed).toBe(1);
      expect(stats.required).toBe(5);
      expect(stats.requiredCompleted).toBe(1);
      expect(stats.completionRate).toBe(20);
      expect(stats.requiredCompletionRate).toBe(20);
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = manager.validate({
        action: 'validate',
        checkpointId: 'checkpoint-1',
        data: {}
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(manager.validate(null).valid).toBe(false);
      expect(manager.validate({}).valid).toBe(false);
      expect(manager.validate({ action: 'invalid' }).valid).toBe(false);
    });
  });
});
