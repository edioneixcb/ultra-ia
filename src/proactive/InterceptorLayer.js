/**
 * InterceptorLayer
 *
 * Intercepta chamadas MCP e valida o código antes da execução.
 */

import { getLogger } from '../utils/Logger.js';
import { getErrorHandler } from '../utils/ErrorHandler.js';
import { getValidator } from '../components/MultiLayerValidator.js';
import { getEventBus } from '../infrastructure/EventBus.js';
import ConsensusSystem from '../agents/ConsensusSystem.js';

class InterceptorLayer {
  constructor(config = null, logger = null, errorHandler = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.errorHandler = errorHandler || getErrorHandler(config, this.logger);
    this.validator = getValidator(config, this.logger, this.errorHandler);
    this.eventBus = getEventBus(config, this.logger);
    this.consensus = new ConsensusSystem(config, this.logger);
    this.enabled = config?.features?.enableProactiveLayer !== false;
    this.minScore = config?.proactive?.interceptor?.minScore || 70;
    this.layers = config?.proactive?.interceptor?.layers || ['syntax', 'structure', 'security', 'bestPractices'];
  }

  /**
   * Analisa chamada MCP e decide se bloqueia.
   * @param {string} toolName - Nome da ferramenta MCP
   * @param {object} args - Argumentos da ferramenta
   * @returns {Promise<object>} Resultado da interceptação
   */
  async analyze(toolName, args = {}) {
    if (!this.enabled) {
      return { blocked: false };
    }

    const code = args.code;
    if (!code || typeof code !== 'string') {
      return { blocked: false };
    }

    try {
      const language = args.language || 'javascript';
      const validation = await this.validator.validate(code, {
        language,
        layers: this.layers
      });

      if (!validation.valid || validation.score < this.minScore) {
        const reason = `Validação falhou (${validation.score}/100): ${validation.errors.join('; ')}`;
        this.eventBus.emit('validation:failed', {
          toolName,
          score: validation.score,
          errors: validation.errors
        });
        return { blocked: true, reason, validation };
      }

      if (args.consensusResults) {
        const verdict = this.consensus.evaluate(args.consensusResults);
        if (!verdict.approved) {
          const reason = `Bloqueado por consenso: ${verdict.reasons.join('; ')}`;
          return { blocked: true, reason, verdict };
        }
      }

      return { blocked: false, validation };
    } catch (error) {
      this.errorHandler?.handleError(error, {
        component: 'InterceptorLayer',
        operation: 'analyze',
        toolName
      });
      return {
        blocked: true,
        reason: `Erro na interceptação: ${error.message}`
      };
    }
  }
}

let instance = null;

/**
 * Obtém instância singleton do InterceptorLayer.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @param {object} errorHandler - ErrorHandler (opcional)
 * @returns {InterceptorLayer} Instância
 */
export function getInterceptorLayer(config = null, logger = null, errorHandler = null) {
  if (!instance) {
    instance = new InterceptorLayer(config, logger, errorHandler);
  }
  return instance;
}

/**
 * Cria nova instância do InterceptorLayer.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @param {object} errorHandler - ErrorHandler
 * @returns {InterceptorLayer} Nova instância
 */
export function createInterceptorLayer(config = null, logger = null, errorHandler = null) {
  return new InterceptorLayer(config, logger, errorHandler);
}

export default InterceptorLayer;
