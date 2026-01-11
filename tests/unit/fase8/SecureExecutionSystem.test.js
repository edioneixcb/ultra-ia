/**
 * Testes unitários para SecureExecutionSystem
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import SecureExecutionSystem, { createSecureExecutionSystem } from '../../../src/systems/fase8/SecureExecutionSystem.js';

describe('SecureExecutionSystem', () => {
  let system;
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

    system = createSecureExecutionSystem(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await system.initialize();
      expect(system.executions).toBeDefined();
      expect(system.monitors).toBeDefined();
    });
  });

  describe('validatePreExecution', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve validar código seguro', async () => {
      const code = 'const x = 1;';
      const result = await system.validatePreExecution(code, {});

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
    });

    it('deve detectar código perigoso', async () => {
      const code = 'eval("dangerous code");';
      const result = await system.validatePreExecution(code, {});

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve executar código seguro', async () => {
      const result = await system.execute({
        action: 'execute',
        code: 'const x = 1;'
      });

      expect(result).toBeDefined();
      expect(result.executed).toBeDefined();
    });

    it('deve rejeitar código perigoso', async () => {
      const result = await system.execute({
        action: 'execute',
        code: 'eval("dangerous");',
        options: { strict: true }
      });

      expect(result.executed).toBe(false);
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = system.onValidate({
        action: 'execute'
      });
      expect(result.valid).toBe(true);
    });
  });
});
