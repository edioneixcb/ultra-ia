/**
 * Integração dos sistemas da FASE 10 com ComponentRegistry e ConfigSchema
 */

import { getComponentRegistry, getConfigSchema } from '../../core/index.js';
import SystemIntegrator, { createSystemIntegrator } from './SystemIntegrator.js';
import EndToEndTestRunner, { createEndToEndTestRunner } from './EndToEndTestRunner.js';
import FinalValidator, { createFinalValidator } from './FinalValidator.js';

/**
 * Registra todos os sistemas da FASE 10 no ComponentRegistry
 */
export function registerFase10Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  registry.register('SystemIntegrator', () => createSystemIntegrator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('EndToEndTestRunner', () => createEndToEndTestRunner(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('FinalValidator', () => createFinalValidator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
}

/**
 * Define schemas de configuração para todos os sistemas da FASE 10
 */
export function defineFase10Schemas(configSchema) {
  configSchema.defineSystem('systemIntegrator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strict: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    strict: true
  });

  configSchema.defineSystem('endToEndTestRunner', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      timeout: { type: 'number', default: 60000 }
    }
  }, {
    enabled: true,
    timeout: 60000
  });

  configSchema.defineSystem('finalValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      validatePerformance: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    validatePerformance: true
  });
}

/**
 * Inicializa todos os sistemas da FASE 10
 */
export async function initializeFase10Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  registerFase10Systems(config, logger, errorHandler);

  const configSchema = getConfigSchema();
  defineFase10Schemas(configSchema);

  const systemNames = [
    'SystemIntegrator',
    'EndToEndTestRunner',
    'FinalValidator'
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

  logger?.info('Todos os sistemas da FASE 10 foram inicializados');
}
