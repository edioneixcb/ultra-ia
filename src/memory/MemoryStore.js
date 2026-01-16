/**
 * MemoryStore
 *
 * Persistência de memórias de agentes em SQLite.
 */

import { getLogger } from '../utils/Logger.js';
import { getPersistentStorage } from '../infrastructure/PersistentStorage.js';

class MemoryStore {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.storage = getPersistentStorage(config, this.logger);
    this.db = this.storage.getConnection();
  }

  store(agentName, memoryType, content, context = null, importance = 5) {
    const contextText = context ? JSON.stringify(context) : null;
    return this.db.prepare(`
      INSERT INTO agent_memories (agent_name, memory_type, content, context, importance)
      VALUES (?, ?, ?, ?, ?)
    `).run(agentName, memoryType, content, contextText, importance);
  }

  recall(agentName, memoryType = null, limit = 10) {
    const params = [agentName];
    let query = `
      SELECT * FROM agent_memories
      WHERE agent_name = ?
    `;
    if (memoryType) {
      query += ' AND memory_type = ?';
      params.push(memoryType);
    }
    query += ' ORDER BY importance DESC, created_at DESC LIMIT ?';
    params.push(limit);

    const rows = this.db.prepare(query).all(...params);
    rows.forEach(row => {
      this.db.prepare(`
        UPDATE agent_memories
        SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(row.id);
    });

    return rows.map(row => ({
      id: row.id,
      agentName: row.agent_name,
      memoryType: row.memory_type,
      content: row.content,
      context: row.context ? JSON.parse(row.context) : null,
      importance: row.importance,
      accessCount: row.access_count,
      createdAt: row.created_at,
      lastAccessed: row.last_accessed
    }));
  }

  forget(agentName) {
    return this.db.prepare(`
      DELETE FROM agent_memories WHERE agent_name = ?
    `).run(agentName);
  }
}

let instance = null;

/**
 * Obtém instância singleton do MemoryStore.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {MemoryStore} Instância
 */
export function getMemoryStore(config = null, logger = null) {
  if (!instance) {
    instance = new MemoryStore(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do MemoryStore.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {MemoryStore} Nova instância
 */
export function createMemoryStore(config = null, logger = null) {
  return new MemoryStore(config, logger);
}

export default MemoryStore;
