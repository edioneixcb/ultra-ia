/**
 * ImpactAnalyzer
 *
 * Calcula impacto de mudanças em arquivos usando Knowledge Graph.
 */

import { getLogger } from '../utils/Logger.js';
import { getProjectKnowledgeGraph } from './ProjectKnowledgeGraph.js';

class ImpactAnalyzer {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.graph = getProjectKnowledgeGraph(config, this.logger);
    this.maxDepth = config?.proactive?.impactAnalyzer?.maxDepth || 3;
  }

  analyze(filePath, depth = this.maxDepth) {
    const visited = new Set();
    const impactedFiles = new Set();

    const startNodes = this.graph.findNodesByFilePath(filePath);
    const queue = startNodes.map(node => ({ id: node.id, level: 0 }));

    while (queue.length > 0) {
      const { id, level } = queue.shift();
      if (visited.has(id) || level > depth) {
        continue;
      }
      visited.add(id);

      const node = this.graph.getNode(id);
      if (node?.filePath) {
        impactedFiles.add(node.filePath);
      }

      const edges = this.graph.getEdgesForNode(id);
      for (const edge of edges) {
        const nextId = edge.sourceId === id ? edge.targetId : edge.sourceId;
        if (!visited.has(nextId)) {
          queue.push({ id: nextId, level: level + 1 });
        }
      }
    }

    return {
      filePath,
      depth,
      impactedFiles: Array.from(impactedFiles)
    };
  }
}

let instance = null;

/**
 * Obtém instância singleton do ImpactAnalyzer.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {ImpactAnalyzer} Instância
 */
export function getImpactAnalyzer(config = null, logger = null) {
  if (!instance) {
    instance = new ImpactAnalyzer(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do ImpactAnalyzer.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {ImpactAnalyzer} Nova instância
 */
export function createImpactAnalyzer(config = null, logger = null) {
  return new ImpactAnalyzer(config, logger);
}

export default ImpactAnalyzer;
