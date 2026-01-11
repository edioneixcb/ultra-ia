/**
 * Testes unitários para ScoreCalculator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ScoreCalculator, { createScoreCalculator } from '../../../src/systems/fase2/ScoreCalculator.js';

describe('ScoreCalculator', () => {
  let calculator;
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

    calculator = createScoreCalculator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await calculator.initialize();
      expect(calculator.calculations).toBeDefined();
    });
  });

  describe('calculateScore', () => {
    beforeEach(async () => {
      await calculator.initialize();
    });

    it('deve calcular score correto para checks passando', () => {
      const checks = [
        { id: 'check1', status: 'OK' },
        { id: 'check2', status: 'OK' },
        { id: 'check3', status: 'FALHOU' }
      ];

      const result = calculator.calculateScore(checks);

      expect(result.score).toBe(66.67); // 2/3 * 100
      expect(result.passing).toBe(2);
      expect(result.applicable).toBe(3);
    });

    it('deve retornar score 0 se bloqueador falha', () => {
      const checks = [
        { id: 'check1', status: 'OK' },
        { id: 'check2', status: 'FALHOU', severity: 'BLOQUEADOR' }
      ];

      const result = calculator.calculateScore(checks);

      expect(result.score).toBe(0);
      expect(result.reason).toBe('Bloqueadores falhando');
      expect(result.blockingFailed.length).toBe(1);
    });

    it('deve validar N/A corretamente', () => {
      const checks = [
        { id: 'check1', status: 'OK' },
        { id: 'check2', status: 'N/A', justification: 'Justificativa válida', evidence: 'Evidência válida' },
        { id: 'check3', status: 'N/A' } // N/A inválido (sem justificativa/evidência)
      ];

      const result = calculator.calculateScore(checks);

      expect(result.naValid).toBe(1);
      expect(result.naInvalid).toBe(1);
      expect(result.applicable).toBe(1); // Apenas check1 conta
    });

    it('deve retornar score 0 se não há checks aplicáveis', () => {
      const checks = [
        { id: 'check1', status: 'N/A', justification: 'Just', evidence: 'Ev' }
      ];

      const result = calculator.calculateScore(checks);

      expect(result.score).toBe(0);
    });
  });

  describe('validateNA', () => {
    beforeEach(async () => {
      await calculator.initialize();
    });

    it('deve validar N/A com justificativa e evidência', () => {
      const check = {
        status: 'N/A',
        justification: 'Justificativa válida',
        evidence: 'Evidência válida'
      };

      expect(calculator.validateNA(check)).toBe(true);
    });

    it('deve rejeitar N/A sem justificativa', async () => {
      await calculator.initialize();
      const check = {
        status: 'N/A',
        evidence: 'Evidência válida'
      };

      expect(calculator.validateNA(check)).toBe(false);
    });

    it('deve rejeitar N/A sem evidência', async () => {
      await calculator.initialize();
      const check = {
        status: 'N/A',
        justification: 'Justificativa válida'
      };

      expect(calculator.validateNA(check)).toBe(false);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await calculator.initialize();
    });

    it('deve executar cálculo completo', async () => {
      const checks = [
        { id: 'check1', status: 'OK' },
        { id: 'check2', status: 'OK' }
      ];

      const result = await calculator.execute({ checks });

      expect(result.score).toBe(100);
      expect(result.passing).toBe(2);
    });

    it('deve lançar erro se checks não fornecido', async () => {
      await expect(
        calculator.execute({})
      ).rejects.toThrow('checks é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = calculator.onValidate({
        checks: []
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(calculator.onValidate(null).valid).toBe(false);
      expect(calculator.onValidate({}).valid).toBe(false);
    });
  });
});
