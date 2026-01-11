/**
 * Testes unitários para IntegrationValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import IntegrationValidator, { createIntegrationValidator } from '../../../src/systems/fase6/IntegrationValidator.js';

describe('IntegrationValidator', () => {
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

    validator = createIntegrationValidator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validations).toBeDefined();
    });
  });

  describe('validateWebhook', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar webhook correto', async () => {
      const code = `
        if (validateSignature(req.body, signature)) {
          res.status(200).json({ received: true });
        }
      `;

      const result = await validator.validateWebhook(code, {});

      expect(result).toBeDefined();
      expect(result.type).toBe('webhook');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve executar validação de integração', async () => {
      const result = await validator.execute({
        action: 'validate',
        code: 'test',
        type: 'webhook'
      });

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
    });
  });
});
