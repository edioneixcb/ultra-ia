/**
 * Testes unitários para IntegrationGenerator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import IntegrationGenerator, { createIntegrationGenerator } from '../../../src/systems/fase7/IntegrationGenerator.js';

describe('IntegrationGenerator', () => {
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

    generator = createIntegrationGenerator(mockConfig, mockLogger, mockErrorHandler);
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

    it('deve gerar Webhook Handler', async () => {
      const result = await generator.execute({
        action: 'generate',
        type: 'webhook-handler'
      });

      expect(result.code).toBeDefined();
      expect(result.code).toContain('WebhookHandler');
    });

    it('deve gerar API Client', async () => {
      const result = await generator.execute({
        action: 'generate',
        type: 'api-client',
        parameters: { apiName: 'TestAPI' }
      });

      expect(result.code).toBeDefined();
      expect(result.code).toContain('TestAPIClient');
    });
  });
});
