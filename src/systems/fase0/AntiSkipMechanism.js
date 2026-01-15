/**
 * AntiSkipMechanism - Sistema de Prevenção de Pulo de Etapas
 * 
 * Garante que checks e checkpoints obrigatórios sejam executados.
 * Mantém estado em memória para rastrear progresso da sessão.
 * 
 * Funcionalidades:
 * - Registro de execução de checks
 * - Validação de obrigatoriedade
 * - Bloqueio fatal se check crítico for pulado
 * - Relatório de skips tentados
 */

import BaseSystem from '../../core/BaseSystem.js';

class AntiSkipMechanism extends BaseSystem {
  async onInitialize() {
    this.executionLog = new Set(); // IDs de checks executados
    this.executedChecks = this.executionLog; // alias para compatibilidade
    this.skipAttempts = [];
    this.requiredChecks = new Map(); // checkId -> required flag
    this.logger?.info('AntiSkipMechanism inicializado');
  }

  /**
   * Registra execução de um check
   * @param {Object} context { checkId, status }
   */
  async onExecute(context) {
    const { action, checkId, required = false } = context;

    switch (action) {
      case 'register':
        // Registrar check e se é obrigatório
        this.requiredChecks.set(checkId, required === true);
        return { registered: true, required: required === true };

      case 'validate':
        return this.validateCheckExecution(checkId, required === true);

      case 'markExecuted':
        this.executionLog.add(checkId);
        return { marked: true };

      case 'preventSkip':
        return this.preventSkip(checkId);

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Valida se check foi executado. Lança erro se obrigatório e ausente.
   */
  validateCheckExecution(checkId, required) {
    const executed = this.executionLog.has(checkId);
    const isRequired = this.requiredChecks.has(checkId)
      ? this.isRequired(checkId)
      : (required === true);

    if (isRequired && !executed) {
      this.logSkipAttempt(checkId);
      // Erro fatal para checks obrigatórios
      const error = new Error(`PARE IMEDIATAMENTE: Check obrigatório ${checkId} não foi executado.`);
      this.logger?.error(error.message);
      throw error;
    }

    return {
      executed,
      valid: !isRequired || executed
    };
  }

  /**
   * Evita pulo de etapa verificando obrigatoriedade e execução
   * @param {string} checkId
   * @returns {object} { blocked, reason? }
   */
  preventSkip(checkId) {
    const required = this.requiredChecks.get(checkId) === true;
    const executed = this.executionLog.has(checkId);

    if (required && !executed) {
      this.logSkipAttempt(checkId);
      return {
        blocked: true,
        reason: `Check obrigatório ${checkId} não executado`
      };
    }

    return { blocked: false };
  }

  /**
   * Registra tentativa de skip para auditoria
   */
  logSkipAttempt(checkId) {
    const attempt = {
      checkId,
      timestamp: new Date().toISOString(),
      stack: new Error().stack
    };
    this.skipAttempts.push(attempt);
    this.logger?.warn(`Tentativa de skip detectada: ${checkId}`);
  }

  /**
   * Retorna relatório de integridade
   */
  getIntegrityReport() {
    return {
      totalExecuted: this.executionLog.size,
      skipAttempts: this.skipAttempts.length,
      cleanRun: this.skipAttempts.length === 0
    };
  }

  /**
   * Retorna estatísticas detalhadas
   */
  getStats() {
    const requiredList = Array.from(this.requiredChecks.entries()).filter(([, req]) => req);
    const requiredCount = requiredList.length;
    const executedRequired = requiredList.filter(([id]) => this.executionLog.has(id)).length;

    return {
      totalRequired: requiredCount,
      totalExecuted: executedRequired,
      requiredNotExecuted: requiredCount - executedRequired,
      complianceRate: requiredCount === 0 ? 100 : Math.round((executedRequired / requiredCount) * 100)
    };
  }

  /**
   * Verifica se check foi executado
   */
  wasExecuted(checkId) {
    return this.executionLog.has(checkId);
  }

  /**
   * Verifica se check é obrigatório
   */
  isRequired(checkId) {
    return this.requiredChecks.get(checkId) === true;
  }

  /**
   * Valida contexto de entrada
   */
  validate(context) {
    if (!context || typeof context !== 'object') {
      return { valid: false, reason: 'Contexto inválido' };
    }
    const { checkId, action } = context;
    const allowedActions = ['register', 'validate', 'markExecuted', 'preventSkip'];

    if (!checkId || typeof checkId !== 'string') {
      return { valid: false, reason: 'checkId é obrigatório' };
    }
    if (!action || !allowedActions.includes(action)) {
      return { valid: false, reason: 'action inválido' };
    }

    return { valid: true };
  }
}

/**
 * Cria nova instância do AntiSkipMechanism
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @param {object} errorHandler - ErrorHandler
 * @returns {AntiSkipMechanism} Nova instância
 */
export function createAntiSkipMechanism(config = null, logger = null, errorHandler = null) {
  return new AntiSkipMechanism(config, logger, errorHandler);
}

export default AntiSkipMechanism;
