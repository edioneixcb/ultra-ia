/**
 * Testes unitários para SecurityTemplateManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import SecurityTemplateManager, { createSecurityTemplateManager } from '../../../src/systems/fase5/SecurityTemplateManager.js';

describe('SecurityTemplateManager', () => {
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

    manager = createSecurityTemplateManager(mockConfig, mockLogger, mockErrorHandler);
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

    it('deve retornar template de E2E Encryption', () => {
      const template = manager.getTemplate('e2e-encryption');
      expect(template).toBeDefined();
      expect(template.name).toBe('E2E Encryption');
    });

    it('deve retornar template de OAuth Handler', () => {
      const template = manager.getTemplate('oauth-handler');
      expect(template).toBeDefined();
      expect(template.name).toBe('OAuth Handler');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve executar geração de template', async () => {
      const result = await manager.execute({
        action: 'generate',
        templateId: 'jwt-middleware',
        parameters: {}
      });

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
    });

    it('deve executar listagem de templates', async () => {
      const result = await manager.execute({
        action: 'listTemplates'
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
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
