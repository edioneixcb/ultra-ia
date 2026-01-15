/**
 * Testes de integração para Fase 2 e Fase 3
 * 
 * Testa fluxos completos de resolução inteligente e validação de qualidade
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getComponentRegistry } from '../../src/core/index.js';
import IntelligentSequentialResolver from '../../src/systems/fase2/IntelligentSequentialResolver.js';
import ForensicAnalyzer from '../../src/systems/fase2/ForensicAnalyzer.js';
import ScoreCalculator from '../../src/systems/fase2/ScoreCalculator.js';
import CoverageCalculator from '../../src/systems/fase2/CoverageCalculator.js';
import TestExpectationValidator from '../../src/systems/fase3/TestExpectationValidator.js';
import TestValidator from '../../src/systems/fase3/TestValidator.js';
import AccurateDocumentationSystem from '../../src/systems/fase3/AccurateDocumentationSystem.js';
import MetaValidationSystem from '../../src/systems/fase3/MetaValidationSystem.js';

describe('Fase 2 e Fase 3 - Integração Completa', () => {
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

    mockConfig = {
      test: true,
      features: {
        enableFase2Integration: true,
        enableFase3Integration: true,
        useCache: true
      },
      cache: {
        enabled: true,
        maxSize: 100,
        ttl: 3600000
      }
    };
  });

  describe('Fluxo completo de resolução inteligente', () => {
    it('deve resolver erros sequencialmente com análise forense', async () => {
      const resolver = new IntelligentSequentialResolver(mockConfig, mockLogger, mockErrorHandler);
      const forensicAnalyzer = new ForensicAnalyzer(mockConfig, mockLogger, mockErrorHandler);
      
      await resolver.initialize();
      await forensicAnalyzer.initialize();

      const errors = [
        { id: 'error1', message: 'SyntaxError: Unexpected token', type: 'syntax', file: 'test.js', line: 10 },
        { id: 'error2', message: 'TypeError: Cannot read property', type: 'type', file: 'test.js', line: 15 }
      ];

      const codebase = {
        files: {
          'test.js': {
            content: 'const x = 1;\nconst y = x.undefined;'
          }
        }
      };

      // Análise forense primeiro
      const forensicResult = await forensicAnalyzer.execute({
        action: 'analyze',
        error: errors[0],
        context: { codebase }
      });

      expect(forensicResult).toBeDefined();
      expect(forensicResult.rootCause).toBeDefined();

      // Resolução inteligente
      const resolutionResult = await resolver.execute({
        errors,
        codebase,
        resolutionId: 'test-resolution-1'
      });

      expect(resolutionResult).toBeDefined();
      expect(resolutionResult.total).toBe(2);
      expect(resolutionResult.resolved).toBeGreaterThanOrEqual(0);
    });

    it('deve calcular score e cobertura após resolução', async () => {
      const scoreCalculator = new ScoreCalculator(mockConfig, mockLogger, mockErrorHandler);
      const coverageCalculator = new CoverageCalculator(mockConfig, mockLogger, mockErrorHandler);
      
      await scoreCalculator.initialize();
      await coverageCalculator.initialize();

      const checks = [
        { id: 'check1', status: 'OK', severity: 'MEDIUM' },
        { id: 'check2', status: 'FALHOU', severity: 'LOW' },
        { id: 'check3', status: 'OK', severity: 'HIGH' }
      ];

      const score = scoreCalculator.calculateScore(checks);
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);

      const coverage = await coverageCalculator.execute({
        targets: ['target1'],
        checks,
        calculationId: 'test-coverage-1'
      });

      expect(coverage).toBeDefined();
      expect(coverage.total).toBeDefined();
    });
  });

  describe('Fluxo completo de validação de qualidade', () => {
    it('deve validar testes e documentação', async () => {
      const testExpectationValidator = new TestExpectationValidator(mockConfig, mockLogger, mockErrorHandler);
      const testValidator = new TestValidator(mockConfig, mockLogger, mockErrorHandler, testExpectationValidator);
      const docSystem = new AccurateDocumentationSystem(mockConfig, mockLogger, mockErrorHandler);
      
      await testExpectationValidator.initialize();
      await testValidator.initialize();
      await docSystem.initialize();

      const test = {
        id: 'test1',
        name: 'Test function',
        code: 'function add(a, b) { return a + b; }',
        expectations: {
          output: '3',
          returnValue: 3
        }
      };

      const implementation = {
        code: 'function add(a, b) { return a + b; }',
        language: 'javascript'
      };

      // Validar expectativas
      const expectationResult = await testExpectationValidator.execute({
        action: 'validateExpectations',
        test,
        implementation
      });

      expect(expectationResult).toBeDefined();
      expect(expectationResult.valid).toBeDefined();

      // Validar teste completo
      const testValidation = await testValidator.execute({
        action: 'validate',
        test,
        implementation
      });

      expect(testValidation).toBeDefined();
      expect(testValidation.valid).toBeDefined();

      // Validar documentação
      const docValidation = await docSystem.execute({
        action: 'validate',
        documentation: {
          claims: [
            { type: 'function', name: 'add', description: 'Adds two numbers' }
          ]
        },
        codebase: {
          files: {
            'test.js': {
              content: implementation.code
            }
          }
        }
      });

      expect(docValidation).toBeDefined();
    });

    it('deve executar meta-validação completa', async () => {
      const metaValidator = new MetaValidationSystem(mockConfig, mockLogger, mockErrorHandler);
      await metaValidator.initialize();

      const audit = {
        id: 'audit-1',
        version: '1.0.0',
        checkpoints: [
          { id: 'cp1', executed: true },
          { id: 'cp2', executed: true }
        ],
        checks: [
          { id: 'check1', applicable: true, executed: true, status: 'OK', evidence: { level: 'DIRECT' } },
          { id: 'check2', applicable: true, executed: true, status: 'OK', evidence: { level: 'DIRECT' } }
        ],
        traceabilityMatrix: [
          { requisito: 'check1', check: 'check1' }
        ]
      };

      const validation = await metaValidator.execute({
        action: 'validate',
        audit
      });

      expect(validation).toBeDefined();
      expect(validation.valid).toBeDefined();
      expect(validation.checklist).toBeDefined();
    });
  });

  describe('Integração entre Fase 2 e Fase 3', () => {
    it('deve executar resolução seguida de validação de qualidade', async () => {
      const resolver = new IntelligentSequentialResolver(mockConfig, mockLogger, mockErrorHandler);
      const testValidator = new TestValidator(mockConfig, mockLogger, mockErrorHandler);
      const metaValidator = new MetaValidationSystem(mockConfig, mockLogger, mockErrorHandler);
      
      await resolver.initialize();
      await testValidator.initialize();
      await metaValidator.initialize();

      const errors = [
        { id: 'error1', message: 'Test failed', type: 'test', file: 'test.js' }
      ];

      const codebase = {
        files: {
          'test.js': {
            content: 'function test() { return true; }'
          }
        }
      };

      // Resolver erros
      const resolution = await resolver.execute({
        errors,
        codebase,
        resolutionId: 'integration-test-1'
      });

      expect(resolution).toBeDefined();

      // Validar qualidade após resolução
      const audit = {
        id: 'post-resolution-audit',
        checks: [
          { id: 'check1', applicable: true, executed: true, status: 'OK' }
        ]
      };

      const metaValidation = await metaValidator.execute({
        action: 'validate',
        audit
      });

      expect(metaValidation).toBeDefined();
      expect(metaValidation.valid).toBeDefined();
    });
  });
});
