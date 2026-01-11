/**
 * Testes unitários para MobileTemplateManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import MobileTemplateManager, { createMobileTemplateManager } from '../../../src/systems/fase5/MobileTemplateManager.js';

describe('MobileTemplateManager', () => {
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

    manager = createMobileTemplateManager(mockConfig, mockLogger, mockErrorHandler);
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

    it('deve retornar template de Expo Screen', () => {
      const template = manager.getTemplate('expo-screen');
      expect(template).toBeDefined();
      expect(template.name).toBe('Expo Screen');
    });

    it('deve retornar template de WatermelonDB Model', () => {
      const template = manager.getTemplate('watermelon-model');
      expect(template).toBeDefined();
      expect(template.name).toBe('WatermelonDB Model');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve executar geração de template', async () => {
      const result = await manager.execute({
        action: 'generate',
        templateId: 'expo-screen',
        parameters: { ScreenName: 'Home', ScreenTitle: 'Home' }
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
