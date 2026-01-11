/**
 * Testes unitários para PatternLearner
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import PatternLearner, { createPatternLearner } from '../../../src/systems/fase8/PatternLearner.js';

describe('PatternLearner', () => {
  let learner;
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

    learner = createPatternLearner(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await learner.initialize();
      expect(learner.patterns).toBeDefined();
      expect(learner.usageStats).toBeDefined();
      expect(learner.preferences).toBeDefined();
    });
  });

  describe('extractPatterns', () => {
    beforeEach(async () => {
      await learner.initialize();
    });

    it('deve extrair padrões de código', async () => {
      const code = 'class Test extends Base { async execute() { } }';
      const result = await learner.extractPatterns(code);

      expect(result).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.totalExtracted).toBeGreaterThanOrEqual(0);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await learner.initialize();
    });

    it('deve executar extração de padrões', async () => {
      const result = await learner.execute({
        action: 'extract',
        code: 'class Test { }'
      });

      expect(result).toBeDefined();
      expect(result.patterns).toBeDefined();
    });

    it('deve lançar erro se action não fornecido', async () => {
      await expect(
        learner.execute({})
      ).rejects.toThrow('action é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = learner.onValidate({
        action: 'extract'
      });
      expect(result.valid).toBe(true);
    });
  });
});
