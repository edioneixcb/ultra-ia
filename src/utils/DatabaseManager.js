/**
 * Database Manager
 * 
 * Gerencia pool de conexões SQLite e ciclo de vida de conexões:
 * - Pool de conexões com limite máximo
 * - Fechamento automático em shutdown
 * - Monitoramento de conexões abertas
 * - Cleanup em caso de erro
 */

import Database from 'better-sqlite3';
import { getLogger } from './Logger.js';

class DatabaseManager {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger;
    
    // Pool de conexões
    this.connections = new Map();
    this.maxConnections = config?.database?.maxConnections || 10;
    
    // Estatísticas
    this.stats = {
      totalCreated: 0,
      totalClosed: 0,
      currentOpen: 0
    };

    // Registrar handlers de cleanup
    this.setupCleanupHandlers();
  }

  /**
   * Cria ou obtém conexão para um banco de dados
   * @param {string} dbPath - Caminho do banco de dados
   * @param {string} label - Label para identificação (opcional)
   * @returns {object} Conexão SQLite
   */
  getConnection(dbPath, label = null) {
    const key = label || dbPath;

    // Verificar se conexão já existe
    if (this.connections.has(key)) {
      const conn = this.connections.get(key);
      if (conn.open) {
        this.logger?.debug('Reutilizando conexão existente', { key });
        return conn.db;
      } else {
        // Conexão fechada, remover
        this.connections.delete(key);
      }
    }

    // Verificar limite de conexões
    if (this.connections.size >= this.maxConnections) {
      this.logger?.warn('Limite de conexões atingido', {
        current: this.connections.size,
        max: this.maxConnections
      });
      // Fechar conexão mais antiga não utilizada
      this.closeOldestConnection();
    }

    // Criar nova conexão
    try {
      const db = new Database(dbPath);
      this.connections.set(key, {
        db,
        dbPath,
        label,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        open: true
      });

      this.stats.totalCreated++;
      this.stats.currentOpen = this.connections.size;

      this.logger?.info('Nova conexão criada', {
        key,
        dbPath,
        totalConnections: this.connections.size
      });

      return db;
    } catch (error) {
      this.logger?.error('Erro ao criar conexão', {
        dbPath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Fecha conexão específica
   * @param {string} key - Chave da conexão
   */
  closeConnection(key) {
    const conn = this.connections.get(key);
    if (!conn) {
      return;
    }

    try {
      if (conn.db && conn.open) {
        conn.db.close();
        conn.open = false;
        this.stats.totalClosed++;
      }
      this.connections.delete(key);
      this.stats.currentOpen = this.connections.size;

      this.logger?.info('Conexão fechada', {
        key,
        totalConnections: this.connections.size
      });
    } catch (error) {
      this.logger?.warn('Erro ao fechar conexão', {
        key,
        error: error.message
      });
    }
  }

  /**
   * Fecha conexão mais antiga não utilizada
   */
  closeOldestConnection() {
    if (this.connections.size === 0) {
      return;
    }

    // Encontrar conexão mais antiga
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, conn] of this.connections.entries()) {
      if (conn.lastUsed < oldestTime) {
        oldestTime = conn.lastUsed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.closeConnection(oldestKey);
    }
  }

  /**
   * Fecha todas as conexões
   */
  closeAll() {
    this.logger?.info('Fechando todas as conexões', {
      total: this.connections.size
    });

    const keys = Array.from(this.connections.keys());
    for (const key of keys) {
      this.closeConnection(key);
    }

    this.connections.clear();
    this.stats.currentOpen = 0;
  }

  /**
   * Atualiza timestamp de última utilização
   * @param {string} key - Chave da conexão
   */
  updateLastUsed(key) {
    const conn = this.connections.get(key);
    if (conn) {
      conn.lastUsed = Date.now();
    }
  }

  /**
   * Executa uma função com conexão garantindo fechamento automático em caso de erro
   * @param {string} dbPath - Caminho do banco de dados
   * @param {Function} fn - Função que recebe a conexão
   * @param {object} options - Opções { label, closeOnComplete }
   * @returns {Promise<any>} Resultado da função
   */
  async withConnection(dbPath, fn, options = {}) {
    const { label = null, closeOnComplete = false } = options;
    const key = label || dbPath;
    let db = null;
    
    try {
      db = this.getConnection(dbPath, label);
      this.updateLastUsed(key);
      const result = await fn(db);
      return result;
    } catch (error) {
      this.logger?.error('Erro durante operação com conexão', {
        key,
        error: error.message
      });
      throw error;
    } finally {
      // Atualizar último uso ou fechar se solicitado
      if (closeOnComplete && db) {
        this.closeConnection(key);
      } else {
        this.updateLastUsed(key);
      }
    }
  }

  /**
   * Executa uma função de forma síncrona com conexão garantindo tratamento de erro
   * @param {string} dbPath - Caminho do banco de dados
   * @param {Function} fn - Função que recebe a conexão
   * @param {object} options - Opções { label, closeOnComplete }
   * @returns {any} Resultado da função
   */
  withConnectionSync(dbPath, fn, options = {}) {
    const { label = null, closeOnComplete = false } = options;
    const key = label || dbPath;
    let db = null;
    
    try {
      db = this.getConnection(dbPath, label);
      this.updateLastUsed(key);
      const result = fn(db);
      return result;
    } catch (error) {
      this.logger?.error('Erro durante operação síncrona com conexão', {
        key,
        error: error.message
      });
      throw error;
    } finally {
      // Atualizar último uso ou fechar se solicitado
      if (closeOnComplete && db) {
        this.closeConnection(key);
      } else {
        this.updateLastUsed(key);
      }
    }
  }

  /**
   * Obtém estatísticas do pool
   * @returns {object} Estatísticas
   */
  getStats() {
    return {
      ...this.stats,
      maxConnections: this.maxConnections,
      connections: Array.from(this.connections.keys()).map(key => {
        const conn = this.connections.get(key);
        return {
          key,
          label: conn.label,
          dbPath: conn.dbPath,
          createdAt: conn.createdAt,
          lastUsed: conn.lastUsed,
          open: conn.open
        };
      })
    };
  }

  /**
   * Configura handlers de cleanup em shutdown
   */
  setupCleanupHandlers() {
    // Handler para process.exit
    process.on('exit', () => {
      this.closeAll();
    });

    // Handler para SIGTERM
    process.on('SIGTERM', () => {
      this.logger?.info('SIGTERM recebido, fechando conexões');
      this.closeAll();
      process.exit(0);
    });

    // Handler para SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      this.logger?.info('SIGINT recebido, fechando conexões');
      this.closeAll();
      process.exit(0);
    });

    // Handler para uncaughtException
    process.on('uncaughtException', (error) => {
      this.logger?.error('Uncaught exception, fechando conexões', {
        error: error.message
      });
      this.closeAll();
    });
  }
}

// Singleton instance with initialization lock
let instance = null;
let initializationPromise = null;

/**
 * Obtém instância singleton do DatabaseManager
 * Thread-safe: previne criação dupla durante inicialização concorrente
 */
export function getDatabaseManager(config = null, logger = null) {
  // Fast path: instância já existe
  if (instance) {
    return instance;
  }

  // Se não há inicialização em andamento, criar agora (síncrono)
  if (!initializationPromise) {
    instance = new DatabaseManager(config, logger);
  }
  
  return instance;
}

/**
 * Obtém instância singleton do DatabaseManager de forma assíncrona
 * Garante thread-safety em contextos assíncronos
 */
export async function getDatabaseManagerAsync(config = null, logger = null) {
  // Fast path: instância já existe
  if (instance) {
    return instance;
  }

  // Se há inicialização em andamento, aguardar
  if (initializationPromise) {
    return await initializationPromise;
  }

  // Iniciar inicialização
  initializationPromise = new Promise((resolve) => {
    instance = new DatabaseManager(config, logger);
    resolve(instance);
  });

  return await initializationPromise;
}

/**
 * Cria nova instância do DatabaseManager
 */
export function createDatabaseManager(config = null, logger = null) {
  return new DatabaseManager(config, logger);
}

export default DatabaseManager;
