/**
 * Testes unitários para AntiSkipMechanism
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import AntiSkipMechanism, { createAntiSkipMechanism } from '../../../src/systems/fase0/AntiSkipMechanism.js';

describe('AntiSkipMechanism', () => {
  let mechanism;
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

    mechanism = createAntiSkipMechanism(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await mechanism.initialize();
      expect(mechanism.executedChecks).toBeDefined();
      expect(mechanism.requiredChecks).toBeDefined();
      expect(mechanism.skipAttempts).toBeDefined();
    });
  });

  describe('registerCheck', () => {
    beforeEach(async () => {
      await mechanism.initialize();
    });

    it('deve registrar check obrigatório', async () => {
      const result = await mechanism.execute({
        checkId: 'check-1',
        required: true,
        action: 'register'
      });

      expect(result.registered).toBe(true);
      expect(result.required).toBe(true);
      expect(mechanism.isRequired('check-1')).toBe(true);
    });

    it('deve registrar check opcional', async () => {
      const result = await mechanism.execute({
        checkId: 'check-2',
        required: false,
        action: 'register'
      });

      expect(result.registered).toBe(true);
      expect(result.required).toBe(false);
      expect(mechanism.isRequired('check-2')).toBe(false);
    });
  });

  describe('validateCheckExecution', () => {
    beforeEach(async () => {
      await mechanism.initialize();
    });

    it('deve validar check executado', async () => {
      await mechanism.execute({
        checkId: 'check-1',
        required: true,
        action: 'register'
      });

      await mechanism.execute({
        checkId: 'check-1',
        action: 'markExecuted'
      });

      const result = await mechanism.execute({
        checkId: 'check-1',
        required: true,
        action: 'validate'
      });

      expect(result.valid).toBe(true);
      expect(result.executed).toBe(true);
    });

    it('deve lançar erro se check obrigatório não executado', async () => {
      await mechanism.execute({
        checkId: 'check-1',
        required: true,
        action: 'register'
      });

      await expect(
        mechanism.execute({
          checkId: 'check-1',
          required: true,
          action: 'validate'
        })
      ).rejects.toThrow('não foi executado');
    });
  });

  describe('preventSkip', () => {
    beforeEach(async () => {
      await mechanism.initialize();
    });

    it('deve bloquear skip de check obrigatório não executado', async () => {
      await mechanism.execute({
        checkId: 'check-1',
        required: true,
        action: 'register'
      });

      const result = await mechanism.execute({
        checkId: 'check-1',
        action: 'preventSkip'
      });

      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('obrigatório');
    });

    it('não deve bloquear check opcional', async () => {
      const result = await mechanism.execute({
        checkId: 'check-2',
        action: 'preventSkip'
      });

      expect(result.blocked).toBe(false);
    });

    it('não deve bloquear check obrigatório já executado', async () => {
      await mechanism.execute({
        checkId: 'check-1',
        required: true,
        action: 'register'
      });

      await mechanism.execute({
        checkId: 'check-1',
        action: 'markExecuted'
      });

      const result = await mechanism.execute({
        checkId: 'check-1',
        action: 'preventSkip'
      });

      expect(result.blocked).toBe(false);
    });
  });

  describe('markExecuted', () => {
    beforeEach(async () => {
      await mechanism.initialize();
    });

    it('deve marcar check como executado', async () => {
      const result = await mechanism.execute({
        checkId: 'check-1',
        action: 'markExecuted'
      });

      expect(result.marked).toBe(true);
      expect(mechanism.wasExecuted('check-1')).toBe(true);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await mechanism.initialize();
    });

    it('deve retornar estatísticas corretas', async () => {
      await mechanism.execute({ checkId: 'check-1', required: true, action: 'register' });
      await mechanism.execute({ checkId: 'check-2', required: true, action: 'register' });
      await mechanism.execute({ checkId: 'check-1', action: 'markExecuted' });

      const stats = mechanism.getStats();

      expect(stats.totalRequired).toBe(2);
      expect(stats.totalExecuted).toBe(1);
      expect(stats.requiredNotExecuted).toBe(1);
      expect(stats.complianceRate).toBe(50);
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = mechanism.validate({
        checkId: 'check-1',
        action: 'register'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(mechanism.validate(null).valid).toBe(false);
      expect(mechanism.validate({}).valid).toBe(false);
      expect(mechanism.validate({ checkId: 'test' }).valid).toBe(false);
      expect(mechanism.validate({ checkId: 'test', action: 'invalid' }).valid).toBe(false);
    });
  });
});
