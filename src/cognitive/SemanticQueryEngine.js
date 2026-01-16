/**
 * SemanticQueryEngine
 *
 * Interface de busca semântica sobre o Knowledge Graph.
 */

import { getLogger } from '../utils/Logger.js';
import { getProjectKnowledgeGraph } from './ProjectKnowledgeGraph.js';

class SemanticQueryEngine {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.graph = getProjectKnowledgeGraph(config, this.logger);
    this.defaultLimit = config?.proactive?.semanticQuery?.limit || 10;
  }

  search(query, limit = this.defaultLimit) {
    if (!query || typeof query !== 'string') {
      return [];
    }
    return this.graph.search(query, limit);
  }
}

let instance = null;

/**
 * Obtém instância singleton do SemanticQueryEngine.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {SemanticQueryEngine} Instância
 */
export function getSemanticQueryEngine(config = null, logger = null) {
  if (!instance) {
    instance = new SemanticQueryEngine(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do SemanticQueryEngine.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {SemanticQueryEngine} Nova instância
 */
export function createSemanticQueryEngine(config = null, logger = null) {
  return new SemanticQueryEngine(config, logger);
}

export default SemanticQueryEngine;
