/**
 * Testes unitários para ForensicAnalyzer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ForensicAnalyzer, { createForensicAnalyzer } from '../../../src/systems/fase2/ForensicAnalyzer.js';

describe('ForensicAnalyzer', () => {
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

    analyzer = createForensicAnalyzer(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await analyzer.initialize();
      expect(analyzer.analyses).toBeDefined();
      expect(analyzer.knownPatterns).toBeDefined();
      expect(analyzer.evidenceCache).toBeDefined();
    });
  });

  describe('classifyError', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve classificar erro de sintaxe', () => {
      const error = { message: 'Syntax error: unexpected token' };
      const classification = analyzer.classifyError(error);

      expect(classification.category).toBe('syntax');
      expect(classification.severity).toBe('high');
    });

    it('deve classificar erro de tipo', () => {
      const error = { message: 'TypeError: cannot read property' };
      const classification = analyzer.classifyError(error);

      expect(classification.category).toBe('type');
      expect(classification.severity).toBe('high');
    });

    it('deve classificar erro de referência', () => {
      const error = { message: 'ReferenceError: variable is not defined' };
      const classification = analyzer.classifyError(error);

      expect(classification.category).toBe('reference');
      expect(classification.severity).toBe('high');
    });
  });

  describe('identifyPattern', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve identificar padrão conhecido', async () => {
      const error = { message: 'Cannot read property of null' };
      const pattern = await analyzer.identifyPattern(error, {});

      expect(pattern).toBeDefined();
      expect(pattern.id).toBe('null-reference');
    });

    it('deve retornar null se padrão não encontrado', async () => {
      const error = { message: 'Unknown error message' };
      const pattern = await analyzer.identifyPattern(error, {});

      expect(pattern).toBeNull();
    });
  });

  describe('collectEvidence', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve coletar evidências', async () => {
      const error = {
        message: 'Test error',
        type: 'Error',
        stack: 'Stack trace',
        file: 'test.js',
        line: 10
      };

      const evidence = await analyzer.collectEvidence(error, {});

      expect(evidence.errorMessage).toBe('Test error');
      expect(evidence.context.file).toBe('test.js');
    });
  });

  describe('analyzeError', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve realizar análise completa', async () => {
      const error = { message: 'Cannot read property of null' };
      const analysis = await analyzer.analyzeError(error, {});

      expect(analysis.classification).toBeDefined();
      expect(analysis.pattern).toBeDefined();
      expect(analysis.evidence).toBeDefined();
      expect(analysis.rootCause).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve executar análise forense completa', async () => {
      const error = { message: 'Test error', id: 'error-1' };
      const result = await analyzer.execute({ error });

      expect(result.classification).toBeDefined();
      expect(result.rootCause).toBeDefined();
    });

    it('deve lançar erro se error não fornecido', async () => {
      await expect(
        analyzer.execute({})
      ).rejects.toThrow('error é obrigatório');
    });
  });

  describe('registerPattern', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve registrar padrão conhecido', () => {
      analyzer.registerPattern('test-pattern', {
        name: 'Test Pattern',
        messagePattern: 'test'
      });

      expect(analyzer.knownPatterns.has('test-pattern')).toBe(true);
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = analyzer.onValidate({
        error: { message: 'test' }
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(analyzer.onValidate(null).valid).toBe(false);
      expect(analyzer.onValidate({}).valid).toBe(false);
    });
  });
});
