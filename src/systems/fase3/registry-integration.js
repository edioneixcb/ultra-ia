/**
 * Integração dos sistemas da FASE 3 com ComponentRegistry e ConfigSchema
 */

import { getComponentRegistry, getConfigSchema } from '../../core/index.js';
import TestExpectationValidator, { createTestExpectationValidator } from './TestExpectationValidator.js';
import TestValidator, { createTestValidator } from './TestValidator.js';
import AccurateDocumentationSystem, { createAccurateDocumentationSystem } from './AccurateDocumentationSystem.js';
import MetaValidationSystem, { createMetaValidationSystem } from './MetaValidationSystem.js';

/**
 * Registra todos os sistemas da FASE 3 no ComponentRegistry
 * 
 * @param {Object} config - Configuração global
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 */
export function registerFase3Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  // Registrar sistemas da FASE 3
  registry.register('TestExpectationValidator', () => createTestExpectationValidator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('TestValidator', () => createTestValidator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('AccurateDocumentationSystem', () => createAccurateDocumentationSystem(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('MetaValidationSystem', () => createMetaValidationSystem(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
}

/**
 * Define schemas de configuração para todos os sistemas da FASE 3
 * 
 * @param {ConfigSchema} configSchema - Instância do ConfigSchema
 */
export function defineFase3Schemas(configSchema) {
  // TestExpectationValidator
  configSchema.defineSystem('testExpectationValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strictIsolation: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    strictIsolation: true
  });

  // TestValidator
  configSchema.defineSystem('testValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      autoUpdate: { type: 'boolean', default: false },
      strictValidation: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    autoUpdate: false,
    strictValidation: true
  });

  // AccurateDocumentationSystem
  configSchema.defineSystem('accurateDocumentationSystem', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      autoUpdate: { type: 'boolean', default: false },
      requireEvidence: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    autoUpdate: false,
    requireEvidence: true
  });

  // MetaValidationSystem
  configSchema.defineSystem('metaValidationSystem', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strictMode: { type: 'boolean', default: true },
      requireAllChecklistItems: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    strictMode: true,
    requireAllChecklistItems: true
  });
}

/**
 * Inicializa todos os sistemas da FASE 3
 * 
 * @param {Object} config - Configuração global
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 */
export async function initializeFase3Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  // Registrar sistemas
  registerFase3Systems(config, logger, errorHandler);

  // Definir schemas
  const configSchema = getConfigSchema();
  defineFase3Schemas(configSchema);

  // Inicializar sistemas
  const systemNames = [
    'TestExpectationValidator',
    'TestValidator',
    'AccurateDocumentationSystem',
    'MetaValidationSystem'
  ];

  for (const systemName of systemNames) {
    try {
      const system = registry.get(systemName);
      if (system && typeof system.initialize === 'function') {
        await system.initialize();
        logger?.info(`Sistema ${systemName} inicializado`);
      }
    } catch (error) {
      logger?.error(`Erro ao inicializar ${systemName}`, { error });
      errorHandler?.handleError(error, { system: systemName });
    }
  }

  logger?.info('Todos os sistemas da FASE 3 foram inicializados');
}
