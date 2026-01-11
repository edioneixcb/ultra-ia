/**
 * Integração dos sistemas da FASE 1 com ComponentRegistry e ConfigSchema
 */

import { getComponentRegistry, getConfigSchema } from '../../core/index.js';
import DecisionClassifier, { createDecisionClassifier } from './DecisionClassifier.js';
import EvidenceLevelValidator, { createEvidenceLevelValidator } from './EvidenceLevelValidator.js';
import ChainOfThoughtValidator, { createChainOfThoughtValidator } from './ChainOfThoughtValidator.js';
import ProactiveAnticipationSystem, { createProactiveAnticipationSystem } from './ProactiveAnticipationSystem.js';
import InlineValidatedCodeGenerator, { createInlineValidatedCodeGenerator } from './InlineValidatedCodeGenerator.js';
import ErrorHandlingValidator, { createErrorHandlingValidator } from './ErrorHandlingValidator.js';
import LoggingValidator, { createLoggingValidator } from './LoggingValidator.js';
import TypeValidator, { createTypeValidator } from './TypeValidator.js';
import EnvironmentDetector, { createEnvironmentDetector } from './EnvironmentDetector.js';
import EvidenceChainManager, { createEvidenceChainManager } from './EvidenceChainManager.js';
import StaticAnalyzer, { createStaticAnalyzer } from './StaticAnalyzer.js';
import ConfigValidator, { createConfigValidator } from './ConfigValidator.js';
import TraceabilityMatrixManager, { createTraceabilityMatrixManager } from './TraceabilityMatrixManager.js';

/**
 * Registra todos os sistemas da FASE 1 no ComponentRegistry
 * 
 * @param {Object} config - Configuração global
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 */
export function registerFase1Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  // Registrar sistemas da FASE 1
  registry.register('DecisionClassifier', () => createDecisionClassifier(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('EvidenceLevelValidator', () => createEvidenceLevelValidator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('ChainOfThoughtValidator', () => createChainOfThoughtValidator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('ProactiveAnticipationSystem', () => createProactiveAnticipationSystem(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('InlineValidatedCodeGenerator', () => createInlineValidatedCodeGenerator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('ErrorHandlingValidator', () => createErrorHandlingValidator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('LoggingValidator', () => createLoggingValidator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('TypeValidator', () => createTypeValidator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('EnvironmentDetector', () => createEnvironmentDetector(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('EvidenceChainManager', () => createEvidenceChainManager(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('StaticAnalyzer', () => createStaticAnalyzer(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('ConfigValidator', () => createConfigValidator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('TraceabilityMatrixManager', () => createTraceabilityMatrixManager(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
}

/**
 * Define schemas de configuração para todos os sistemas da FASE 1
 * 
 * @param {ConfigSchema} configSchema - Instância do ConfigSchema
 */
export function defineFase1Schemas(configSchema) {
  // DecisionClassifier
  configSchema.defineSystem('decisionClassifier', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      levels: {
        type: 'object',
        properties: {
          level1: { type: 'object', properties: { threshold: { type: 'number' }, action: { type: 'string' } } },
          level2: { type: 'object', properties: { threshold: { type: 'number' }, action: { type: 'string' } } },
          level3: { type: 'object', properties: { threshold: { type: 'number' }, action: { type: 'string' } } }
        }
      }
    }
  }, {
    enabled: true,
    levels: {
      level1: { threshold: 0.8, action: 'block' },
      level2: { threshold: 0.5, action: 'warn' },
      level3: { threshold: 0.0, action: 'allow' }
    }
  });

  // EvidenceLevelValidator
  configSchema.defineSystem('evidenceLevelValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      requiredLevels: { type: 'object' }
    }
  }, {
    enabled: true,
    requiredLevels: {
      critical: 'Completa',
      high: 'Padrão',
      medium: 'Resumida',
      low: 'Mínima'
    }
  });

  // ChainOfThoughtValidator
  configSchema.defineSystem('chainOfThoughtValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      requiredComponents: { type: 'array', items: { type: 'string' } }
    }
  }, {
    enabled: true,
    requiredComponents: ['observacao', 'analise', 'decisao', 'acao']
  });

  // ProactiveAnticipationSystem
  configSchema.defineSystem('proactiveAnticipationSystem', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      maxHistoricalErrors: { type: 'number', default: 100 },
      patternDetection: { type: 'object' }
    }
  }, {
    enabled: true,
    maxHistoricalErrors: 100,
    patternDetection: {
      enabled: true
    }
  });

  // InlineValidatedCodeGenerator
  configSchema.defineSystem('inlineValidatedCodeGenerator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      validation: { type: 'object' }
    }
  }, {
    enabled: true,
    validation: {
      maxIterations: 10,
      autoCorrect: true,
      protectCriticalCode: true
    }
  });

  // ErrorHandlingValidator
  configSchema.defineSystem('errorHandlingValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strict: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    strict: true
  });

  // LoggingValidator
  configSchema.defineSystem('loggingValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strict: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    strict: true
  });

  // TypeValidator
  configSchema.defineSystem('typeValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strict: { type: 'boolean', default: true },
      inferTypes: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    strict: true,
    inferTypes: true
  });

  // EnvironmentDetector
  configSchema.defineSystem('environmentDetector', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      autoDetect: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    autoDetect: true
  });

  // EvidenceChainManager
  configSchema.defineSystem('evidenceChainManager', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      preserveRawEvidence: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    preserveRawEvidence: true
  });

  // StaticAnalyzer
  configSchema.defineSystem('staticAnalyzer', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      analysisTypes: { type: 'array', items: { type: 'string' } }
    }
  }, {
    enabled: true,
    analysisTypes: ['imports', 'contracts', 'security', 'patterns']
  });

  // ConfigValidator
  configSchema.defineSystem('configValidator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      validateOnStartup: { type: 'boolean', default: true },
      strict: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    validateOnStartup: true,
    strict: true
  });

  // TraceabilityMatrixManager
  configSchema.defineSystem('traceabilityMatrixManager', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      validateOnCreate: { type: 'boolean', default: false },
      strict: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    validateOnCreate: false,
    strict: true
  });
}

/**
 * Inicializa todos os sistemas da FASE 1
 * 
 * @param {Object} config - Configuração global
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 */
export async function initializeFase1Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  // Registrar sistemas
  registerFase1Systems(config, logger, errorHandler);

  // Definir schemas
  const configSchema = getConfigSchema();
  defineFase1Schemas(configSchema);

  // Inicializar sistemas
  const systemNames = [
    'DecisionClassifier',
    'EvidenceLevelValidator',
    'ChainOfThoughtValidator',
    'ProactiveAnticipationSystem',
    'InlineValidatedCodeGenerator',
    'ErrorHandlingValidator',
    'LoggingValidator',
    'TypeValidator',
    'EnvironmentDetector',
    'EvidenceChainManager',
    'StaticAnalyzer',
    'ConfigValidator',
    'TraceabilityMatrixManager'
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

  logger?.info('Todos os sistemas da FASE 1 foram inicializados');
}
