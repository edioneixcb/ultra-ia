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

  describe('casos extremos', () => {
    beforeEach(async () => {
      await calculator.initialize();
    });

    it('deve lidar com array vazio', () => {
      const result = calculator.calculateScore([]);
      expect(result.score).toBe(0);
      expect(result.applicable).toBe(0);
      expect(result.passing).toBe(0);
      expect(result.total).toBe(0);
    });

    it('deve calcular score correto com precisão decimal', () => {
      const checks = [
        { id: 'check1', status: 'OK' },
        { id: 'check2', status: 'OK' },
        { id: 'check3', status: 'OK' },
        { id: 'check4', status: 'FALHOU' },
        { id: 'check5', status: 'FALHOU' },
        { id: 'check6', status: 'FALHOU' },
        { id: 'check7', status: 'FALHOU' }
      ];

      const result = calculator.calculateScore(checks);
      // 3 passando / 7 aplicáveis = 42.857142... → 42.86 (arredondado)
      expect(result.score).toBe(42.86);
      expect(result.passing).toBe(3);
      expect(result.applicable).toBe(7);
    });

    it('deve retornar score 100 quando todos passam', () => {
      const checks = [
        { id: 'check1', status: 'OK' },
        { id: 'check2', status: 'PASS' },
        { id: 'check3', status: 'OK' }
      ];

      const result = calculator.calculateScore(checks);
      expect(result.score).toBe(100);
      expect(result.passing).toBe(3);
      expect(result.applicable).toBe(3);
    });

    it('deve retornar score 0 quando nenhum passa (sem bloqueadores)', () => {
      const checks = [
        { id: 'check1', status: 'FALHOU' },
        { id: 'check2', status: 'FAIL' },
        { id: 'check3', status: 'FAILED' }
      ];

      const result = calculator.calculateScore(checks);
      expect(result.score).toBe(0);
      expect(result.passing).toBe(0);
      expect(result.applicable).toBe(3);
    });

    it('deve lidar com múltiplos bloqueadores falhando', () => {
      const checks = [
        { id: 'check1', status: 'OK' },
        { id: 'check2', status: 'FALHOU', severity: 'BLOQUEADOR' },
        { id: 'check3', status: 'FAIL', severity: 'BLOCKER' },
        { id: 'check4', status: 'OK' }
      ];

      const result = calculator.calculateScore(checks);
      expect(result.score).toBe(0);
      expect(result.reason).toBe('Bloqueadores falhando');
      expect(result.blockingFailed.length).toBe(2);
    });

    it('deve ignorar bloqueadores que passam', () => {
      const checks = [
        { id: 'check1', status: 'OK' },
        { id: 'check2', status: 'OK', severity: 'BLOQUEADOR' },
        { id: 'check3', status: 'FALHOU' }
      ];

      const result = calculator.calculateScore(checks);
      // Score = 2/3 = 66.67% (check1 e check2 passam, check3 falha - todos são aplicáveis)
      // Bloqueadores que passam não causam bloqueio, apenas bloqueadores falhando
      expect(result.score).toBe(66.67);
      expect(result.blockingFailed).toBeUndefined();
      expect(result.passing).toBe(2);
      expect(result.applicable).toBe(3);
    });

    it('deve validar N/A com evidência como objeto', () => {
      const checks = [
        { id: 'check1', status: 'OK' },
        { id: 'check2', status: 'N/A', justification: 'Justificativa', evidence: { type: 'documentation', url: 'http://example.com' } },
        { id: 'check3', status: 'N/A', justification: 'Justificativa', evidence: '' } // Evidência vazia
      ];

      const result = calculator.calculateScore(checks);
      expect(result.naValid).toBe(1);
      expect(result.naInvalid).toBe(1);
      expect(result.applicable).toBe(1);
    });

    it('deve rejeitar N/A com justificativa vazia (apenas espaços)', () => {
      const check = {
        status: 'N/A',
        justification: '   ',
        evidence: 'Evidência válida'
      };

      expect(calculator.validateNA(check)).toBe(false);
    });

    it('deve rejeitar N/A com evidência vazia (apenas espaços)', () => {
      const check = {
        status: 'N/A',
        justification: 'Justificativa válida',
        evidence: '   '
      };

      expect(calculator.validateNA(check)).toBe(false);
    });

    it('deve rejeitar N/A com evidência como objeto vazio', () => {
      const check = {
        status: 'N/A',
        justification: 'Justificativa válida',
        evidence: {}
      };

      expect(calculator.validateNA(check)).toBe(false);
    });

    it('deve calcular score correto com mistura de N/A válidos e inválidos', () => {
      const checks = [
        { id: 'check1', status: 'OK' },
        { id: 'check2', status: 'OK' },
        { id: 'check3', status: 'FALHOU' },
        { id: 'check4', status: 'N/A', justification: 'Válido', evidence: 'Evidência' },
        { id: 'check5', status: 'N/A' }, // Inválido
        { id: 'check6', status: 'N/A', justification: 'Válido', evidence: { data: 'test' } }
      ];

      const result = calculator.calculateScore(checks);
      // Aplicáveis: check1, check2, check3 (N/A válidos não contam)
      // Passando: check1, check2
      // Score = 2/3 = 66.67
      expect(result.score).toBe(66.67);
      expect(result.applicable).toBe(3);
      expect(result.passing).toBe(2);
      expect(result.naValid).toBe(2);
      expect(result.naInvalid).toBe(1);
    });

    it('deve validar fórmula matemática exata: S = (Passing / Applicable) × 100', () => {
      // Teste com valores conhecidos para validar fórmula
      const checks = [
        { id: 'check1', status: 'OK' },
        { id: 'check2', status: 'OK' },
        { id: 'check3', status: 'OK' },
        { id: 'check4', status: 'FALHOU' }
      ];

      const result = calculator.calculateScore(checks);
      const expectedScore = (3 / 4) * 100; // 75.0
      expect(result.score).toBe(expectedScore);
      expect(result.passing).toBe(3);
      expect(result.applicable).toBe(4);
    });

    it('deve arredondar corretamente para 2 casas decimais', () => {
      const checks = [];
      // Criar 33 checks: 1 passando, 32 falhando
      for (let i = 0; i < 33; i++) {
        checks.push({
          id: `check${i}`,
          status: i === 0 ? 'OK' : 'FALHOU'
        });
      }

      const result = calculator.calculateScore(checks);
      // 1/33 = 0.030303... × 100 = 3.0303... → 3.03
      expect(result.score).toBe(3.03);
      expect(result.passing).toBe(1);
      expect(result.applicable).toBe(33);
    });

    it('deve incluir breakdown completo no resultado', () => {
      const checks = [
        { id: 'check1', status: 'OK' },
        { id: 'check2', status: 'FALHOU' },
        { id: 'check3', status: 'N/A', justification: 'Just', evidence: 'Ev' }
      ];

      const result = calculator.calculateScore(checks);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.passing).toBe(1);
      expect(result.breakdown.failing).toBe(1);
      expect(result.breakdown.na).toBe(1);
      expect(result.breakdown.naValid).toBe(1);
      expect(result.breakdown.naInvalid).toBe(0);
    });
  });
});
