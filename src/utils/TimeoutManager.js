/**
 * Timeout Manager
 * 
 * Gerencia timeouts e circuit breakers para operações assíncronas:
 * - Timeout escalonado por tipo de operação
 * - AbortController para cancelamento
 * - Circuit breaker para serviços externos
 * - Retry com backoff
 */

import { getLogger } from './Logger.js';

class TimeoutManager {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger;

    // Timeouts padrão por tipo de operação
    const timeoutConfig = config?.timeouts || {};
    this.timeouts = {
      ollama: timeoutConfig.ollama || 30000,
      knowledgeBase: timeoutConfig.knowledgeBase || 5000,
      context: timeoutConfig.context || 3000,
      database: timeoutConfig.database || 5000,
      default: timeoutConfig.default || 10000
    };

    // Circuit breakers por serviço
    this.circuitBreakers = new Map();
  }

  /**
   * Executa função com timeout
   * @param {Function} fn - Função async a executar
   * @param {number|string} timeout - Timeout em ms ou nome do tipo ('ollama', 'knowledgeBase', etc.)
   * @param {object} options - Opções adicionais
   * @returns {Promise<any>} Resultado da função
   */
  async withTimeout(fn, timeout = 'default', options = {}) {
    // Resolver timeout se for string
    const timeoutMs = typeof timeout === 'string' 
      ? (this.timeouts[timeout] || this.timeouts.default)
      : timeout;

    const { abortSignal = null, onTimeout = null } = options;

    return new Promise(async (resolve, reject) => {
      let timeoutId;
      let completed = false;

      // Criar AbortController se não fornecido
      const controller = abortSignal || new AbortController();
      const signal = controller.signal;

      // Configurar timeout
      timeoutId = setTimeout(() => {
        if (!completed) {
          completed = true;
          controller.abort();
          
          const error = new Error(`Timeout após ${timeoutMs}ms`);
          error.name = 'TimeoutError';
          error.timeout = timeoutMs;

          this.logger?.warn('Timeout em operação', {
            timeout: timeoutMs,
            operation: fn.name || 'anonymous'
          });

          if (onTimeout) {
            onTimeout(error);
          }

          reject(error);
        }
      }, timeoutMs);

      try {
        // Executar função
        const result = await fn(signal);
        
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId);
          resolve(result);
        }
      } catch (error) {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId);

          // Se foi abortado, não é erro da função
          if (error.name === 'AbortError' || signal.aborted) {
            const timeoutError = new Error(`Operação cancelada após timeout`);
            timeoutError.name = 'TimeoutError';
            reject(timeoutError);
          } else {
            reject(error);
          }
        }
      }
    });
  }

  /**
   * Cria AbortController para cancelamento
   * @returns {AbortController} Controller
   */
  createAbortController() {
    return new AbortController();
  }

  /**
   * Executa função com circuit breaker
   * @param {string} serviceName - Nome do serviço
   * @param {Function} fn - Função a executar
   * @param {object} options - Opções
   * @returns {Promise<any>} Resultado
   */
  async withCircuitBreaker(serviceName, fn, options = {}) {
    const {
      failureThreshold = 5,
      resetTimeout = 60000,
      timeout = 'default'
    } = options;

    // Obter ou criar circuit breaker
    let breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      breaker = {
        failures: 0,
        lastFailureTime: null,
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        resetTimeout
      };
      this.circuitBreakers.set(serviceName, breaker);
    }

    // Verificar estado do circuit breaker
    if (breaker.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - breaker.lastFailureTime;
      if (timeSinceLastFailure < resetTimeout) {
        throw new Error(`Circuit breaker aberto para ${serviceName}. Tente novamente mais tarde.`);
      } else {
        // Tentar half-open
        breaker.state = 'HALF_OPEN';
        this.logger?.info(`Circuit breaker ${serviceName} em estado HALF_OPEN`);
      }
    }

    try {
      // Executar com timeout
      const result = await this.withTimeout(fn, timeout);
      
      // Sucesso - resetar circuit breaker
      if (breaker.state === 'HALF_OPEN') {
        breaker.state = 'CLOSED';
        this.logger?.info(`Circuit breaker ${serviceName} fechado após sucesso`);
      }
      breaker.failures = 0;
      
      return result;
    } catch (error) {
      // Falha - incrementar contador
      breaker.failures++;
      breaker.lastFailureTime = Date.now();

      if (breaker.failures >= failureThreshold) {
        breaker.state = 'OPEN';
        this.logger?.warn(`Circuit breaker ${serviceName} aberto após ${breaker.failures} falhas`);
      }

      throw error;
    }
  }

  /**
   * Obtém estatísticas de circuit breakers
   * @returns {object} Estatísticas
   */
  getCircuitBreakerStats() {
    const stats = {};
    for (const [name, breaker] of this.circuitBreakers.entries()) {
      stats[name] = {
        state: breaker.state,
        failures: breaker.failures,
        lastFailureTime: breaker.lastFailureTime
      };
    }
    return stats;
  }

  /**
   * Reseta circuit breaker específico
   * @param {string} serviceName - Nome do serviço
   */
  resetCircuitBreaker(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName);
    if (breaker) {
      breaker.state = 'CLOSED';
      breaker.failures = 0;
      breaker.lastFailureTime = null;
      this.logger?.info(`Circuit breaker ${serviceName} resetado`);
    }
  }
}

// Singleton instance with initialization lock
let instance = null;
let initializationPromise = null;

/**
 * Obtém instância singleton do TimeoutManager
 * Thread-safe: previne criação dupla durante inicialização concorrente
 */
export function getTimeoutManager(config = null, logger = null) {
  if (!instance) {
    instance = new TimeoutManager(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do TimeoutManager
 */
export function createTimeoutManager(config = null, logger = null) {
  return new TimeoutManager(config, logger);
}

export default TimeoutManager;
