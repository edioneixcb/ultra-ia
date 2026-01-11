/**
 * Testes unitários para StaticAnalyzer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import StaticAnalyzer, { createStaticAnalyzer } from '../../../src/systems/fase1/StaticAnalyzer.js';

describe('StaticAnalyzer', () => {
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

    analyzer = createStaticAnalyzer(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await analyzer.initialize();
      expect(analyzer.analyses).toBeDefined();
    });
  });

  describe('analyzeImports', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve detectar imports estáticos de react-native', () => {
      const code = "import { View } from 'react-native';";
      const result = analyzer.analyzeImports(code);

      expect(result.imports.length).toBeGreaterThan(0);
      expect(result.hasIssues).toBe(true);
      expect(result.issues.some(i => i.type === 'static_native_import')).toBe(true);
    });

    it('deve detectar imports externos sem verificação', () => {
      const code = "import axios from 'axios';";
      const result = analyzer.analyzeImports(code);

      expect(result.imports.length).toBeGreaterThan(0);
    });

    it('deve retornar array vazio se nenhum problema encontrado', () => {
      const code = "import { Component } from './Component';";
      const result = analyzer.analyzeImports(code);

      expect(result.issues.length).toBe(0);
    });
  });

  describe('analyzeContracts', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve detectar chamadas de métodos', () => {
      const code = 'const result = obj.method();';
      const result = analyzer.analyzeContracts(code);

      expect(result.methodCalls.length).toBeGreaterThan(0);
      expect(result.methodCalls[0].object).toBe('obj');
      expect(result.methodCalls[0].method).toBe('method');
    });

    it('deve detectar inconsistências de nomenclatura', () => {
      const code = 'obj.camelCase_snakeCase();';
      const result = analyzer.analyzeContracts(code);

      expect(result.issues.some(i => i.type === 'naming_inconsistency')).toBe(true);
    });
  });

  describe('analyzeSecurity', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve detectar password hardcoded', () => {
      const code = 'const password = "secret123";';
      const result = analyzer.analyzeSecurity(code);

      expect(result.hasIssues).toBe(true);
      expect(result.issues.some(i => i.type === 'hardcoded_password')).toBe(true);
    });

    it('deve detectar apiKey hardcoded', () => {
      const code = 'const apiKey = "sk-123456";';
      const result = analyzer.analyzeSecurity(code);

      expect(result.hasIssues).toBe(true);
      expect(result.issues.some(i => i.type === 'hardcoded_api_key')).toBe(true);
    });

    it('não deve detectar placeholders como secrets', () => {
      const code = 'const password = "your_password_here";';
      const result = analyzer.analyzeSecurity(code);

      expect(result.issues.filter(i => i.type === 'hardcoded_password').length).toBe(0);
    });
  });

  describe('analyzePatterns', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve detectar uso de eval', () => {
      const code = 'eval("some code");';
      const result = analyzer.analyzePatterns(code);

      expect(result.hasIssues).toBe(true);
      expect(result.issues.some(i => i.type === 'eval_usage')).toBe(true);
    });

    it('deve detectar innerHTML sem sanitização', () => {
      const code = 'element.innerHTML = userInput;';
      const result = analyzer.analyzePatterns(code);

      expect(result.hasIssues).toBe(true);
      expect(result.issues.some(i => i.type === 'innerhtml_without_sanitization')).toBe(true);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve executar análise completa', async () => {
      const code = "import { View } from 'react-native';";
      const result = await analyzer.execute({ code });

      expect(result.imports).toBeDefined();
      expect(result.contracts).toBeDefined();
      expect(result.security).toBeDefined();
      expect(result.patterns).toBeDefined();
    });

    it('deve executar análise específica de imports', async () => {
      const code = "import axios from 'axios';";
      const result = await analyzer.execute({ code, analysisType: 'imports' });

      expect(result.imports).toBeDefined();
      expect(result.contracts).toBeUndefined();
    });

    it('deve lançar erro se code não fornecido', async () => {
      await expect(
        analyzer.execute({})
      ).rejects.toThrow('code é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = analyzer.onValidate({
        code: 'const test = "code";'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(analyzer.onValidate(null).valid).toBe(false);
      expect(analyzer.onValidate({}).valid).toBe(false);
    });
  });
});
