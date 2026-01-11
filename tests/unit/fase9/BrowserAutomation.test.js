/**
 * Testes unitários para BrowserAutomation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import BrowserAutomation, { createBrowserAutomation } from '../../../src/utils/BrowserAutomation.js';

describe('BrowserAutomation', () => {
  let automation;
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

    automation = createBrowserAutomation(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await automation.initialize();
      expect(automation.sessions).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await automation.initialize();
    });

    it('deve navegar para URL', async () => {
      const result = await automation.execute({
        action: 'navigate',
        url: 'https://example.com'
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('deve executar tarefas automatizadas', async () => {
      const result = await automation.execute({
        action: 'executeTasks',
        tasks: [
          { type: 'click', selector: '#button' },
          { type: 'type', selector: '#input', text: 'test' }
        ]
      });

      expect(result).toBeDefined();
      expect(result.tasks).toBeDefined();
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = automation.onValidate({
        action: 'navigate'
      });
      expect(result.valid).toBe(true);
    });
  });
});
