/**
 * Testes unitários para DatabaseTemplateManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import DatabaseTemplateManager, { createDatabaseTemplateManager } from '../../../src/systems/fase5/DatabaseTemplateManager.js';

describe('DatabaseTemplateManager', () => {
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

    manager = createDatabaseTemplateManager(mockConfig, mockLogger, mockErrorHandler);
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

    it('deve retornar template de Migration', () => {
      const template = manager.getTemplate('migration');
      expect(template).toBeDefined();
      expect(template.name).toBe('Migration');
    });

    it('deve retornar template de Index', () => {
      const template = manager.getTemplate('index');
      expect(template).toBeDefined();
      expect(template.name).toBe('Index');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve executar geração de template', async () => {
      const result = await manager.execute({
        action: 'generate',
        templateId: 'migration',
        parameters: {
          migrationName: 'CreateUsers',
          timestamp: new Date().toISOString(),
          tableName: 'users'
        }
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
