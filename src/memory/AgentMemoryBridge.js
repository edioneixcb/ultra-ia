/**
 * AgentMemoryBridge
 *
 * Ponte de memória persistente para agentes.
 */

import { getLogger } from '../utils/Logger.js';
import { getMemoryStore } from './MemoryStore.js';

class AgentMemoryBridge {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.store = getMemoryStore(config, this.logger);
    this.defaultLimit = config?.proactive?.memory?.limit || 10;
  }

  storeMemory(agentName, content, options = {}) {
    const {
      type = 'decision',
      importance = 5,
      context = null
    } = options;
    this.store.store(agentName, type, content, context, importance);
  }

  recall(agentName, type = null, limit = this.defaultLimit) {
    return this.store.recall(agentName, type, limit);
  }

  forget(agentName) {
    return this.store.forget(agentName);
  }

  consolidate(agentName) {
    const memories = this.recall(agentName, null, this.defaultLimit);
    return {
      agentName,
      total: memories.length,
      memories
    };
  }
}

let instance = null;

/**
 * Obtém instância singleton do AgentMemoryBridge.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {AgentMemoryBridge} Instância
 */
export function getAgentMemoryBridge(config = null, logger = null) {
  if (!instance) {
    instance = new AgentMemoryBridge(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do AgentMemoryBridge.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {AgentMemoryBridge} Nova instância
 */
export function createAgentMemoryBridge(config = null, logger = null) {
  return new AgentMemoryBridge(config, logger);
}

export default AgentMemoryBridge;
