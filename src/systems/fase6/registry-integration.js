/**
 * Integração dos sistemas da FASE 6 com ComponentRegistry e ConfigSchema
 */

import { getComponentRegistry, getConfigSchema } from '../../core/index.js';
import ArchitectureValidator, { createArchitectureValidator } from './ArchitectureValidator.js';
import SecurityValidatorEnhanced, { createSecurityValidatorEnhanced } from './SecurityValidatorEnhanced.js';
import IntegrationValidator, { createIntegrationValidator } from './IntegrationValidator.js';
import MobileValidator, { createMobileValidator } from './MobileValidator.js';
import DatabaseValidator, { createDatabaseValidator } from './DatabaseValidator.js';

/**
 * Registra todos os sistemas da FASE 6 no ComponentRegistry
 * 
 * @param {Object} config - Configuração global
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 */
export function registerFase6Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  // Registrar sistemas da FASE 6
  registry.register('ArchitectureValidator', () => createArchitectureValidator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('SecurityValidatorEnhanced', () => createSecurityValidatorEnhanced(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('IntegrationValidator', () => createIntegrationValidator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('MobileValidator', () => createMobileValidator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('DatabaseValidator', () => createDatabaseValidator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
}

/**
 * Define schemas de configuração para todos os sistemas da FASE 6
 * 
 * @param {ConfigSchema} configSchema - Instância do ConfigSchema
 */
export function defineFase6Schemas(configSchema) {
  // ArchitectureValidator
  configSchema.defineSystem('architectureValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strictMode: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    strictMode: true
  });

  // SecurityValidatorEnhanced
  configSchema.defineSystem('securityValidatorEnhanced', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strictMode: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    strictMode: true
  });

  // IntegrationValidator
  configSchema.defineSystem('integrationValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strictMode: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    strictMode: true
  });

  // MobileValidator
  configSchema.defineSystem('mobileValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strictMode: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    strictMode: true
  });

  // DatabaseValidator
  configSchema.defineSystem('databaseValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strictMode: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    strictMode: true
  });
}

/**
 * Inicializa todos os sistemas da FASE 6
 * 
 * @param {Object} config - Configuração global
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 */
export async function initializeFase6Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  // Registrar sistemas
  registerFase6Systems(config, logger, errorHandler);

  // Definir schemas
  const configSchema = getConfigSchema();
  defineFase6Schemas(configSchema);

  // Inicializar sistemas
  const systemNames = [
    'ArchitectureValidator',
    'SecurityValidatorEnhanced',
    'IntegrationValidator',
    'MobileValidator',
    'DatabaseValidator'
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

  logger?.info('Todos os sistemas da FASE 6 foram inicializados');
}
