/**
 * Sistema de Tratamento de Erros
 * 
 * Classifica erros, implementa retry logic com backoff exponencial,
 * fallbacks e notificações de erros críticos.
 */

class ErrorHandler {
  constructor(config = null, logger = null) {
    // Configuração padrão
    const defaultConfig = {
      retry: {
        enabled: true,
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
      },
      notifications: {
        enabled: false,
        criticalOnly: true
      }
    };

    // Se config fornecido, extrair errorHandling ou usar padrão
    if (config && config.errorHandling) {
      this.config = {
        retry: config.errorHandling.retry || defaultConfig.retry,
        notifications: config.errorHandling.notifications || defaultConfig.notifications
      };
    } else if (config && config.retry) {
      // Se config já tem estrutura retry (compatibilidade)
      this.config = {
        retry: config.retry,
        notifications: config.notifications || defaultConfig.notifications
      };
    } else {
      this.config = defaultConfig;
    }

    this.logger = logger;
  }

  /**
   * Classifica tipo de erro
   * @param {Error} error - Erro a classificar
   * @returns {string} Tipo do erro (TEMPORARY, PERMANENT, CRITICAL)
   */
  classifyError(error) {
    if (!(error instanceof Error)) {
      return 'PERMANENT';
    }

    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Erros temporários (podem ser retentados)
    const temporaryPatterns = [
      'timeout',
      'econnrefused',
      'enotfound',
      'econnreset',
      'etimedout',
      'temporary',
      'retry',
      'rate limit',
      'too many requests',
      'service unavailable',
      '503',
      '502',
      '504'
    ];

    // Erros críticos (requerem atenção imediata)
    const criticalPatterns = [
      'critical',
      'fatal',
      'out of memory',
      'disk full',
      'permission denied',
      'unauthorized',
      'forbidden'
    ];

    // Verificar padrões temporários
    for (const pattern of temporaryPatterns) {
      if (errorMessage.includes(pattern) || errorName.includes(pattern)) {
        return 'TEMPORARY';
      }
    }

    // Verificar padrões críticos
    for (const pattern of criticalPatterns) {
      if (errorMessage.includes(pattern) || errorName.includes(pattern)) {
        return 'CRITICAL';
      }
    }

    // Verificar códigos HTTP
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      if (status >= 500) {
        return 'TEMPORARY'; // Erros de servidor podem ser temporários
      }
      if (status === 401 || status === 403) {
        return 'CRITICAL'; // Autenticação/autorização são críticos
      }
    }

    // Padrão: permanente (não deve ser retentado)
    return 'PERMANENT';
  }

  /**
   * Calcula delay para retry com backoff exponencial
   * @param {number} attempt - Número da tentativa (1-based)
   * @returns {number} Delay em milissegundos
   */
  calculateBackoffDelay(attempt) {
    const { initialDelay, backoffMultiplier } = this.config.retry;
    return initialDelay * Math.pow(backoffMultiplier, attempt - 1);
  }

  /**
   * Executa função com retry automático
   * @param {Function} fn - Função a executar (async)
   * @param {object} options - Opções (maxRetries, onRetry, etc.)
   * @returns {Promise<any>} Resultado da função
   */
  async executeWithRetry(fn, options = {}) {
    const maxRetries = options.maxRetries || this.config.retry.maxRetries;
    const onRetry = options.onRetry || (() => {});
    const shouldRetry = options.shouldRetry || ((error) => {
      return this.classifyError(error) === 'TEMPORARY';
    });

    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        lastError = error;

        // Se não deve retentar ou última tentativa
        if (!shouldRetry(error) || attempt > maxRetries) {
          break;
        }

        // Calcular delay
        const delay = this.calculateBackoffDelay(attempt);
        
        // Log retry
        if (this.logger) {
          this.logger.warn(`Retry ${attempt}/${maxRetries} após ${delay}ms`, {
            error: error.message,
            attempt,
            delay
          });
        }

        // Callback de retry
        onRetry(error, attempt, delay);

        // Aguardar antes de retentar
        await this.sleep(delay);
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    if (this.logger) {
      this.logger.error('Todas as tentativas falharam', {
        error: lastError.message,
        attempts: maxRetries + 1
      });
    }

    throw lastError;
  }

  /**
   * Executa função com fallback
   * @param {Function} primaryFn - Função principal
   * @param {Function} fallbackFn - Função de fallback
   * @param {object} options - Opções
   * @returns {Promise<any>} Resultado da função principal ou fallback
   */
  async executeWithFallback(primaryFn, fallbackFn, options = {}) {
    try {
      return await primaryFn();
    } catch (error) {
      const errorType = this.classifyError(error);
      
      if (this.logger) {
        this.logger.warn('Executando fallback', {
          error: error.message,
          errorType,
          primaryFn: primaryFn.name || 'anonymous'
        });
      }

      try {
        return await fallbackFn(error);
      } catch (fallbackError) {
        if (this.logger) {
          this.logger.error('Fallback também falhou', {
            primaryError: error.message,
            fallbackError: fallbackError.message
          });
        }
        throw fallbackError;
      }
    }
  }

  /**
   * Executa função com retry e fallback
   * @param {Function} primaryFn - Função principal
   * @param {Function} fallbackFn - Função de fallback (opcional)
   * @param {object} options - Opções
   * @returns {Promise<any>} Resultado
   */
  async executeWithRetryAndFallback(primaryFn, fallbackFn = null, options = {}) {
    if (fallbackFn) {
      return await this.executeWithFallback(
        () => this.executeWithRetry(primaryFn, options),
        fallbackFn,
        options
      );
    } else {
      return await this.executeWithRetry(primaryFn, options);
    }
  }

  /**
   * Notifica erro crítico
   * @param {Error} error - Erro crítico
   * @param {object} context - Contexto adicional
   */
  notifyCritical(error, context = {}) {
    if (!this.config.notifications.enabled) {
      return;
    }

    if (this.config.notifications.criticalOnly) {
      const errorType = this.classifyError(error);
      if (errorType !== 'CRITICAL') {
        return;
      }
    }

    // Log crítico
    if (this.logger) {
      this.logger.critical('Erro crítico detectado', {
        error: error.message,
        errorName: error.name,
        stack: error.stack,
        ...context
      });
    }

    // TODO: Implementar notificações externas (email, Slack, etc.)
  }

  /**
   * Wrapper para função que trata erros automaticamente
   * @param {Function} fn - Função a envolver
   * @param {object} options - Opções
   * @returns {Function} Função envolvida
   */
  wrap(fn, options = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        const errorType = this.classifyError(error);
        
        // Log erro
        if (this.logger) {
          this.logger.error('Erro capturado em função envolvida', {
            error: error.message,
            errorType,
            function: fn.name || 'anonymous',
            args: options.logArgs !== false ? args : undefined
          });
        }

        // Notificar se crítico
        if (errorType === 'CRITICAL') {
          this.notifyCritical(error, { function: fn.name });
        }

        // Re-throw se não deve ser suprimido
        if (!options.suppressErrors) {
          throw error;
        }

        // Retornar valor padrão se erro suprimido
        return options.defaultValue;
      }
    };
  }

  /**
   * Sleep helper
   * @param {number} ms - Milissegundos
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtém informações do ErrorHandler
   * @returns {object} Informações
   */
  getInfo() {
    return {
      retry: this.config.retry,
      notifications: this.config.notifications
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do ErrorHandler
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {ErrorHandler} Instância do ErrorHandler
 */
export function getErrorHandler(config = null, logger = null) {
  if (!instance) {
    instance = new ErrorHandler(config, logger);
  }
  return instance;
}

/**
 * Cria novo ErrorHandler (não singleton)
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {ErrorHandler} Nova instância
 */
export function createErrorHandler(config = null, logger = null) {
  return new ErrorHandler(config, logger);
}

export default ErrorHandler;
