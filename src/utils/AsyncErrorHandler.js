/**
 * Async Error Handler
 * 
 * Centraliza tratamento de erros assíncronos não capturados:
 * - Handlers globais para unhandledRejection e uncaughtException
 * - Logging estruturado de erros assíncronos
 * - Monitoramento de erros não capturados
 * - Prevenção de crashes silenciosos
 */

import { getLogger } from './Logger.js';
import { getErrorHandler } from './ErrorHandler.js';

class AsyncErrorHandler {
  constructor(config = null, logger = null, errorHandler = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.errorHandler = errorHandler || getErrorHandler(config, this.logger);
    
    // Estatísticas
    this.stats = {
      unhandledRejections: 0,
      uncaughtExceptions: 0,
      lastError: null,
      lastErrorTime: null
    };

    // Flag para evitar múltiplos registros
    this.registered = false;
  }

  /**
   * Registra handlers globais de erros assíncronos
   */
  register() {
    if (this.registered) {
      this.logger?.warn('Handlers de erro assíncrono já registrados');
      return;
    }

    // Handler para unhandledRejection
    process.on('unhandledRejection', (reason, promise) => {
      this.stats.unhandledRejections++;
      this.stats.lastError = {
        type: 'unhandledRejection',
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined
      };
      this.stats.lastErrorTime = new Date().toISOString();

      this.logger?.error('Unhandled Promise Rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: promise.toString(),
        count: this.stats.unhandledRejections
      });

      // Classificar e tratar erro
      if (reason instanceof Error) {
        this.errorHandler?.handleError(reason, {
          component: 'AsyncErrorHandler',
          operation: 'unhandledRejection',
          critical: true
        }, true);
      }

      // Em produção, pode querer fazer graceful shutdown
      if (this.config?.environment === 'production') {
        // Log crítico mas não crashar imediatamente
        this.logger?.critical('Unhandled rejection em produção', {
          reason: reason instanceof Error ? reason.message : String(reason)
        });
      }
    });

    // Handler para uncaughtException
    process.on('uncaughtException', (error) => {
      this.stats.uncaughtExceptions++;
      this.stats.lastError = {
        type: 'uncaughtException',
        reason: error.message,
        stack: error.stack
      };
      this.stats.lastErrorTime = new Date().toISOString();

      this.logger?.critical('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
        name: error.name,
        count: this.stats.uncaughtExceptions
      });

      // Tratar erro crítico
      this.errorHandler?.notifyCritical(error, {
        component: 'AsyncErrorHandler',
        operation: 'uncaughtException'
      });

      // Uncaught exceptions são críticas - fazer graceful shutdown
      this.gracefulShutdown(error);
    });

    // Handler para warning
    process.on('warning', (warning) => {
      this.logger?.warn('Process Warning', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack
      });
    });

    this.registered = true;
    this.logger?.info('Handlers de erro assíncrono registrados');
  }

  /**
   * Faz graceful shutdown do processo
   * @param {Error} error - Erro que causou o shutdown
   */
  gracefulShutdown(error) {
    this.logger?.info('Iniciando graceful shutdown', {
      error: error?.message
    });

    // Dar tempo para operações pendentes completarem
    const shutdownTimeout = setTimeout(() => {
      this.logger?.error('Shutdown timeout, forçando saída');
      process.exit(1);
    }, 10000); // 10 segundos

      // Tentar cleanup de recursos
      try {
        // Fechar conexões de banco de dados se DatabaseManager disponível
        try {
          const dbModule = await import('./DatabaseManager.js');
          const dbManager = dbModule.getDatabaseManager();
          if (dbManager) {
            dbManager.closeAll();
          }
        } catch (dbError) {
          // Ignorar se DatabaseManager não disponível
        }

      // Limpar timeout e sair
      clearTimeout(shutdownTimeout);
      process.exit(1);
    } catch (cleanupError) {
      this.logger?.error('Erro durante cleanup', {
        error: cleanupError.message
      });
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  }

  /**
   * Wrapper para função async que captura erros automaticamente
   * @param {Function} fn - Função async
   * @param {object} context - Contexto adicional
   * @returns {Function} Função envolvida
   */
  wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.logger?.error('Erro capturado em função async envolvida', {
          function: fn.name || 'anonymous',
          error: error.message,
          stack: error.stack,
          ...context
        });

        this.errorHandler?.handleError(error, {
          component: context.component || 'AsyncErrorHandler',
          operation: context.operation || fn.name || 'wrapAsync',
          ...context
        });

        throw error;
      }
    };
  }

  /**
   * Obtém estatísticas de erros assíncronos
   * @returns {object} Estatísticas
   */
  getStats() {
    return {
      ...this.stats,
      registered: this.registered
    };
  }

  /**
   * Reseta estatísticas
   */
  resetStats() {
    this.stats = {
      unhandledRejections: 0,
      uncaughtExceptions: 0,
      lastError: null,
      lastErrorTime: null
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do AsyncErrorHandler
 */
export function getAsyncErrorHandler(config = null, logger = null, errorHandler = null) {
  if (!instance) {
    instance = new AsyncErrorHandler(config, logger, errorHandler);
  }
  return instance;
}

/**
 * Cria nova instância do AsyncErrorHandler
 */
export function createAsyncErrorHandler(config = null, logger = null, errorHandler = null) {
  return new AsyncErrorHandler(config, logger, errorHandler);
}

export default AsyncErrorHandler;
