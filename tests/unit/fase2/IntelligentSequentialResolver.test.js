/**
 * Testes unitários para IntelligentSequentialResolver
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import IntelligentSequentialResolver, { createIntelligentSequentialResolver } from '../../../src/systems/fase2/IntelligentSequentialResolver.js';

describe('IntelligentSequentialResolver', () => {
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

    resolver = createIntelligentSequentialResolver(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await resolver.initialize();
      expect(resolver.resolutions).toBeDefined();
      expect(resolver.dependencyGraph).toBeDefined();
      expect(resolver.rollbackHistory).toBeDefined();
    });
  });

  describe('buildDependencyGraph', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('deve construir grafo de dependências', async () => {
      const errors = [
        { id: 'error1', file: 'file1.js', type: 'syntax_error' },
        { id: 'error2', file: 'file2.js', type: 'type_error' }
      ];

      const codebase = {
        files: {
          'file1.js': { imports: [] },
          'file2.js': { imports: ['file1.js'] }
        }
      };

      const graph = await resolver.buildDependencyGraph(errors, codebase);

      expect(graph.size).toBe(2);
      expect(graph.has('error1')).toBe(true);
      expect(graph.has('error2')).toBe(true);
    });
  });

  describe('calculateOptimalOrder', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('deve calcular ordem ótima respeitando dependências', async () => {
      const errors = [
        { id: 'error1', file: 'file1.js' },
        { id: 'error2', file: 'file2.js' }
      ];

      const codebase = {
        files: {
          'file1.js': { imports: [] },
          'file2.js': { imports: ['file1.js'] }
        }
      };

      const graph = await resolver.buildDependencyGraph(errors, codebase);
      const order = await resolver.calculateOptimalOrder(graph);

      expect(order.length).toBe(2);
      // error1 deve vir antes de error2 (dependência)
      expect(order[0].id).toBe('error1');
    });
  });

  describe('analyzeCascadeImpact', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('deve analisar impacto em cascata', async () => {
      const error = { id: 'error1', file: 'file1.js' };
      const codebase = {
        files: {
          'file1.js': { imports: [] },
          'file2.js': { imports: ['file1.js'] }
        }
      };

      const impact = await resolver.analyzeCascadeImpact(error, codebase, []);

      expect(impact).toBeDefined();
      expect(impact.impacts).toBeDefined();
    });
  });

  describe('simulateFix', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('deve simular correção antes de aplicar', async () => {
      const error = { id: 'error1', type: 'syntax_error' };
      const impactAnalysis = { hasHighImpact: false, impacts: [] };
      const codebase = { files: {} };

      const simulation = await resolver.simulateFix(error, impactAnalysis, codebase);

      expect(simulation).toBeDefined();
      expect(simulation.isSafe).toBeDefined();
      expect(simulation.proposedFix).toBeDefined();
    });

    it('deve marcar como não seguro se há impacto alto', async () => {
      const error = { id: 'error1', type: 'syntax_error' };
      const impactAnalysis = { hasHighImpact: true, impacts: [{ severity: 'high' }] };
      const codebase = { files: {} };

      const simulation = await resolver.simulateFix(error, impactAnalysis, codebase);

      expect(simulation.isSafe).toBe(false);
    });
  });

  describe('resolveAllErrorsWithZeroImpact', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('deve resolver erros em ordem estratégica', async () => {
      const errors = [
        { id: 'error1', file: 'file1.js', type: 'syntax_error' },
        { id: 'error2', file: 'file2.js', type: 'type_error' }
      ];

      const codebase = {
        files: {
          'file1.js': { imports: [] },
          'file2.js': { imports: [] }
        }
      };

      const result = await resolver.resolveAllErrorsWithZeroImpact(errors, codebase);

      expect(result).toBeDefined();
      expect(result.total).toBe(2);
      expect(result.results).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('deve executar resolução completa', async () => {
      const errors = [
        { id: 'error1', file: 'file1.js', type: 'syntax_error' }
      ];

      const codebase = {
        files: {
          'file1.js': { imports: [] }
        }
      };

      const result = await resolver.execute({ errors, codebase });

      expect(result).toBeDefined();
      expect(result.total).toBe(1);
    });

    it('deve lançar erro se errors não fornecido', async () => {
      await expect(
        resolver.execute({ codebase: {} })
      ).rejects.toThrow('errors é obrigatório');
    });

    it('deve lançar erro se codebase não fornecido', async () => {
      await expect(
        resolver.execute({ errors: [] })
      ).rejects.toThrow('codebase é obrigatório');
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
      expect(resolver.onValidate({ errors: 'not-array' }).valid).toBe(false);
    });
  });
});
