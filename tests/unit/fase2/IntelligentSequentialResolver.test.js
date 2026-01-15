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
  let mockASTParser;
  let mockBaselineManager;
  let mockDockerSandbox;

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

    mockConfig = { 
      test: true,
      features: {
        useASTValidation: true,
        useBaselineComparison: true,
        useDockerValidation: false // Desabilitado por padrão nos testes
      }
    };

    mockASTParser = {
      parse: vi.fn()
    };

    mockBaselineManager = {
      execute: vi.fn()
    };

    mockDockerSandbox = {
      execute: vi.fn()
    };

    resolver = createIntelligentSequentialResolver(
      mockConfig, 
      mockLogger, 
      mockErrorHandler,
      mockASTParser,
      mockBaselineManager,
      mockDockerSandbox
    );
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

  describe('validateFix com ASTParser', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('deve usar ASTParser para validar sintaxe quando disponível', async () => {
      mockASTParser.parse.mockReturnValue({
        valid: true,
        structure: { functions: 2, classes: 1, imports: 1, exports: 1 },
        securityIssues: []
      });

      const fixResult = {
        changesApplied: true,
        fix: {
          changes: [{
            file: 'test.js',
            type: 'syntax'
          }]
        }
      };

      const codebase = {
        files: {
          'test.js': { content: 'function test() { return true; }' }
        }
      };

      const validation = await resolver.validateFix(fixResult, codebase);

      expect(validation.success).toBe(true);
      expect(mockASTParser.parse).toHaveBeenCalled();
      expect(validation.validationDetails['test.js']).toBeDefined();
    });

    it('deve detectar erros de sintaxe com ASTParser', async () => {
      mockASTParser.parse.mockReturnValue({
        valid: false,
        errors: [{
          line: 1,
          column: 5,
          message: 'Unexpected token'
        }]
      });

      const fixResult = {
        changesApplied: true,
        fix: {
          changes: [{
            file: 'test.js',
            type: 'syntax'
          }]
        }
      };

      const codebase = {
        files: {
          'test.js': { content: 'function test() { return' }
        }
      };

      const validation = await resolver.validateFix(fixResult, codebase);

      expect(validation.success).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeCascadeImpact com BaselineManager', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('deve criar baseline antes da análise quando BaselineManager disponível', async () => {
      mockBaselineManager.execute.mockResolvedValue({
        timestamp: '2026-01-14T15:00:00Z',
        system: 'IntelligentSequentialResolver',
        environment: { os: { platform: 'linux' } }
      });

      const error = { id: 'error1', file: 'file1.js' };
      const codebase = {
        files: {
          'file1.js': { imports: [] },
          'file2.js': { imports: ['file1.js'] }
        }
      };

      const impact = await resolver.analyzeCascadeImpact(error, codebase, []);

      expect(impact).toBeDefined();
      expect(impact.baselineBefore).toBeDefined();
      expect(mockBaselineManager.execute).toHaveBeenCalled();
    });
  });

  describe('generateFix com ASTParser', () => {
    it('deve usar ASTParser para análise estrutural quando disponível', () => {
      mockASTParser.parse.mockReturnValue({
        valid: false,
        errors: [{
          line: 5,
          column: 10,
          message: 'Missing semicolon'
        }],
        structure: null
      });

      const error = { id: 'error1', file: 'test.js', type: 'syntax_error' };
      const codebase = {
        files: {
          'test.js': { content: 'function test() { return true' }
        }
      };

      const fix = resolver.generateFix(error, codebase);

      expect(fix).toBeDefined();
      expect(fix.type).toBe('syntax_fix');
      expect(fix.changes.length).toBeGreaterThan(0);
      expect(mockASTParser.parse).toHaveBeenCalled();
    });

    it('deve detectar problemas de segurança com ASTParser', () => {
      mockASTParser.parse.mockReturnValue({
        valid: true,
        structure: { functions: 1, classes: 0, imports: 0, exports: 0 },
        securityIssues: [{
          type: 'eval_usage',
          severity: 'critical',
          line: 3,
          message: 'Uso de eval() é perigoso'
        }]
      });

      const error = { id: 'error1', file: 'test.js', type: 'security_error' };
      const codebase = {
        files: {
          'test.js': { content: 'eval("console.log(1)")' }
        }
      };

      const fix = resolver.generateFix(error, codebase);

      expect(fix.type).toBe('security_fix');
      expect(fix.changes.length).toBeGreaterThan(0);
      expect(fix.changes[0].type).toBe('security');
    });
  });
});
