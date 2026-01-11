/**
 * Integração dos sistemas da FASE 8 com ComponentRegistry e ConfigSchema
 */

import { getComponentRegistry, getConfigSchema } from '../../core/index.js';
import IncrementalCodeGenerator, { createIncrementalCodeGenerator } from './IncrementalCodeGenerator.js';
import PatternLearner, { createPatternLearner } from './PatternLearner.js';
import MultiLayerValidatorEnhanced, { createMultiLayerValidatorEnhanced } from './MultiLayerValidatorEnhanced.js';
import SecureExecutionSystem, { createSecureExecutionSystem } from './SecureExecutionSystem.js';

/**
 * Registra todos os sistemas da FASE 8 no ComponentRegistry
 */
export function registerFase8Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  registry.register('IncrementalCodeGenerator', () => createIncrementalCodeGenerator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('PatternLearner', () => createPatternLearner(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('MultiLayerValidatorEnhanced', () => createMultiLayerValidatorEnhanced(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('SecureExecutionSystem', () => createSecureExecutionSystem(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
}

/**
 * Define schemas de configuração para todos os sistemas da FASE 8
 */
export function defineFase8Schemas(configSchema) {
  configSchema.defineSystem('incrementalCodeGenerator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      stopOnInvalid: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    stopOnInvalid: true
  });

  configSchema.defineSystem('patternLearner', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      autoExtract: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    autoExtract: true
  });

  configSchema.defineSystem('multiLayerValidatorEnhanced', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      defaultLayers: { type: 'array', default: ['syntax', 'structure', 'semantics', 'security'] }
    }
  }, {
    enabled: true,
    defaultLayers: ['syntax', 'structure', 'semantics', 'security']
  });

  configSchema.defineSystem('secureExecutionSystem', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strict: { type: 'boolean', default: true },
      timeout: { type: 'number', default: 30000 }
    }
  }, {
    enabled: true,
    strict: true,
    timeout: 30000
  });
}

/**
 * Inicializa todos os sistemas da FASE 8
 */
export async function initializeFase8Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  registerFase8Systems(config, logger, errorHandler);

  const configSchema = getConfigSchema();
  defineFase8Schemas(configSchema);

  const systemNames = [
    'IncrementalCodeGenerator',
    'PatternLearner',
    'MultiLayerValidatorEnhanced',
    'SecureExecutionSystem'
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

  logger?.info('Todos os sistemas da FASE 8 foram inicializados');
}
