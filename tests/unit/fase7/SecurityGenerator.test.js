/**
 * Testes unitários para SecurityGenerator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import SecurityGenerator, { createSecurityGenerator } from '../../../src/systems/fase7/SecurityGenerator.js';

describe('SecurityGenerator', () => {
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

    generator = createSecurityGenerator(mockConfig, mockLogger, mockErrorHandler);
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

    it('deve gerar E2E Encryption', async () => {
      const result = await generator.execute({
        action: 'generate',
        type: 'e2e-encryption'
      });

      expect(result.code).toBeDefined();
      expect(result.code).toContain('E2EEncryption');
    });

    it('deve gerar RLS Policy', async () => {
      const result = await generator.execute({
        action: 'generate',
        type: 'rls-policy',
        parameters: { tableName: 'users' }
      });

      expect(result.code).toBeDefined();
      expect(result.code).toContain('users');
    });
  });
});
