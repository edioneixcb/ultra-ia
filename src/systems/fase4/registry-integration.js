/**
 * Integração dos sistemas da FASE 4 com ComponentRegistry e ConfigSchema
 */

import { getComponentRegistry, getConfigSchema } from '../../core/index.js';
import KnowledgeBaseIndexer, { createKnowledgeBaseIndexer } from './KnowledgeBaseIndexer.js';
import KnowledgeBaseManager, { createKnowledgeBaseManager } from './KnowledgeBaseManager.js';
import PatternDocumentationSystem, { createPatternDocumentationSystem } from './PatternDocumentationSystem.js';
import TemplateGenerator, { createTemplateGenerator } from './TemplateGenerator.js';

/**
 * Registra todos os sistemas da FASE 4 no ComponentRegistry
 * 
 * @param {Object} config - Configuração global
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 */
export function registerFase4Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  // Registrar sistemas da FASE 4
  registry.register('KnowledgeBaseIndexer', () => createKnowledgeBaseIndexer(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('KnowledgeBaseManager', () => createKnowledgeBaseManager(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('PatternDocumentationSystem', () => createPatternDocumentationSystem(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
  registry.register('TemplateGenerator', () => createTemplateGenerator(config, logger, errorHandler), ['config', 'logger', 'errorHandler']);
}

/**
 * Define schemas de configuração para todos os sistemas da FASE 4
 * 
 * @param {ConfigSchema} configSchema - Instância do ConfigSchema
 */
export function defineFase4Schemas(configSchema) {
  // KnowledgeBaseIndexer
  configSchema.defineSystem('knowledgeBaseIndexer', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      includePatterns: { type: 'boolean', default: true },
      extractExamples: { type: 'boolean', default: true },
      categorize: { type: 'boolean', default: true },
      addMetadata: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    includePatterns: true,
    extractExamples: true,
    categorize: true,
    addMetadata: true
  });

  // KnowledgeBaseManager
  configSchema.defineSystem('knowledgeBaseManager', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      autoCategorize: { type: 'boolean', default: true },
      autoTag: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    autoCategorize: true,
    autoTag: true
  });

  // PatternDocumentationSystem
  configSchema.defineSystem('patternDocumentationSystem', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      autoInferCategory: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    autoInferCategory: true
  });

  // TemplateGenerator
  configSchema.defineSystem('templateGenerator', {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      validateGenerated: { type: 'boolean', default: true },
      autoCustomize: { type: 'boolean', default: true }
    }
  }, {
    enabled: true,
    validateGenerated: true,
    autoCustomize: true
  });
}

/**
 * Inicializa todos os sistemas da FASE 4
 * 
 * @param {Object} config - Configuração global
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 */
export async function initializeFase4Systems(config, logger, errorHandler) {
  const registry = getComponentRegistry();

  // Registrar sistemas
  registerFase4Systems(config, logger, errorHandler);

  // Definir schemas
  const configSchema = getConfigSchema();
  defineFase4Schemas(configSchema);

  // Inicializar sistemas
  const systemNames = [
    'KnowledgeBaseIndexer',
    'KnowledgeBaseManager',
    'PatternDocumentationSystem',
    'TemplateGenerator'
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

  logger?.info('Todos os sistemas da FASE 4 foram inicializados');
}
