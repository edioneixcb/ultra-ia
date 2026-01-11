/**
 * Testes unitários para IntegrationTemplateManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import IntegrationTemplateManager, { createIntegrationTemplateManager } from '../../../src/systems/fase5/IntegrationTemplateManager.js';

describe('IntegrationTemplateManager', () => {
  let manager;
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

    manager = createIntegrationTemplateManager(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await manager.initialize();
      expect(manager.templates).toBeDefined();
      expect(manager.templates.size).toBeGreaterThan(0);
    });
  });

  describe('getTemplate', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve retornar template de Webhook Handler', () => {
      const template = manager.getTemplate('webhook-handler');
      expect(template).toBeDefined();
      expect(template.name).toBe('Webhook Handler');
    });

    it('deve retornar template de API Client', () => {
      const template = manager.getTemplate('api-client');
      expect(template).toBeDefined();
      expect(template.name).toBe('API Client');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve executar geração de template', async () => {
      const result = await manager.execute({
        action: 'generate',
        templateId: 'api-client',
        parameters: { ApiName: 'Test' }
      });

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = manager.onValidate({
        action: 'generate'
      });
      expect(result.valid).toBe(true);
    });
  });
});
