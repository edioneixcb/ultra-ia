/**
 * ProjectKnowledgeGraph
 *
 * Grafo de entidades do projeto persistido em SQLite.
 */

import { getLogger } from '../utils/Logger.js';
import { getPersistentStorage } from '../infrastructure/PersistentStorage.js';

class ProjectKnowledgeGraph {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.storage = getPersistentStorage(config, this.logger);
    this.db = this.storage.getConnection();
    this.ensureFts();
  }

  ensureFts() {
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
        node_id,
        name,
        content,
        tokenize='porter unicode61'
      );
    `);
  }

  upsertNode(node) {
    const metadata = node.metadata ? JSON.stringify(node.metadata) : null;
    this.db.prepare(`
      INSERT OR REPLACE INTO knowledge_graph_nodes (
        id, type, name, file_path, content, metadata, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(node.id, node.type, node.name, node.filePath || null, node.content || null, metadata);

    this.db.prepare(`DELETE FROM knowledge_fts WHERE node_id = ?`).run(node.id);
    this.db.prepare(`
      INSERT INTO knowledge_fts (node_id, name, content)
      VALUES (?, ?, ?)
    `).run(node.id, node.name, node.content || '');
  }

  addEdge(edge) {
    const metadata = edge.metadata ? JSON.stringify(edge.metadata) : null;
    return this.db.prepare(`
      INSERT INTO knowledge_graph_edges (source_id, target_id, relationship, metadata)
      VALUES (?, ?, ?, ?)
    `).run(edge.sourceId, edge.targetId, edge.relationship, metadata);
  }

  getNode(id) {
    const row = this.db.prepare(`
      SELECT * FROM knowledge_graph_nodes WHERE id = ?
    `).get(id);
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      filePath: row.file_path,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    };
  }

  findNodesByFilePath(filePath) {
    return this.db.prepare(`
      SELECT * FROM knowledge_graph_nodes WHERE file_path = ?
    `).all(filePath).map(row => ({
      id: row.id,
      type: row.type,
      name: row.name,
      filePath: row.file_path,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }

  getEdgesForNode(nodeId) {
    return this.db.prepare(`
      SELECT * FROM knowledge_graph_edges
      WHERE source_id = ? OR target_id = ?
    `).all(nodeId, nodeId).map(row => ({
      id: row.id,
      sourceId: row.source_id,
      targetId: row.target_id,
      relationship: row.relationship,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }

  search(query, limit = 10) {
    try {
      const rows = this.db.prepare(`
        SELECT n.*
        FROM knowledge_fts f
        JOIN knowledge_graph_nodes n ON n.id = f.node_id
        WHERE knowledge_fts MATCH ?
        LIMIT ?
      `).all(query, limit);
      return rows.map(row => ({
        id: row.id,
        type: row.type,
        name: row.name,
        filePath: row.file_path,
        content: row.content,
        metadata: row.metadata ? JSON.parse(row.metadata) : null
      }));
    } catch (error) {
      const like = `%${String(query).toLowerCase()}%`;
      const rows = this.db.prepare(`
        SELECT * FROM knowledge_graph_nodes
        WHERE LOWER(name) LIKE ? OR LOWER(content) LIKE ?
        LIMIT ?
      `).all(like, like, limit);
      return rows.map(row => ({
        id: row.id,
        type: row.type,
        name: row.name,
        filePath: row.file_path,
        content: row.content,
        metadata: row.metadata ? JSON.parse(row.metadata) : null
      }));
    }
  }
}

let instance = null;

/**
 * Obtém instância singleton do ProjectKnowledgeGraph.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {ProjectKnowledgeGraph} Instância
 */
export function getProjectKnowledgeGraph(config = null, logger = null) {
  if (!instance) {
    instance = new ProjectKnowledgeGraph(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do ProjectKnowledgeGraph.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {ProjectKnowledgeGraph} Nova instância
 */
export function createProjectKnowledgeGraph(config = null, logger = null) {
  return new ProjectKnowledgeGraph(config, logger);
}

export default ProjectKnowledgeGraph;
