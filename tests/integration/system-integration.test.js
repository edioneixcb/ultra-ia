/**
 * Testes de integração do sistema completo
 */

import { describe, it, expect, beforeEach } from 'vitest';
import ComponentRegistry from '../../src/core/ComponentRegistry.js';

describe('System Integration', () => {
  let registry;
  let config;
  let logger;
  let errorHandler;

  beforeEach(() => {
    // Criar novo registry para cada teste
    registry = new ComponentRegistry({ logger: null, errorHandler: null });
    config = { test: true };
    logger = {
      info: () => {},
      debug: () => {},
      warn: () => {},
      error: () => {}
    };
    errorHandler = {
      handleError: () => {}
    };

    // Registrar dependências básicas
    registry.register('config', () => config);
    registry.register('logger', () => logger);
    registry.register('errorHandler', () => errorHandler);
  });

  it('deve registrar sistemas básicos', () => {
    // Teste básico de registro
    registry.register('testSystem', () => ({ test: true }), ['config', 'logger']);
    
    const testSystem = registry.get('testSystem');
    expect(testSystem).toBeDefined();
    expect(testSystem.test).toBe(true);
  });

  it('deve resolver dependências corretamente', () => {
    registry.register('dep1', () => ({ value: 1 }));
    registry.register('dep2', () => ({ value: 2 }), ['dep1']);
    registry.register('system', () => ({ value: 3 }), ['dep1', 'dep2']);
    
    const system = registry.get('system');
    expect(system).toBeDefined();
    expect(system.value).toBe(3);
  });
});
