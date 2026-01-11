/**
 * Integração dos sistemas da FASE 5 com ComponentRegistry e ConfigSchema
 */

import { getComponentRegistry, getConfigSchema } from '../../core/index.js';
import ArchitectureTemplateManager, { createArchitectureTemplateManager } from './ArchitectureTemplateManager.js';
import SecurityTemplateManager, { createSecurityTemplateManager } from './SecurityTemplateManager.js';
import IntegrationTemplateManager, { createIntegrationTemplateManager } from './IntegrationTemplateManager.js';
import MobileTemplateManager, { createMobileTemplateManager } from './MobileTemplateManager.js';
import DatabaseTemplateManager, { createDatabaseTemplateManager } from './DatabaseTemplateManager.js';

/**
 * Registra todos os sistemas da FASE 5 no ComponentRegistry
 * 
 * @param {Object} config - Configuração global
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 */
export function registerFase5Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  // Registrar sistemas da FASE 5
  registry.register('ArchitectureTemplateManager', () => createArchitectureTemplateManager(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('SecurityTemplateManager', () => createSecurityTemplateManager(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('IntegrationTemplateManager', () => createIntegrationTemplateManager(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('MobileTemplateManager', () => createMobileTemplateManager(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('DatabaseTemplateManager', () => createDatabaseTemplateManager(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
}

/**
 * Define schemas de configuração para todos os sistemas da FASE 5
 * 
 * @param {ConfigSchema} configSchema - Instância do ConfigSchema
 */
export function defineFase5Schemas(configSchema) {
  // ArchitectureTemplateManager
  configSchema.defineSystem('architectureTemplateManager', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      validateGenerated: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    validateGenerated: true
  });

  // SecurityTemplateManager
  configSchema.defineSystem('securityTemplateManager', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      validateGenerated: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    validateGenerated: true
  });

  // IntegrationTemplateManager
  configSchema.defineSystem('integrationTemplateManager', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      validateGenerated: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    validateGenerated: true
  });

  // MobileTemplateManager
  configSchema.defineSystem('mobileTemplateManager', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      validateGenerated: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    validateGenerated: true
  });

  // DatabaseTemplateManager
  configSchema.defineSystem('databaseTemplateManager', {
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
 * Inicializa todos os sistemas da FASE 5
 * 
 * @param {Object} config - Configuração global
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 */
export async function initializeFase5Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  // Registrar sistemas
  registerFase5Systems(config, logger, errorHandler);

  // Definir schemas
  const configSchema = getConfigSchema();
  defineFase5Schemas(configSchema);

  // Inicializar sistemas
  const systemNames = [
    'ArchitectureTemplateManager',
    'SecurityTemplateManager',
    'IntegrationTemplateManager',
    'MobileTemplateManager',
    'DatabaseTemplateManager'
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

  logger?.info('Todos os sistemas da FASE 5 foram inicializados');
}
