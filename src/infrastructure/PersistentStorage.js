/**
 * PersistentStorage
 *
 * Armazenamento persistente para recursos proativos usando SQLite.
 * Centraliza tabelas de eventos, memórias de agentes e knowledge graph.
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getLogger } from '../utils/Logger.js';
import { getDatabaseManager } from '../utils/DatabaseManager.js';

class PersistentStorage {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);

    this.storagePath = config?.paths?.proactive || './data/proactive';
    this.dbPath = join(this.storagePath, 'proactive.db');

    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }

    const dbManager = getDatabaseManager(config, this.logger);
    this.db = dbManager.getConnection(this.dbPath, 'proactive');
    this.dbManager = dbManager;
    this.dbKey = 'proactive';
    this.initializeDatabase();
  }

  initializeDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS event_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event TEXT NOT NULL,
        payload TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_name TEXT NOT NULL,
        memory_type TEXT NOT NULL,
        content TEXT NOT NULL,
        context TEXT,
        importance INTEGER DEFAULT 5,
        access_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed DATETIME
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        file_path TEXT,
        content TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        relationship TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_id) REFERENCES knowledge_graph_nodes(id),
        FOREIGN KEY (target_id) REFERENCES knowledge_graph_nodes(id)
      );
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_event_log_event ON event_log(event);
      CREATE INDEX IF NOT EXISTS idx_memories_agent ON agent_memories(agent_name);
      CREATE INDEX IF NOT EXISTS idx_memories_type ON agent_memories(memory_type);
      CREATE INDEX IF NOT EXISTS idx_edges_source ON knowledge_graph_edges(source_id);
      CREATE INDEX IF NOT EXISTS idx_edges_target ON knowledge_graph_edges(target_id);
    `);

    this.logger?.info('PersistentStorage inicializado', { dbPath: this.dbPath });
  }

  /**
   * Registra evento no log.
   * @param {string} event - Nome do evento
   * @param {object} payload - Dados do evento
   * @param {object} metadata - Metadados
   */
  logEvent(event, payload = null, metadata = null) {
    const payloadText = payload ? JSON.stringify(payload) : null;
    const metadataText = metadata ? JSON.stringify(metadata) : null;
    return this.db.prepare(`
      INSERT INTO event_log (event, payload, metadata)
      VALUES (?, ?, ?)
    `).run(event, payloadText, metadataText);
  }

  /**
   * Retorna conexão SQLite.
   */
  getConnection() {
    return this.db;
  }

  /**
   * Fecha conexão com banco de dados.
   */
  close() {
    if (this.dbManager && this.dbKey) {
      this.dbManager.closeConnection(this.dbKey);
      this.logger?.info('Conexão PersistentStorage fechada');
    } else if (this.db) {
      try {
        this.db.close();
        this.logger?.info('Conexão PersistentStorage fechada');
      } catch (error) {
        this.logger?.warn('Erro ao fechar conexão PersistentStorage', { error: error.message });
      }
    }
  }
}

let instance = null;

/**
 * Obtém instância singleton do PersistentStorage.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {PersistentStorage} Instância
 */
export function getPersistentStorage(config = null, logger = null) {
  if (!instance) {
    instance = new PersistentStorage(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do PersistentStorage.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {PersistentStorage} Nova instância
 */
export function createPersistentStorage(config = null, logger = null) {
  return new PersistentStorage(config, logger);
}

export default PersistentStorage;
