/**
 * Testes unitários para SystemIntegrator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import SystemIntegrator, { createSystemIntegrator } from '../../../src/systems/fase10/SystemIntegrator.js';
import { getComponentRegistry } from '../../../src/core/index.js';

describe('SystemIntegrator', () => {
  let integrator;
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

    integrator = createSystemIntegrator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await integrator.initialize();
      expect(integrator.integrations).toBeDefined();
      expect(integrator.systemGraph).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await integrator.initialize();
    });

    it('deve executar integração de sistemas', async () => {
      const result = await integrator.execute({
        action: 'integrate',
        systems: []
      });

      expect(result).toBeDefined();
      expect(result.integrated).toBeDefined();
    });

    it('deve lançar erro se action não fornecido', async () => {
      await expect(
        integrator.execute({})
      ).rejects.toThrow('action é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = integrator.onValidate({
        action: 'integrate'
      });
      expect(result.valid).toBe(true);
    });
  });
});
