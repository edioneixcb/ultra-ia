/**
 * Testes unitários para BaselineManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import BaselineManager, { createBaselineManager } from '../../../src/systems/fase0/BaselineManager.js';

describe('BaselineManager', () => {
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

    manager = createBaselineManager(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await manager.initialize();
      expect(manager.baselines).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve criar baseline completo', async () => {
      const result = await manager.execute({
        systemName: 'test-system',
        options: {}
      });

      expect(result.system).toBe('test-system');
      expect(result.environment).toBeDefined();
      expect(result.dependencies).toBeDefined();
      expect(result.configuration).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('deve lançar erro se systemName não fornecido', async () => {
      await expect(
        manager.execute({})
      ).rejects.toThrow('systemName é obrigatório');
    });

    it('deve detectar ambiente', async () => {
      const result = await manager.execute({
        systemName: 'test',
        options: {}
      });

      expect(result.environment.os).toBeDefined();
      expect(result.environment.runtime).toBeDefined();
      expect(result.environment.buildTools).toBeDefined();
      expect(result.environment.ide).toBeDefined();
    });

    it('deve detectar dependências', async () => {
      const result = await manager.execute({
        systemName: 'test',
        options: {}
      });

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies.external).toBeDefined();
    });

    it('deve detectar configurações', async () => {
      const result = await manager.execute({
        systemName: 'test',
        options: {}
      });

      expect(result.configuration).toBeDefined();
      expect(result.configuration.envVars).toBeDefined();
      expect(result.configuration.secrets).toBeDefined();
      expect(result.configuration.certificates).toBeDefined();
    });
  });

  describe('getBaseline', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve retornar null se baseline não existe', () => {
      expect(manager.getBaseline('missing')).toBeNull();
    });

    it('deve retornar baseline criado', async () => {
      await manager.execute({ systemName: 'test' });
      const baseline = manager.getBaseline('test');
      expect(baseline).toBeDefined();
      expect(baseline.system).toBe('test');
    });
  });

  describe('listBaselines', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve retornar lista vazia inicialmente', () => {
      expect(manager.listBaselines()).toEqual([]);
    });

    it('deve retornar lista de sistemas com baseline', async () => {
      await manager.execute({ systemName: 'system1' });
      await manager.execute({ systemName: 'system2' });

      const list = manager.listBaselines();
      expect(list).toContain('system1');
      expect(list).toContain('system2');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = manager.validate({
        systemName: 'test',
        options: {}
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(manager.validate(null).valid).toBe(false);
      expect(manager.validate({}).valid).toBe(false);
      expect(manager.validate({ systemName: 123 }).valid).toBe(false);
    });
  });
});
