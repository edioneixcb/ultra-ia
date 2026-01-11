/**
 * Testes unitários para PlatformSpecificGenerator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import PlatformSpecificGenerator, { createPlatformSpecificGenerator } from '../../../src/systems/fase9/PlatformSpecificGenerator.js';

describe('PlatformSpecificGenerator', () => {
  let generator;
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

    generator = createPlatformSpecificGenerator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await generator.initialize();
      expect(generator.generations).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve gerar código para Windows', async () => {
      const result = await generator.execute({
        action: 'generate',
        code: 'const path = "/tmp/file";',
        targetPlatform: 'windows'
      });

      expect(result).toBeDefined();
      expect(result.generatedCode).toBeDefined();
      expect(result.targetPlatform).toBe('windows');
    });

    it('deve gerar código para Web', async () => {
      const result = await generator.execute({
        action: 'generate',
        code: 'const fs = require("fs");',
        targetPlatform: 'web'
      });

      expect(result).toBeDefined();
      expect(result.generatedCode).toBeDefined();
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = generator.onValidate({
        action: 'generate'
      });
      expect(result.valid).toBe(true);
    });
  });
});
