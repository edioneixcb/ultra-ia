/**
 * Gerenciador de Contexto Persistente
 * 
 * Mantém contexto de conversas e sessões de forma persistente.
 * 
 * Funcionalidades:
 * - Armazenamento de contexto por sessão/projeto
 * - Compressão de contexto (manter apenas relevante)
 * - Recuperação de contexto histórico
 * - Limpeza automática de contexto antigo
 * - Compressão inteligente (manter apenas essencial)
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import { getConfigLoader } from '../utils/ConfigLoader.js';
import { getLogger } from '../utils/Logger.js';
import { getDatabaseManager } from '../utils/DatabaseManager.js';
import { getTimeoutManager } from '../utils/TimeoutManager.js';

class PersistentContextManager {
  constructor(config = null, logger = null) {
    // Carregar config se não fornecido
    if (!config) {
      const configLoader = getConfigLoader();
      if (configLoader.config) {
        config = configLoader.get();
      } else {
        configLoader.load();
        config = configLoader.get();
      }
    }

    // Criar logger se não fornecido
    if (!logger) {
      logger = getLogger(config);
    }

    this.config = config;
    this.logger = logger;
    this.timeoutManager = getTimeoutManager(config, logger);
    this.contextPath = config.paths?.context || './data/context';
    this.dbPath = join(this.contextPath, 'context.db');

    // Criar diretório se não existir
    if (!existsSync(this.contextPath)) {
      mkdirSync(this.contextPath, { recursive: true });
    }

    // Obter conexão do DatabaseManager
    const dbManager = getDatabaseManager(config, logger);
    this.db = dbManager.getConnection(this.dbPath, 'context');
    this.dbManager = dbManager;
    this.dbKey = 'context';
    this.initializeDatabase();

    // Cache de contexto em memória
    this.contextCache = new Map();

    // Configurações de compressão
    this.maxContextSize = config.context?.maxSize || 10000; // tokens aproximados
    this.maxHistoryDays = config.context?.maxHistoryDays || 30;
  }

  /**
   * Inicializa estrutura do banco de dados
   */
  initializeDatabase() {
    // Tabela de sessões
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      )
    `);

    // Tabela de mensagens/contexto
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS context_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        importance INTEGER DEFAULT 0,
        compressed INTEGER DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Tabela de contexto comprimido
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS compressed_context (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        summary TEXT NOT NULL,
        original_count INTEGER NOT NULL,
        compressed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Índices
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_session ON context_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON context_messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at);
    `);

    this.logger?.info('Banco de dados de contexto inicializado', { dbPath: this.dbPath });
  }

  /**
   * Cria ou recupera sessão
   * @param {string} sessionId - ID da sessão
   * @param {string} projectId - ID do projeto (opcional)
   * @param {object} metadata - Metadados adicionais (opcional)
   * @returns {object} Sessão criada/recuperada
   */
  getOrCreateSession(sessionId, projectId = null, metadata = {}) {
    const existing = this.db.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `).get(sessionId);

    if (existing) {
      // Atualizar updated_at
      this.db.prepare(`
        UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(sessionId);
      
      return {
        id: existing.id,
        projectId: existing.project_id,
        createdAt: existing.created_at,
        updatedAt: new Date().toISOString(),
        metadata: existing.metadata ? JSON.parse(existing.metadata) : {}
      };
    }

    // Criar nova sessão
    this.db.prepare(`
      INSERT INTO sessions (id, project_id, metadata)
      VALUES (?, ?, ?)
    `).run(sessionId, projectId, JSON.stringify(metadata));

    return {
      id: sessionId,
      projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata
    };
  }

  /**
   * Adiciona mensagem ao contexto
   * @param {string} sessionId - ID da sessão
   * @param {string} role - Role da mensagem (user, assistant, system)
   * @param {string} content - Conteúdo da mensagem
   * @param {number} importance - Importância (0-10, padrão 5)
   * @returns {number} ID da mensagem criada
   */
  addMessage(sessionId, role, content, importance = 5) {
    // Garantir que sessão existe
    this.getOrCreateSession(sessionId);

    const result = this.db.prepare(`
      INSERT INTO context_messages (session_id, role, content, importance)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, role, content, importance);

    // Invalidar cache
    this.contextCache.delete(sessionId);

    this.logger?.debug('Mensagem adicionada ao contexto', {
      sessionId,
      role,
      contentLength: content.length,
      importance
    });

    return result.lastInsertRowid;
  }

  /**
   * Obtém contexto completo de uma sessão
   * @param {string} sessionId - ID da sessão
   * @param {number} limit - Limite de mensagens (opcional)
   * @returns {Array<object>} Lista de mensagens
   */
  getContext(sessionId, limit = null) {
    // Verificar cache
    if (this.contextCache.has(sessionId)) {
      const cached = this.contextCache.get(sessionId);
      if (limit) {
        return cached.slice(-limit);
      }
      return cached;
    }

    // Buscar do banco
    let query = `
      SELECT role, content, timestamp, importance, compressed
      FROM context_messages
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `;

    const params = [sessionId];
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    const messages = this.db.prepare(query).all(...params);

    const context = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      importance: msg.importance,
      compressed: msg.compressed === 1
    }));

    // Armazenar em cache
    this.contextCache.set(sessionId, context);

    return limit ? context.slice(-limit) : context;
  }

  /**
   * Obtém contexto comprimido (resumo)
   * @param {string} sessionId - ID da sessão
   * @returns {Array<object>} Lista de resumos comprimidos
   */
  getCompressedContext(sessionId) {
    const summaries = this.db.prepare(`
      SELECT summary, original_count, compressed_at
      FROM compressed_context
      WHERE session_id = ?
      ORDER BY compressed_at ASC
    `).all(sessionId);

    return summaries.map(s => ({
      summary: s.summary,
      originalCount: s.original_count,
      compressedAt: s.compressed_at
    }));
  }

  /**
   * Comprime contexto antigo mantendo apenas essencial
   * @param {string} sessionId - ID da sessão
   * @param {Function} summarizeFn - Função para criar resumo (opcional)
   * @returns {object} Estatísticas da compressão
   */
  async compressContext(sessionId, summarizeFn = null) {
    const messages = this.getContext(sessionId);
    
    if (messages.length === 0) {
      return { compressed: 0, removed: 0 };
    }

    // Separar mensagens importantes e não importantes
    const importantMessages = messages.filter(m => m.importance >= 7);
    const normalMessages = messages.filter(m => m.importance < 7 && m.importance >= 4);
    const lowImportanceMessages = messages.filter(m => m.importance < 4);

    // Criar resumo das mensagens de baixa importância
    let summary = '';
    if (lowImportanceMessages.length > 0) {
      if (summarizeFn) {
        summary = await summarizeFn(lowImportanceMessages.map(m => m.content).join('\n'));
      } else {
        // Resumo simples (primeiras palavras)
        const content = lowImportanceMessages.map(m => m.content).join('\n');
        summary = content.substring(0, 500) + (content.length > 500 ? '...' : '');
      }

      // Salvar resumo comprimido
      this.db.prepare(`
        INSERT INTO compressed_context (session_id, summary, original_count)
        VALUES (?, ?, ?)
      `).run(sessionId, summary, lowImportanceMessages.length);
    }

    // Marcar mensagens de baixa importância como comprimidas
    const lowImportanceIds = this.db.prepare(`
      SELECT id FROM context_messages
      WHERE session_id = ? AND importance < 4
    `).all(sessionId).map(r => r.id);

    if (lowImportanceIds.length > 0) {
      this.db.prepare(`
        UPDATE context_messages SET compressed = 1
        WHERE id IN (${lowImportanceIds.map(() => '?').join(',')})
      `).run(...lowImportanceIds);
    }

    // Remover mensagens muito antigas e de baixa importância
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - this.maxHistoryDays);
    
    const removed = this.db.prepare(`
      DELETE FROM context_messages
      WHERE session_id = ? 
        AND compressed = 1
        AND timestamp < ?
    `).run(sessionId, oldDate.toISOString()).changes;

    // Invalidar cache
    this.contextCache.delete(sessionId);

    const stats = {
      compressed: lowImportanceMessages.length,
      removed,
      important: importantMessages.length,
      normal: normalMessages.length
    };

    this.logger?.info('Contexto comprimido', { sessionId, ...stats });

    return stats;
  }

  /**
   * Obtém contexto completo (incluindo comprimido) formatado para LLM com timeout
   * @param {string} sessionId - ID da sessão
   * @param {number} maxTokens - Máximo de tokens aproximados (opcional)
   * @returns {Promise<Array<object>>} Contexto formatado
   */
  async getFormattedContext(sessionId, maxTokens = null) {
    return await this.timeoutManager.withTimeout(
      async () => {
        const messages = this.getContext(sessionId);
        const compressed = this.getCompressedContext(sessionId);

        const formatted = [];

        // Adicionar resumos comprimidos primeiro
        if (compressed.length > 0) {
          formatted.push({
            role: 'system',
            content: `[Contexto histórico comprimido]\n${compressed.map(c => c.summary).join('\n\n')}`
          });
        }

        // Adicionar mensagens importantes e normais (não comprimidas)
        const activeMessages = messages.filter(m => !m.compressed);
        
        // Se maxTokens especificado, limitar mensagens
        if (maxTokens) {
          let tokenCount = 0;
          const limited = [];
          
          // Adicionar mensagens importantes primeiro
          const important = activeMessages.filter(m => m.importance >= 7);
          for (const msg of important) {
            const tokens = this.estimateTokens(msg.content);
            if (tokenCount + tokens <= maxTokens) {
              limited.push(msg);
              tokenCount += tokens;
            } else {
              break;
            }
          }

          // Adicionar mensagens normais se houver espaço
          const normal = activeMessages.filter(m => m.importance < 7);
          for (const msg of normal) {
            const tokens = this.estimateTokens(msg.content);
            if (tokenCount + tokens <= maxTokens) {
              limited.push(msg);
              tokenCount += tokens;
            } else {
              break;
            }
          }

          formatted.push(...limited);
        } else {
          formatted.push(...activeMessages);
        }

        return formatted;
      },
      'context'
    );
  }

  /**
   * Estima número de tokens (aproximado)
   * @param {string} text - Texto
   * @returns {number} Número estimado de tokens
   */
  estimateTokens(text) {
    // Aproximação: 1 token ≈ 4 caracteres
    return Math.ceil(text.length / 4);
  }

  /**
   * Limpa contexto antigo de todas as sessões
   * @returns {object} Estatísticas da limpeza
   */
  cleanupOldContext() {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - this.maxHistoryDays);

    // Remover mensagens antigas comprimidas
    const removedMessages = this.db.prepare(`
      DELETE FROM context_messages
      WHERE compressed = 1 AND timestamp < ?
    `).run(oldDate.toISOString()).changes;

    // Remover sessões sem mensagens
    const removedSessions = this.db.prepare(`
      DELETE FROM sessions
      WHERE id NOT IN (SELECT DISTINCT session_id FROM context_messages)
        AND updated_at < ?
    `).run(oldDate.toISOString()).changes;

    // Limpar cache
    this.contextCache.clear();

    const stats = {
      removedMessages,
      removedSessions
    };

    this.logger?.info('Limpeza de contexto antigo concluída', stats);

    return stats;
  }

  /**
   * Obtém estatísticas de uma sessão
   * @param {string} sessionId - ID da sessão
   * @returns {object} Estatísticas
   */
  getSessionStats(sessionId) {
    const session = this.db.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `).get(sessionId);

    if (!session) {
      return null;
    }

    const messageCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM context_messages WHERE session_id = ?
    `).get(sessionId).count;

    const compressedCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM context_messages 
      WHERE session_id = ? AND compressed = 1
    `).get(sessionId).count;

    const compressedSummaries = this.db.prepare(`
      SELECT COUNT(*) as count FROM compressed_context WHERE session_id = ?
    `).get(sessionId).count;

    return {
      sessionId: session.id,
      projectId: session.project_id,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      messageCount,
      compressedCount,
      compressedSummaries,
      activeMessages: messageCount - compressedCount
    };
  }

  /**
   * Fecha conexão com banco de dados
   */
  close() {
    if (this.dbManager && this.dbKey) {
      this.dbManager.closeConnection(this.dbKey);
      this.logger?.info('Conexão com banco de dados de contexto fechada');
    } else if (this.db) {
      try {
        this.db.close();
        this.logger?.info('Conexão com banco de dados de contexto fechada');
      } catch (error) {
        this.logger?.warn('Erro ao fechar conexão', { error: error.message });
      }
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do PersistentContextManager
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {PersistentContextManager} Instância
 */
export function getContextManager(config = null, logger = null) {
  if (!instance) {
    instance = new PersistentContextManager(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do PersistentContextManager
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {PersistentContextManager} Nova instância
 */
export function createContextManager(config = null, logger = null) {
  return new PersistentContextManager(config, logger);
}

export default PersistentContextManager;
