/**
 * Testes unitários para EmulatorController
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import EmulatorController, { createEmulatorController } from '../../../src/utils/EmulatorController.js';

describe('EmulatorController', () => {
  let controller;
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

    controller = createEmulatorController(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await controller.initialize();
      expect(controller.emulators).toBeDefined();
      expect(controller.sessions).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await controller.initialize();
    });

    it('deve detectar emuladores', async () => {
      const result = await controller.execute({
        action: 'detect'
      });

      expect(result).toBeDefined();
      expect(result.emulators).toBeDefined();
    });

    it('deve executar testes em emulador', async () => {
      const result = await controller.execute({
        action: 'run',
        emulatorId: 'test-emulator'
      });

      expect(result).toBeDefined();
      expect(result.tests).toBeDefined();
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = controller.onValidate({
        action: 'detect'
      });
      expect(result.valid).toBe(true);
    });
  });
});
