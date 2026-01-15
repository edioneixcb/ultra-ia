/**
 * Integração dos sistemas da FASE 2 com ComponentRegistry e ConfigSchema
 */

import { getComponentRegistry, getConfigSchema } from '../../core/index.js';
import IntelligentSequentialResolver, { createIntelligentSequentialResolver } from './IntelligentSequentialResolver.js';
import ScoreCalculator, { createScoreCalculator } from './ScoreCalculator.js';
import MultiEnvironmentCompatibilityAnalyzer, { createMultiEnvironmentCompatibilityAnalyzer } from './MultiEnvironmentCompatibilityAnalyzer.js';
import ForensicAnalyzer, { createForensicAnalyzer } from './ForensicAnalyzer.js';
import BatchResolver, { createBatchResolver } from './BatchResolver.js';
import CoverageCalculator, { createCoverageCalculator } from './CoverageCalculator.js';

/**
 * Registra todos os sistemas da FASE 2 no ComponentRegistry
 * 
 * @param {Object} config - Configuração global
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 */
export function registerFase2Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  // Registrar sistemas da FASE 2
  registry.register('IntelligentSequentialResolver', 
    (config, logger, errorHandler, astParser, baselineManager, dockerSandbox) => createIntelligentSequentialResolver(config, logger, errorHandler, astParser, baselineManager, dockerSandbox), 
    ['config', 'logger', 'errorHandler', '?ASTParser', '?BaselineManager', '?DockerSandbox']
  );
  registry.register('ScoreCalculator', () => createScoreCalculator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('MultiEnvironmentCompatibilityAnalyzer', 
    (config, logger, errorHandler, environmentDetector) => createMultiEnvironmentCompatibilityAnalyzer(config, logger, errorHandler, environmentDetector), 
    ['config', 'logger', 'errorHandler', '?EnvironmentDetector']
  );
  registry.register('ForensicAnalyzer', 
    (config, logger, errorHandler, absoluteCertaintyAnalyzer, evidenceChainManager) => createForensicAnalyzer(config, logger, errorHandler, absoluteCertaintyAnalyzer, evidenceChainManager), 
    ['config', 'logger', 'errorHandler', '?AbsoluteCertaintyAnalyzer', '?EvidenceChainManager']
  );
  registry.register('BatchResolver', () => createBatchResolver(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('CoverageCalculator', () => createCoverageCalculator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
}

/**
 * Define schemas de configuração para todos os sistemas da FASE 2
 * 
 * @param {ConfigSchema} configSchema - Instância do ConfigSchema
 */
export function defineFase2Schemas(configSchema) {
  // IntelligentSequentialResolver
  configSchema.defineSystem('intelligentSequentialResolver', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      maxIterations: { type: 'number', default: 10 },
      autoRollback: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    maxIterations: 10,
    autoRollback: true
  });

  // ScoreCalculator
  configSchema.defineSystem('scoreCalculator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      strictNA: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    strictNA: true
  });

  // MultiEnvironmentCompatibilityAnalyzer
  configSchema.defineSystem('multiEnvironmentCompatibilityAnalyzer', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      cacheChangelogs: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    cacheChangelogs: true
  });

  // ForensicAnalyzer
  configSchema.defineSystem('forensicAnalyzer', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      cacheEvidence: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    cacheEvidence: true
  });

  // BatchResolver
  configSchema.defineSystem('batchResolver', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      maxGroupSize: { type: 'number', default: 10 }
    }
  }, {
    enabled: true,
    maxGroupSize: 10
  });

  // CoverageCalculator
  configSchema.defineSystem('coverageCalculator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      minTotalCoverage: { type: 'number', default: 95 },
      minTargetCoverage: { type: 'number', default: 90 }
    }
  }, {
    enabled: true,
    minTotalCoverage: 95,
    minTargetCoverage: 90
  });
}

/**
 * Inicializa todos os sistemas da FASE 2
 * 
 * @param {Object} config - Configuração global
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 */
export async function initializeFase2Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  // Registrar sistemas
  registerFase2Systems(config, logger, errorHandler);

  // Definir schemas
  const configSchema = getConfigSchema();
  defineFase2Schemas(configSchema);

  // Inicializar sistemas
  const systemNames = [
    'IntelligentSequentialResolver',
    'ScoreCalculator',
    'MultiEnvironmentCompatibilityAnalyzer',
    'ForensicAnalyzer',
    'BatchResolver',
    'CoverageCalculator'
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

  logger?.info('Todos os sistemas da FASE 2 foram inicializados');
}
