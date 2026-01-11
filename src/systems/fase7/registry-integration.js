/**
 * Integração dos sistemas da FASE 7 com ComponentRegistry e ConfigSchema
 */

import { getComponentRegistry, getConfigSchema } from '../../core/index.js';
import ArchitectureGenerator, { createArchitectureGenerator } from './ArchitectureGenerator.js';
import SecurityGenerator, { createSecurityGenerator } from './SecurityGenerator.js';
import IntegrationGenerator, { createIntegrationGenerator } from './IntegrationGenerator.js';
import MobileGenerator, { createMobileGenerator } from './MobileGenerator.js';
import DatabaseGenerator, { createDatabaseGenerator } from './DatabaseGenerator.js';

/**
 * Registra todos os sistemas da FASE 7 no ComponentRegistry
 */
export function registerFase7Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  registry.register('ArchitectureGenerator', () => createArchitectureGenerator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('SecurityGenerator', () => createSecurityGenerator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('IntegrationGenerator', () => createIntegrationGenerator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('MobileGenerator', () => createMobileGenerator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('DatabaseGenerator', () => createDatabaseGenerator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
}

/**
 * Define schemas de configuração para todos os sistemas da FASE 7
 */
export function defineFase7Schemas(configSchema) {
  configSchema.defineSystem('architectureGenerator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      validateGenerated: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    validateGenerated: true
  });

  configSchema.defineSystem('securityGenerator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      validateGenerated: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    validateGenerated: true
  });

  configSchema.defineSystem('integrationGenerator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      validateGenerated: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    validateGenerated: true
  });

  configSchema.defineSystem('mobileGenerator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      validateGenerated: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    validateGenerated: true
  });

  configSchema.defineSystem('databaseGenerator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      validateGenerated: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    validateGenerated: true
  });
}

/**
 * Inicializa todos os sistemas da FASE 7
 */
export async function initializeFase7Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  registerFase7Systems(config, logger, errorHandler);

  const configSchema = getConfigSchema();
  defineFase7Schemas(configSchema);

  const systemNames = [
    'ArchitectureGenerator',
    'SecurityGenerator',
    'IntegrationGenerator',
    'MobileGenerator',
    'DatabaseGenerator'
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

  logger?.info('Todos os sistemas da FASE 7 foram inicializados');
}
