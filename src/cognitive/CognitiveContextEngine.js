/**
 * CognitiveContextEngine
 *
 * Orquestra o contexto cognitivo usando Knowledge Graph e padrões de estilo.
 */

import { getLogger } from '../utils/Logger.js';
import { getProjectKnowledgeGraph } from './ProjectKnowledgeGraph.js';
import { getImpactAnalyzer } from './ImpactAnalyzer.js';
import { getSemanticQueryEngine } from './SemanticQueryEngine.js';
import { getStylePatternExtractor } from './StylePatternExtractor.js';

class CognitiveContextEngine {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.graph = getProjectKnowledgeGraph(config, this.logger);
    this.impactAnalyzer = getImpactAnalyzer(config, this.logger);
    this.queryEngine = getSemanticQueryEngine(config, this.logger);
    this.styleExtractor = getStylePatternExtractor(config, this.logger);
  }

  /**
   * Atualiza o grafo com um arquivo e retorna contexto enriquecido.
   * @param {object} input - { filePath, content }
   * @returns {object} Contexto enriquecido
   */
  enrichContext(input = {}) {
    const { filePath, content = '' } = input;
    if (filePath) {
      this.graph.upsertNode({
        id: `file:${filePath}`,
        type: 'file',
        name: filePath.split('/').pop(),
        filePath,
        content
      });
    }

    const style = content ? this.styleExtractor.extractFromContent(content) : null;
    const impact = filePath ? this.impactAnalyzer.analyze(filePath) : null;

    return { style, impact };
  }

  analyzeImpact(filePath, depth = null) {
    return this.impactAnalyzer.analyze(filePath, depth ?? this.impactAnalyzer.maxDepth);
  }

  search(query, limit = null) {
    return this.queryEngine.search(query, limit ?? this.queryEngine.defaultLimit);
  }

  getProjectSnapshot() {
    const db = this.graph.db;
    const nodes = db.prepare('SELECT COUNT(*) as count FROM knowledge_graph_nodes').get().count;
    const edges = db.prepare('SELECT COUNT(*) as count FROM knowledge_graph_edges').get().count;
    return { nodes, edges };
  }
}

let instance = null;

/**
 * Obtém instância singleton do CognitiveContextEngine.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {CognitiveContextEngine} Instância
 */
export function getCognitiveContextEngine(config = null, logger = null) {
  if (!instance) {
    instance = new CognitiveContextEngine(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do CognitiveContextEngine.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {CognitiveContextEngine} Nova instância
 */
export function createCognitiveContextEngine(config = null, logger = null) {
  return new CognitiveContextEngine(config, logger);
}

export default CognitiveContextEngine;
