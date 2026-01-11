/**
 * Testes unitários para ProactiveAnticipationSystem
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ProactiveAnticipationSystem, { createProactiveAnticipationSystem } from '../../../src/systems/fase1/ProactiveAnticipationSystem.js';

describe('ProactiveAnticipationSystem', () => {
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

    system = createProactiveAnticipationSystem(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await system.initialize();
      expect(system.anticipations).toBeDefined();
      expect(system.historicalErrors).toBeDefined();
      expect(system.problematicPatterns).toBeDefined();
    });
  });

  describe('detectProblematicPatterns', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve detectar catch vazio', async () => {
      const code = `
        try {
          doSomething();
        } catch (e) {}
      `;

      const patterns = await system.detectProblematicPatterns(code);

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.type === 'empty_catch')).toBe(true);
    });

    it('deve detectar console.log', async () => {
      const code = `
        console.log('Debug message');
        console.error('Error message');
      `;

      const patterns = await system.detectProblematicPatterns(code);

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.type === 'console_usage')).toBe(true);
    });

    it('deve detectar uso de any', async () => {
      const code = `
        function test(param: any) {
          return param;
        }
      `;

      const patterns = await system.detectProblematicPatterns(code);

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.type === 'any_usage')).toBe(true);
    });

    it('deve detectar secrets hardcoded', async () => {
      const code = `
        const apiKey = "sk-1234567890";
        const password = "secret123";
      `;

      const patterns = await system.detectProblematicPatterns(code);

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.type === 'hardcoded_secret')).toBe(true);
    });

    it('deve retornar array vazio se nenhum padrão encontrado', async () => {
      const code = `
        function test() {
          return 'clean code';
        }
      `;

      const patterns = await system.detectProblematicPatterns(code);

      expect(patterns).toEqual([]);
    });
  });

  describe('predictFutureProblems', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve prever dependências faltando', async () => {
      const code = `
        import axios from 'axios';
        import lodash from 'lodash';
      `;

      const problems = await system.predictFutureProblems(code, {});

      expect(problems.length).toBeGreaterThan(0);
      expect(problems.some(p => p.type === 'missing_dependency')).toBe(true);
    });

    it('deve prever uso de API sem tratamento de erro assíncrono', async () => {
      const code = `
        async function test() {
          const result = await fetchData();
          return result;
        }
      `;

      const problems = await system.predictFutureProblems(code, {});

      expect(problems.some(p => p.type === 'async_without_error_handling')).toBe(true);
    });

    it('deve retornar array vazio se nenhum problema previsto', async () => {
      const code = `
        function test() {
          return 'simple code';
        }
      `;

      const problems = await system.predictFutureProblems(code, {
        dependenciesChecked: true
      });

      expect(problems).toEqual([]);
    });
  });

  describe('generatePreventionSuggestions', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve gerar sugestões baseadas em padrões', async () => {
      const analysis = {
        problematicPatterns: [
          {
            type: 'empty_catch',
            severity: 'high',
            suggestion: 'Adicionar tratamento de erro'
          }
        ],
        futureProblems: [],
        historicalErrors: []
      };

      const suggestions = await system.generatePreventionSuggestions(analysis);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.type === 'pattern_based')).toBe(true);
    });

    it('deve gerar sugestões baseadas em previsões', async () => {
      const analysis = {
        problematicPatterns: [],
        futureProblems: [
          {
            type: 'missing_dependency',
            severity: 'high',
            suggestion: 'Verificar dependências'
          }
        ],
        historicalErrors: []
      };

      const suggestions = await system.generatePreventionSuggestions(analysis);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.type === 'prediction_based')).toBe(true);
    });

    it('deve gerar sugestões baseadas em erros históricos', async () => {
      system.addHistoricalError({
        type: 'common_error',
        prevention: 'Prevenir erro comum'
      });
      system.addHistoricalError({
        type: 'common_error',
        prevention: 'Prevenir erro comum'
      });

      const historicalErrors = await system.getHistoricalErrors();
      const analysis = {
        problematicPatterns: [],
        futureProblems: [],
        historicalErrors
      };

      const suggestions = await system.generatePreventionSuggestions(analysis);

      expect(suggestions.some(s => s.type === 'historical_based')).toBe(true);
    });
  });

  describe('anticipateProblemsDuringDevelopment', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve retornar análise completa', async () => {
      const code = `
        try {
          console.log('test');
        } catch (e) {}
      `;

      const result = await system.anticipateProblemsDuringDevelopment(code, {});

      expect(result.immediateRisks).toBeDefined();
      expect(result.futureRisks).toBeDefined();
      expect(result.prevention).toBeDefined();
      expect(result.analyzedAt).toBeDefined();
    });

    it('deve detectar múltiplos tipos de problemas', async () => {
      const code = `
        console.log('debug');
        try {
          doSomething();
        } catch (e) {}
        const apiKey = "secret123";
      `;

      const result = await system.anticipateProblemsDuringDevelopment(code, {});

      expect(result.immediateRisks.length).toBeGreaterThan(1);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve executar análise completa', async () => {
      const code = 'const test = "code";';

      const result = await system.execute({ code, context: {} });

      expect(result.immediateRisks).toBeDefined();
      expect(result.futureRisks).toBeDefined();
      expect(result.prevention).toBeDefined();
    });

    it('deve lançar erro se code não fornecido', async () => {
      await expect(
        system.execute({ context: {} })
      ).rejects.toThrow('code é obrigatório');
    });
  });

  describe('addHistoricalError e getHistoricalErrors', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve adicionar erro histórico', async () => {
      system.addHistoricalError({
        type: 'test_error',
        message: 'Test error'
      });

      const errors = await system.getHistoricalErrors();
      expect(errors.length).toBe(1);
      expect(errors[0].type).toBe('test_error');
    });

    it('deve manter apenas últimos 100 erros', async () => {
      for (let i = 0; i < 150; i++) {
        system.addHistoricalError({
          type: `error_${i}`,
          message: `Error ${i}`
        });
      }

      const errors = await system.getHistoricalErrors();
      expect(errors.length).toBe(100);
    });
  });

  describe('analyzeCommonErrors', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve analisar erros comuns', async () => {
      system.addHistoricalError({ type: 'error_a', prevention: 'Prevent A' });
      system.addHistoricalError({ type: 'error_a', prevention: 'Prevent A' });
      system.addHistoricalError({ type: 'error_b', prevention: 'Prevent B' });

      const errors = await system.getHistoricalErrors();
      const common = system.analyzeCommonErrors(errors);

      expect(common.length).toBeGreaterThan(0);
      expect(common.some(e => e.type === 'error_a')).toBe(true);
      expect(common[0].frequency).toBeDefined();
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve retornar estatísticas corretas', async () => {
      await system.execute({
        code: 'console.log("test");',
        context: {}
      });

      const stats = system.getStats();

      expect(stats.totalAnticipations).toBe(1);
      expect(stats.totalPatterns).toBeGreaterThanOrEqual(0);
      expect(stats.historicalErrors).toBe(0);
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = system.validate({
        code: 'const test = "code";'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(system.validate(null).valid).toBe(false);
      expect(system.validate({}).valid).toBe(false);
      expect(system.validate({ code: 123 }).valid).toBe(false);
    });
  });
});
