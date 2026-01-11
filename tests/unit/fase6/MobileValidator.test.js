/**
 * Testes unitários para MobileValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import MobileValidator, { createMobileValidator } from '../../../src/systems/fase6/MobileValidator.js';

describe('MobileValidator', () => {
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

    validator = createMobileValidator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validations).toBeDefined();
    });
  });

  describe('validateExpoRouter', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar Expo Router correto', async () => {
      const code = `
        import { useRouter } from 'expo-router';
        import { StyleSheet } from 'react-native';
      `;

      const result = await validator.validateExpoRouter(code, {});

      expect(result).toBeDefined();
      expect(result.type).toBe('expo-router');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve executar validação mobile', async () => {
      const result = await validator.execute({
        action: 'validate',
        code: 'test',
        type: 'expo-router'
      });

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
    });
  });
});
