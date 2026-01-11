/**
 * Testes unitários para CompleteContractAnalyzer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import CompleteContractAnalyzer, { createCompleteContractAnalyzer } from '../../../src/systems/fase0/CompleteContractAnalyzer.js';

describe('CompleteContractAnalyzer', () => {
  let analyzer;
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

    analyzer = createCompleteContractAnalyzer(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await analyzer.initialize();
      expect(analyzer.contracts).toBeDefined();
      expect(analyzer.dependencies).toBeDefined();
    });
  });

  describe('verifyCompleteContract', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve verificar contrato completo', async () => {
      const methodCall = {
        className: 'TestClass',
        methodName: 'testMethod'
      };

      const result = await analyzer.execute({
        methodCall,
        codebase: { basePath: '.' },
        action: 'verifyContract'
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('exists');
      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('type');
      // analysis pode não existir se classe não for encontrada
      if (result.analysis) {
        expect(result.analysis).toBeDefined();
      }
    });

    it('deve lançar erro se className ou methodName faltar', async () => {
      await expect(
        analyzer.execute({
          methodCall: { className: 'Test' },
          action: 'verifyContract'
        })
      ).rejects.toThrow('methodName');

      await expect(
        analyzer.execute({
          methodCall: { methodName: 'test' },
          action: 'verifyContract'
        })
      ).rejects.toThrow('className');
    });
  });

  describe('analyzeTransitiveDependencies', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve analisar dependências transitivas', async () => {
      const packageJson = {
        name: 'test-package',
        dependencies: {
          'package-a': '^1.0.0',
          'package-b': '^2.0.0'
        }
      };

      const result = await analyzer.execute({
        packageJson,
        codebase: {},
        action: 'analyzeDependencies'
      });

      expect(result).toBeDefined();
      expect(result.direct).toBeDefined();
      expect(result.transitive).toBeDefined();
      expect(result.conflicts).toBeDefined();
      expect(result.nativeDuplications).toBeDefined();
      expect(result.resolution).toBeDefined();
    });

    it('deve aceitar objeto package.json diretamente', async () => {
      const packageJson = {
        name: 'test',
        dependencies: {}
      };

      const result = await analyzer.execute({
        packageJson,
        codebase: {},
        action: 'analyzeDependencies'
      });

      expect(result).toBeDefined();
      expect(result.direct).toBeDefined();
    });

    it('deve lançar erro se package.json não encontrado', async () => {
      await expect(
        analyzer.execute({
          packageJson: '/nonexistent/package.json',
          codebase: {},
          action: 'analyzeDependencies'
        })
      ).rejects.toThrow('não encontrado');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = analyzer.validate({
        action: 'verifyContract',
        methodCall: {
          className: 'Test',
          methodName: 'test'
        }
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(analyzer.validate(null).valid).toBe(false);
      expect(analyzer.validate({}).valid).toBe(false);
      expect(analyzer.validate({ action: 'invalid' }).valid).toBe(false);
    });
  });
});
