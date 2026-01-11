/**
 * AntiSkipMechanism - Sistema Anti-Skip Mechanism
 * 
 * Previne pulo de checks obrigatórios durante execução.
 * 
 * Funcionalidades:
 * - Detecção de tentativa de pular check
 * - Bloqueio automático de progressão
 * - Registro de tentativas de skip
 * - Validação de execução de checks obrigatórios
 * 
 * Métricas de Sucesso:
 * - 0% de checks obrigatórios pulados
 * - 100% de tentativas de skip registradas
 * - 100% de bloqueios automáticos funcionando
 */

import BaseSystem from '../../core/BaseSystem.js';

class AntiSkipMechanism extends BaseSystem {
  async onInitialize() {
    this.executedChecks = new Set();
    this.requiredChecks = new Set();
    this.skipAttempts = [];
    this.logger?.info('AntiSkipMechanism inicializado');
  }

  /**
   * Executa validação anti-skip
   * 
   * @param {Object} context - Contexto com checkId e required
   * @returns {Promise<Object>} Resultado da validação
   */
  async onExecute(context) {
    const { checkId, required, action } = context;

    if (!checkId) {
      throw new Error('checkId é obrigatório no contexto');
    }

    if (action === 'register') {
      return await this.registerCheck(checkId, required);
    } else if (action === 'validate') {
      return await this.validateCheckExecution(checkId, required);
    } else if (action === 'preventSkip') {
      return await this.preventSkip(checkId);
    } else if (action === 'markExecuted') {
      return await this.markExecuted(checkId);
    } else {
      throw new Error(`Ação desconhecida: ${action}. Use: register, validate, preventSkip, markExecuted`);
    }
  }

  /**
   * Registra check como obrigatório ou opcional
   * 
   * @param {string} checkId - ID do check
   * @param {boolean} required - Se é obrigatório
   * @returns {Promise<Object>} Resultado do registro
   */
  async registerCheck(checkId, required = false) {
    if (required) {
      this.requiredChecks.add(checkId);
      this.logger?.info(`Check obrigatório registrado: ${checkId}`);
    }

    return {
      registered: true,
      checkId,
      required,
      totalRequired: this.requiredChecks.size
    };
  }

  /**
   * Valida se check obrigatório foi executado
   * 
   * @param {string} checkId - ID do check
   * @param {boolean} required - Se é obrigatório (opcional, usa registro se não fornecido)
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateCheckExecution(checkId, required = null) {
    const isRequired = required !== null ? required : this.requiredChecks.has(checkId);
    const wasExecuted = this.executedChecks.has(checkId);

    if (isRequired && !wasExecuted) {
      const error = new Error(`Check obrigatório ${checkId} não foi executado`);
      this.logger?.error('Check obrigatório não executado', { checkId });
      throw error;
    }

    return {
      valid: true,
      checkId,
      required: isRequired,
      executed: wasExecuted
    };
  }

  /**
   * Previne skip de check obrigatório
   * 
   * @param {string} checkId - ID do check
   * @returns {Object} Resultado da prevenção
   */
  preventSkip(checkId) {
    const isRequired = this.requiredChecks.has(checkId);
    const wasExecuted = this.executedChecks.has(checkId);

    if (isRequired && !wasExecuted) {
      // Registrar tentativa de skip
      this.logSkipAttempt(checkId, 'Tentativa de pular check obrigatório');

      return {
        blocked: true,
        reason: 'Check obrigatório não foi executado',
        checkId,
        required: true
      };
    }

    return {
      blocked: false,
      checkId,
      required: isRequired
    };
  }

  /**
   * Marca check como executado
   * 
   * @param {string} checkId - ID do check
   * @returns {Object} Resultado
   */
  markExecuted(checkId) {
    this.executedChecks.add(checkId);
    this.logger?.debug(`Check marcado como executado: ${checkId}`);

    return {
      marked: true,
      checkId,
      totalExecuted: this.executedChecks.size
    };
  }

  /**
   * Registra tentativa de skip
   * 
   * @param {string} checkId - ID do check
   * @param {string} reason - Motivo
   */
  logSkipAttempt(checkId, reason) {
    const attempt = {
      checkId,
      reason,
      timestamp: new Date().toISOString(),
      blocked: true
    };

    this.skipAttempts.push(attempt);
    this.logger?.warn('Tentativa de skip detectada', attempt);
  }

  /**
   * Verifica se check foi executado
   * 
   * @param {string} checkId - ID do check
   * @returns {boolean} Se foi executado
   */
  wasExecuted(checkId) {
    return this.executedChecks.has(checkId);
  }

  /**
   * Verifica se check é obrigatório
   * 
   * @param {string} checkId - ID do check
   * @returns {boolean} Se é obrigatório
   */
  isRequired(checkId) {
    return this.requiredChecks.has(checkId);
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const requiredNotExecuted = Array.from(this.requiredChecks).filter(
      checkId => !this.executedChecks.has(checkId)
    );

    return {
      totalRequired: this.requiredChecks.size,
      totalExecuted: this.executedChecks.size,
      requiredNotExecuted: requiredNotExecuted.length,
      skipAttempts: this.skipAttempts.length,
      complianceRate: this.requiredChecks.size > 0
        ? (this.executedChecks.size / this.requiredChecks.size) * 100
        : 100
    };
  }

  /**
   * Obtém tentativas de skip
   * 
   * @returns {Array<Object>} Tentativas de skip
   */
  getSkipAttempts() {
    return [...this.skipAttempts];
  }

  /**
   * Limpa estado (útil para testes)
   */
  reset() {
    this.executedChecks.clear();
    this.requiredChecks.clear();
    this.skipAttempts = [];
    this.logger?.info('AntiSkipMechanism resetado');
  }

  /**
   * Valida contexto
   * 
   * @param {Object} context - Contexto
   * @returns {Object} Resultado da validação
   */
  onValidate(context) {
    if (!context || typeof context !== 'object') {
      return { valid: false, errors: ['Context deve ser um objeto'] };
    }

    if (!context.checkId || typeof context.checkId !== 'string') {
      return { valid: false, errors: ['checkId é obrigatório e deve ser string'] };
    }

    if (!context.action || typeof context.action !== 'string') {
      return { valid: false, errors: ['action é obrigatório e deve ser string'] };
    }

    const validActions = ['register', 'validate', 'preventSkip', 'markExecuted'];
    if (!validActions.includes(context.action)) {
      return { valid: false, errors: [`action deve ser um de: ${validActions.join(', ')}`] };
    }

    return { valid: true };
  }

  /**
   * Retorna dependências do sistema
   * 
   * @returns {Array<string>} Dependências
   */
  onGetDependencies() {
    return ['logger', 'config'];
  }
}

export default AntiSkipMechanism;

/**
 * Factory function para criar AntiSkipMechanism
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {AntiSkipMechanism} Instância do AntiSkipMechanism
 */
export function createAntiSkipMechanism(config = null, logger = null, errorHandler = null) {
  return new AntiSkipMechanism(config, logger, errorHandler);
}
