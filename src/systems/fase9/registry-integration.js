/**
 * Integração dos sistemas da FASE 9 com ComponentRegistry e ConfigSchema
 */

import { getComponentRegistry, getConfigSchema } from '../../core/index.js';
import PlatformDetector, { createPlatformDetector } from './PlatformDetector.js';
import PlatformSpecificGenerator, { createPlatformSpecificGenerator } from './PlatformSpecificGenerator.js';
import CrossPlatformValidator, { createCrossPlatformValidator } from './CrossPlatformValidator.js';
import PlatformTestRunner, { createPlatformTestRunner } from './PlatformTestRunner.js';
import BrowserAutomation, { createBrowserAutomation } from '../../utils/BrowserAutomation.js';
import EmulatorController, { createEmulatorController } from '../../utils/EmulatorController.js';

/**
 * Registra todos os sistemas da FASE 9 no ComponentRegistry
 */
export function registerFase9Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  registry.register('PlatformDetector', () => createPlatformDetector(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('PlatformSpecificGenerator', () => createPlatformSpecificGenerator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('CrossPlatformValidator', () => createCrossPlatformValidator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('PlatformTestRunner', () => createPlatformTestRunner(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('BrowserAutomation', () => createBrowserAutomation(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('EmulatorController', () => createEmulatorController(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
}

/**
 * Define schemas de configuração para todos os sistemas da FASE 9
 */
export function defineFase9Schemas(configSchema) {
  configSchema.defineSystem('platformDetector', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      autoDetect: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    autoDetect: true
  });

  configSchema.defineSystem('platformSpecificGenerator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      responsive: { type: 'boolean', default: false }
    }
  }, {
    enabled: true,
    responsive: false
  });

  configSchema.defineSystem('crossPlatformValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      defaultPlatforms: { type: 'array', default: ['windows', 'linux', 'macos', 'web'] }
    }
  }, {
    enabled: true,
    defaultPlatforms: ['windows', 'linux', 'macos', 'web']
  });

  configSchema.defineSystem('platformTestRunner', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true }
    }
  }, {
    enabled: true
  });

  configSchema.defineSystem('browserAutomation', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      headless: { type: 'boolean', default: true },
      timeout: { type: 'number', default: 30000 }
    }
  }, {
    enabled: true,
    headless: true,
    timeout: 30000
  });

  configSchema.defineSystem('emulatorController', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      autoDetect: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    autoDetect: true
  });
}

/**
 * Inicializa todos os sistemas da FASE 9
 */
export async function initializeFase9Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  registerFase9Systems(config, logger, errorHandler);

  const configSchema = getConfigSchema();
  defineFase9Schemas(configSchema);

  const systemNames = [
    'PlatformDetector',
    'PlatformSpecificGenerator',
    'CrossPlatformValidator',
    'PlatformTestRunner',
    'BrowserAutomation',
    'EmulatorController'
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

  logger?.info('Todos os sistemas da FASE 9 foram inicializados');
}
