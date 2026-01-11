/**
 * Testes unitários para CoverageCalculator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import CoverageCalculator, { createCoverageCalculator } from '../../../src/systems/fase2/CoverageCalculator.js';

describe('CoverageCalculator', () => {
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

    calculator = createCoverageCalculator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await calculator.initialize();
      expect(calculator.calculations).toBeDefined();
      expect(calculator.universeOfFailures).toBeDefined();
      expect(calculator.checkToFailures).toBeDefined();
    });
  });

  describe('calculateCoverageForTarget', () => {
    beforeEach(async () => {
      await calculator.initialize();
      calculator.universeOfFailures = new Set(['F1', 'F2', 'F3', 'F4', 'F5']);
      calculator.checkToFailures.set('check1', ['F1', 'F2']);
      calculator.checkToFailures.set('check2', ['F3']);
    });

    it('deve calcular cobertura para alvo', async () => {
      const checks = [
        { id: 'check1', name: 'check1' },
        { id: 'check2', name: 'check2' }
      ];

      const coverage = await calculator.calculateCoverageForTarget('target1', checks);

      expect(coverage.target).toBe('target1');
      expect(coverage.coverage).toBe(3); // F1, F2, F3
      expect(coverage.totalFailures).toBe(5);
      expect(coverage.percentage).toBe(60);
    });
  });

  describe('calculateTotalCoverage', () => {
    beforeEach(async () => {
      await calculator.initialize();
      calculator.universeOfFailures = new Set(['F1', 'F2', 'F3', 'F4', 'F5']);
    });

    it('deve calcular cobertura total', async () => {
      const targetCoverages = [
        { coveredFailures: ['F1', 'F2'] },
        { coveredFailures: ['F3', 'F4'] }
      ];

      const total = await calculator.calculateTotalCoverage(targetCoverages);

      expect(total.totalCovered).toBe(4); // F1, F2, F3, F4 (união)
      expect(total.totalFailures).toBe(5);
      expect(total.percentage).toBe(80);
    });
  });

  describe('validateCoverage', () => {
    beforeEach(async () => {
      await calculator.initialize();
      calculator.universeOfFailures = new Set(['F1', 'F2', 'F3', 'F4', 'F5']);
    });

    it('deve validar cobertura acima do mínimo', async () => {
      const targetCoverages = [
        { target: 'target1', percentage: 95, coveredFailures: ['F1', 'F2', 'F3', 'F4', 'F5'] }
      ];

      const totalCoverage = {
        totalCovered: 5,
        totalFailures: 5,
        percentage: 100,
        meetsMinimum: true
      };

      const validation = await calculator.validateCoverage(targetCoverages, totalCoverage);

      expect(validation.valid).toBe(true);
    });

    it('deve rejeitar cobertura abaixo do mínimo', async () => {
      const targetCoverages = [
        { target: 'target1', percentage: 80, coveredFailures: ['F1', 'F2', 'F3', 'F4'] }
      ];

      const totalCoverage = {
        totalCovered: 4,
        totalFailures: 5,
        percentage: 80,
        meetsMinimum: false
      };

      const validation = await calculator.validateCoverage(targetCoverages, totalCoverage);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await calculator.initialize();
    });

    it('deve executar cálculo completo', async () => {
      const targets = ['target1', 'target2'];
      const checks = [
        { id: 'check1', failures: ['F1', 'F2'] },
        { id: 'check2', failures: ['F3'] }
      ];

      const result = await calculator.execute({ targets, checks });

      expect(result.targets).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.validation).toBeDefined();
    });

    it('deve lançar erro se targets não fornecido', async () => {
      await expect(
        calculator.execute({ checks: [] })
      ).rejects.toThrow('targets é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = calculator.onValidate({
        targets: [],
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
