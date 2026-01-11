/**
 * Testes unitários para BaseSystem
 * 
 * Valida contrato base e funcionalidades de inicialização e execução
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import BaseSystem from '../../src/core/BaseSystem.js';

// Sistema de teste que estende BaseSystem
class TestSystem extends BaseSystem {
  constructor(config, logger, errorHandler) {
    super(config, logger, errorHandler);
    this.initializedData = null;
  }

  async onInitialize() {
    this.initializedData = { initialized: true };
  }

  async onExecute(context) {
    return {
      system: 'TestSystem',
      context,
      initialized: this.initializedData !== null
    };
  }

  onValidate(context) {
    if (!context.required) {
      return { valid: false, errors: ['required field missing'] };
    }
    return { valid: true };
  }

  onGetDependencies() {
    return ['logger', 'config'];
  }
}

describe('BaseSystem', () => {
  let mockConfig;
  let mockLogger;
  let mockErrorHandler;

  beforeEach(() => {
    mockConfig = { test: true };
    mockLogger = {
      info: () => {},
      debug: () => {},
      warn: () => {},
      error: () => {}
    };
    mockErrorHandler = {
      handleError: () => {}
    };
  });

  describe('constructor', () => {
    it('deve criar instância com config, logger e errorHandler', () => {
      const system = new TestSystem(mockConfig, mockLogger, mockErrorHandler);

      expect(system.config).toBe(mockConfig);
      expect(system.logger).toBe(mockLogger);
      expect(system.errorHandler).toBe(mockErrorHandler);
      expect(system.initialized).toBe(false);
    });

    it('deve criar instância com valores padrão null', () => {
      const system = new TestSystem();

      expect(system.config).toBeNull();
      expect(system.logger).toBeNull();
      expect(system.errorHandler).toBeNull();
    });
  });

  describe('initialize', () => {
    it('deve inicializar sistema e chamar onInitialize', async () => {
      const system = new TestSystem(mockConfig, mockLogger, mockErrorHandler);

      await system.initialize();

      expect(system.initialized).toBe(true);
      expect(system.initializedData).toEqual({ initialized: true });
    });

    it('não deve inicializar duas vezes', async () => {
      const warnSpy = vi.fn();
      const loggerWithSpy = { ...mockLogger, warn: warnSpy };
      const system = new TestSystem(mockConfig, loggerWithSpy, mockErrorHandler);

      await system.initialize();
      await system.initialize();

      expect(system.initialized).toBe(true);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('execute', () => {
    it('deve executar sistema e retornar resultado', async () => {
      const system = new TestSystem(mockConfig, mockLogger, mockErrorHandler);
      await system.initialize();

      const result = await system.execute({ test: 'data' });

      expect(result.system).toBe('TestSystem');
      expect(result.context.test).toBe('data');
      expect(result.initialized).toBe(true);
    });

    it('deve inicializar automaticamente se não inicializado', async () => {
      const system = new TestSystem(mockConfig, mockLogger, mockErrorHandler);

      const result = await system.execute({ test: 'data' });

      expect(system.initialized).toBe(true);
      expect(result.initialized).toBe(true);
    });

    it('deve validar contexto antes de executar', async () => {
      const system = new TestSystem(mockConfig, mockLogger, mockErrorHandler);

      await expect(
        system.execute(null)
      ).rejects.toThrow('Context deve ser um objeto');
    });

    it('deve lançar erro se onExecute não implementado', async () => {
      class IncompleteSystem extends BaseSystem {}
      const system = new IncompleteSystem(mockConfig, mockLogger, mockErrorHandler);

      await expect(
        system.execute({})
      ).rejects.toThrow('onExecute() deve ser implementado');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const system = new TestSystem(mockConfig, mockLogger, mockErrorHandler);
      const result = system.validate({ required: true });

      expect(result.valid).toBe(true);
    });

    it('deve retornar erros para contexto inválido', () => {
      const system = new TestSystem(mockConfig, mockLogger, mockErrorHandler);
      const result = system.validate({});

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('required field missing');
    });

    it('deve validar contexto básico (objeto não nulo)', () => {
      const system = new TestSystem(mockConfig, mockLogger, mockErrorHandler);
      const result = system.validate(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Context deve ser um objeto não nulo');
    });
  });

  describe('getDependencies', () => {
    it('deve retornar dependências declaradas', () => {
      const system = new TestSystem(mockConfig, mockLogger, mockErrorHandler);
      const deps = system.getDependencies();

      expect(deps).toEqual(['logger', 'config']);
    });

    it('deve retornar array vazio se sem dependências', () => {
      class NoDepsSystem extends BaseSystem {}
      const system = new NoDepsSystem();
      const deps = system.getDependencies();

      expect(deps).toEqual([]);
    });
  });

  describe('isInitialized', () => {
    it('deve retornar false antes de inicializar', () => {
      const system = new TestSystem(mockConfig, mockLogger, mockErrorHandler);
      expect(system.isInitialized()).toBe(false);
    });

    it('deve retornar true após inicializar', async () => {
      const system = new TestSystem(mockConfig, mockLogger, mockErrorHandler);
      await system.initialize();
      expect(system.isInitialized()).toBe(true);
    });
  });

  describe('getName', () => {
    it('deve retornar nome da classe', () => {
      const system = new TestSystem(mockConfig, mockLogger, mockErrorHandler);
      expect(system.getName()).toBe('TestSystem');
    });
  });
});
