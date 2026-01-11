/**
 * Integração dos sistemas da FASE 0 com ComponentRegistry e ConfigSchema
 * 
 * Registra todos os sistemas da FASE 0 no ComponentRegistry e define
 * schemas de configuração para cada sistema.
 */

import ComponentRegistry, { createComponentRegistry } from '../../core/ComponentRegistry.js';
import ConfigSchema, { createConfigSchema } from '../../core/ConfigSchema.js';
import {
  createBaselineManager,
  createAntiSkipMechanism,
  createThreeERuleValidator,
  createAbsoluteCertaintyAnalyzer,
  createCompleteContractAnalyzer,
  createCheckpointManager
} from './index.js';

/**
 * Registra todos os sistemas da FASE 0 no ComponentRegistry
 * 
 * @param {ComponentRegistry} registry - Registry onde registrar
 * @param {Object} dependencies - Dependências (config, logger, errorHandler)
 */
export function registerFase0Systems(registry, dependencies = {}) {
  const { config, logger, errorHandler } = dependencies;

  // BaselineManager
  registry.register('BaselineManager', () => {
    return createBaselineManager(config, logger, errorHandler);
  }, ['config', 'logger', 'errorHandler']);

  // AntiSkipMechanism
  registry.register('AntiSkipMechanism', () => {
    return createAntiSkipMechanism(config, logger, errorHandler);
  }, ['config', 'logger', 'errorHandler']);

  // ThreeERuleValidator
  registry.register('ThreeERuleValidator', () => {
    return createThreeERuleValidator(config, logger, errorHandler);
  }, ['config', 'logger', 'errorHandler']);

  // AbsoluteCertaintyAnalyzer
  registry.register('AbsoluteCertaintyAnalyzer', () => {
    return createAbsoluteCertaintyAnalyzer(config, logger, errorHandler);
  }, ['config', 'logger', 'errorHandler']);

  // CompleteContractAnalyzer
  registry.register('CompleteContractAnalyzer', () => {
    return createCompleteContractAnalyzer(config, logger, errorHandler);
  }, ['config', 'logger', 'errorHandler']);

  // CheckpointManager
  registry.register('CheckpointManager', () => {
    return createCheckpointManager(config, logger, errorHandler);
  }, ['config', 'logger', 'errorHandler']);
}

/**
 * Define schemas de configuração para sistemas da FASE 0
 * 
 * @param {ConfigSchema} configSchema - Schema onde definir
 */
export function defineFase0Schemas(configSchema) {
  // Schema para BaselineManager
  configSchema.defineSystem('baselineManager', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      autoDetect: { type: 'boolean', default: true },
      checkServices: { type: 'boolean', default: false },
      services: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', required: true },
            type: { type: 'string', enum: ['http', 'tcp', 'udp'], default: 'http' },
            url: { type: 'string' },
            port: { type: 'number' }
          }
        },
        default: []
      },
      envVarsFilter: {
        type: 'array',
        items: { type: 'string' },
        default: []
      },
      secretsPaths: {
        type: 'array',
        items: { type: 'string' },
        default: ['.env', '.env.local', 'secrets/', 'config/secrets.json']
      },
      certPaths: {
        type: 'array',
        items: { type: 'string' },
        default: ['certs/', 'certificates/', '/etc/ssl/certs']
      }
    }
  }, {
    enabled: true,
    autoDetect: true,
    checkServices: false,
    services: [],
    envVarsFilter: [],
    secretsPaths: ['.env', '.env.local', 'secrets/', 'config/secrets.json'],
    certPaths: ['certs/', 'certificates/', '/etc/ssl/certs']
  });

  // Schema para AntiSkipMechanism
  configSchema.defineSystem('antiSkipMechanism', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strictMode: { type: 'boolean', default: true },
      logSkipAttempts: { type: 'boolean', default: true },
      blockOnSkip: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    strictMode: true,
    logSkipAttempts: true,
    blockOnSkip: true
  });

  // Schema para ThreeERuleValidator
  configSchema.defineSystem('threeERuleValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strictValidation: { type: 'boolean', default: true },
      allowEmptyStrings: { type: 'boolean', default: false },
      supportedFormats: {
        type: 'array',
        items: { type: 'string' },
        default: ['especificacao', 'especificação', 'specification', 'spec']
      }
    }
  }, {
    enabled: true,
    strictValidation: true,
    allowEmptyStrings: false,
    supportedFormats: ['especificacao', 'especificação', 'specification', 'spec']
  });

  // Schema para AbsoluteCertaintyAnalyzer
  configSchema.defineSystem('absoluteCertaintyAnalyzer', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      requireMultipleSources: { type: 'boolean', default: true },
      minConfidence: { type: 'number', min: 0, max: 1, default: 1.0 },
      maxFalsePositiveRisk: { type: 'number', min: 0, max: 1, default: 0.0 },
      analyzeTransitiveDependencies: { type: 'boolean', default: true },
      crossReferenceDepth: { type: 'number', min: 1, max: 10, default: 3 }
    }
  }, {
    enabled: true,
    requireMultipleSources: true,
    minConfidence: 1.0,
    maxFalsePositiveRisk: 0.0,
    analyzeTransitiveDependencies: true,
    crossReferenceDepth: 3
  });

  // Schema para CompleteContractAnalyzer
  configSchema.defineSystem('completeContractAnalyzer', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      analyzeInheritance: { type: 'boolean', default: true },
      analyzeAliases: { type: 'boolean', default: true },
      analyzeStaticMethods: { type: 'boolean', default: true },
      analyzeTransitiveDeps: { type: 'boolean', default: true },
      checkNativeDuplications: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    analyzeInheritance: true,
    analyzeAliases: true,
    analyzeStaticMethods: true,
    analyzeTransitiveDeps: true,
    checkNativeDuplications: true
  });

  // Schema para CheckpointManager
  configSchema.defineSystem('checkpointManager', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strictMode: { type: 'boolean', default: true },
      requireAllCheckpoints: { type: 'boolean', default: true },
      allowSkipOptional: { type: 'boolean', default: false },
      checkpoints: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', required: true },
            name: { type: 'string', required: true },
            required: { type: 'boolean', default: true },
            qualityGate: {
              type: 'object',
              properties: {
                requiredFields: {
                  type: 'array',
                  items: { type: 'string' },
                  default: []
                },
                validators: {
                  type: 'array',
                  items: { type: 'string' },
                  default: []
                }
              }
            }
          }
        },
        default: []
      }
    }
  }, {
    enabled: true,
    strictMode: true,
    requireAllCheckpoints: true,
    allowSkipOptional: false,
    checkpoints: []
  });
}

/**
 * Inicializa integração completa da FASE 0
 * 
 * @param {ComponentRegistry} registry - Registry
 * @param {ConfigSchema} configSchema - Config Schema
 * @param {Object} dependencies - Dependências
 */
export function initializeFase0Integration(registry, configSchema, dependencies = {}) {
  // Definir schemas primeiro
  defineFase0Schemas(configSchema);

  // Registrar sistemas
  registerFase0Systems(registry, dependencies);

  return {
    registered: registry.getAllRegistered().filter(name => 
      ['BaselineManager', 'AntiSkipMechanism', 'ThreeERuleValidator', 
       'AbsoluteCertaintyAnalyzer', 'CompleteContractAnalyzer', 'CheckpointManager'].includes(name)
    ),
    schemas: configSchema.getAllSystems().filter(name =>
      ['baselineManager', 'antiSkipMechanism', 'threeERuleValidator',
       'absoluteCertaintyAnalyzer', 'completeContractAnalyzer', 'checkpointManager'].includes(name)
    )
  };
}
