/**
 * Testes unitários para AbsoluteCertaintyAnalyzer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import AbsoluteCertaintyAnalyzer, { createAbsoluteCertaintyAnalyzer } from '../../../src/systems/fase0/AbsoluteCertaintyAnalyzer.js';

describe('AbsoluteCertaintyAnalyzer', () => {
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

    analyzer = createAbsoluteCertaintyAnalyzer(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await analyzer.initialize();
      expect(analyzer.analyses).toBeDefined();
    });
  });

  describe('verifyErrorWithAbsoluteCertainty', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve retornar resultado com certeza absoluta', async () => {
      const errorReport = {
        id: 'error-1',
        message: 'Method not found',
        filePath: 'src/test.js',
        className: 'TestClass',
        methodName: 'testMethod'
      };

      const result = await analyzer.execute({
        errorReport,
        codebase: { basePath: '.' }
      });

      expect(result).toBeDefined();
      expect(result.confidence).toBe(0.0); // Sem evidências suficientes
      expect(result.isError).toBe(false);
      expect(result.falsePositiveRisk).toBeDefined();
      expect(result.analysis).toBeDefined();
    });

    it('deve lançar erro se errorReport não fornecido', async () => {
      await expect(
        analyzer.execute({ codebase: {} })
      ).rejects.toThrow('errorReport é obrigatório');
    });

    it('deve coletar evidências', async () => {
      const errorReport = {
        id: 'error-2',
        message: 'Error message',
        filePath: 'src/test.js'
      };

      const result = await analyzer.execute({
        errorReport,
        codebase: {}
      });

      expect(result.evidence).toBeDefined();
      expect(Array.isArray(result.evidence)).toBe(true);
    });

    it('deve retornar confidence 0.0 ou 1.0 apenas', async () => {
      const errorReport = {
        id: 'error-3',
        message: 'Test error'
      };

      const result = await analyzer.execute({
        errorReport,
        codebase: {}
      });

      expect(result.confidence === 0.0 || result.confidence === 1.0).toBe(true);
    });
  });

  describe('getAnalysis', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve retornar null se análise não existe', () => {
      expect(analyzer.getAnalysis('missing')).toBeNull();
    });

    it('deve retornar análise armazenada', async () => {
      const errorReport = {
        id: 'error-1',
        message: 'Test'
      };

      await analyzer.execute({
        errorReport,
        codebase: {}
      });

      const analysis = analyzer.getAnalysis('error-1');
      expect(analysis).toBeDefined();
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = analyzer.validate({
        errorReport: {
          message: 'Test'
        }
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(analyzer.validate(null).valid).toBe(false);
      expect(analyzer.validate({}).valid).toBe(false);
      expect(analyzer.validate({ errorReport: 'not-object' }).valid).toBe(false);
    });
  });
});
