/**
 * Testes unitários para MultiEnvironmentCompatibilityAnalyzer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import MultiEnvironmentCompatibilityAnalyzer, { createMultiEnvironmentCompatibilityAnalyzer } from '../../../src/systems/fase2/MultiEnvironmentCompatibilityAnalyzer.js';

describe('MultiEnvironmentCompatibilityAnalyzer', () => {
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

    analyzer = createMultiEnvironmentCompatibilityAnalyzer(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await analyzer.initialize();
      expect(analyzer.analyses).toBeDefined();
      expect(analyzer.changelogCache).toBeDefined();
    });
  });

  describe('analyzeForNodeJS', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve detectar APIs específicas do Deno', async () => {
      const code = 'Deno.readTextFile("file.txt");';
      const result = await analyzer.analyzeForNodeJS(code);

      expect(result.isCompatible).toBe(false);
      expect(result.issues.some(i => i.type === 'deno_specific_api')).toBe(true);
    });

    it('deve detectar mistura de módulos', async () => {
      const code = 'const fs = require("fs"); import { test } from "./test";';
      const result = await analyzer.analyzeForNodeJS(code);

      expect(result.issues.some(i => i.type === 'mixed_modules')).toBe(true);
    });
  });

  describe('analyzeForDeno', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve detectar APIs específicas do Node.js', async () => {
      const code = 'process.env.NODE_ENV;';
      const result = await analyzer.analyzeForDeno(code);

      expect(result.isCompatible).toBe(false);
      expect(result.issues.some(i => i.type === 'nodejs_specific_api')).toBe(true);
    });

    it('deve detectar uso de require', async () => {
      const code = 'const fs = require("fs");';
      const result = await analyzer.analyzeForDeno(code);

      expect(result.issues.some(i => i.type === 'require_not_supported')).toBe(true);
    });
  });

  describe('analyzeForBrowser', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve detectar APIs do servidor', async () => {
      const code = 'fs.readFileSync("file.txt");';
      const result = await analyzer.analyzeForBrowser(code);

      expect(result.isCompatible).toBe(false);
      expect(result.issues.some(i => i.type === 'server_side_api')).toBe(true);
    });
  });

  describe('analyzeRuntimeCompatibility', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve analisar compatibilidade de runtime', async () => {
      const code = 'console.log("test");';
      const result = await analyzer.analyzeRuntimeCompatibility(code, 'nodejs');

      expect(result.targetRuntime).toBe('nodejs');
      expect(result.compatible).toBeDefined();
      expect(result.issues).toBeDefined();
    });
  });

  describe('analyzePlatformCompatibility', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve detectar caminhos do Windows em Linux', async () => {
      const code = 'const path = "C:\\Users\\test";';
      const result = await analyzer.analyzePlatformCompatibility(code, 'linux');

      expect(result.issues.some(i => i.type === 'windows_path')).toBe(true);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('deve executar análise completa', async () => {
      const code = 'console.log("test");';
      const result = await analyzer.execute({ code });

      expect(result.runtime).toBeDefined();
      expect(result.platform).toBeDefined();
    });

    it('deve executar análise específica de runtime', async () => {
      const code = 'console.log("test");';
      const result = await analyzer.execute({
        code,
        analysisType: 'runtime',
        targetRuntime: 'nodejs'
      });

      expect(result.targetRuntime).toBe('nodejs');
      expect(result.platform).toBeUndefined();
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
