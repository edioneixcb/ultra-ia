/**
 * Testes unitários para SecurityValidatorEnhanced
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import SecurityValidatorEnhanced, { createSecurityValidatorEnhanced } from '../../../src/systems/fase6/SecurityValidatorEnhanced.js';

describe('SecurityValidatorEnhanced', () => {
  let validator;
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

    validator = createSecurityValidatorEnhanced(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validations).toBeDefined();
    });
  });

  describe('validateE2EEncryption', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar E2E Encryption correto', async () => {
      const code = `
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const authTag = cipher.getAuthTag();
      `;

      const result = await validator.validateE2EEncryption(code, {});

      expect(result).toBeDefined();
      expect(result.type).toBe('e2e-encryption');
    });

    it('deve detectar algoritmo inseguro', async () => {
      const code = 'const cipher = crypto.createCipher("aes-128", key);';

      const result = await validator.validateE2EEncryption(code, {});

      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve executar validação de segurança', async () => {
      const result = await validator.execute({
        action: 'validate',
        code: 'test',
        type: 'e2e-encryption'
      });

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
    });
  });
});
