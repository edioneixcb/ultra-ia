/**
 * ThreeERuleValidator - Sistema de Regra dos 3E
 * 
 * Valida obrigatoriamente Especificação+Execução+Evidência em checks.
 * 
 * Funcionalidades:
 * - Validação dos 3E (ESPECIFICAÇÃO, EXECUÇÃO, EVIDÊNCIA)
 * - Extração automática dos componentes
 * - Invalidação de check se qualquer componente faltar
 * 
 * Métricas de Sucesso:
 * - 100% dos checks têm os 3E presentes
 * - 0% de checks inválidos por falta de componentes
 * - 100% de validação automática funcionando
 */

import BaseSystem from '../../core/BaseSystem.js';

class ThreeERuleValidator extends BaseSystem {
  async onInitialize() {
    this.validatedChecks = new Map();
    this.logger?.info('ThreeERuleValidator inicializado');
  }

  /**
   * Valida check contra regra dos 3E
   * 
   * @param {Object} context - Contexto com check a validar
   * @returns {Promise<Object>} Resultado da validação
   */
  async onExecute(context) {
    const { check, checkId } = context;

    if (!check && !checkId) {
      throw new Error('check ou checkId é obrigatório no contexto');
    }

    const checkToValidate = check || this.validatedChecks.get(checkId);

    if (!checkToValidate) {
      throw new Error(`Check não encontrado: ${checkId || 'fornecido'}`);
    }

    return this.validate(checkToValidate, checkId);
  }

  /**
   * Valida check contra regra dos 3E
   * 
   * @param {Object} check - Check a validar
   * @param {string} checkId - ID do check (opcional)
   * @returns {Object} Resultado da validação
   */
  validate(check, checkId = null) {
    if (!check || typeof check !== 'object') {
      throw new Error('Check deve ser um objeto válido');
    }

    const missing = [];
    const components = {};

    // Extrair componentes (suporta diferentes formatos de nomenclatura)
    const especificacao = check.especificacao || check.especificação || check.specification || check.spec;
    const execucao = check.execucao || check.execução || check.execution || check.exec;
    const evidencia = check.evidencia || check.evidência || check.evidence || check.evid;

    // Validar ESPECIFICAÇÃO
    if (!especificacao || (typeof especificacao === 'string' && especificacao.trim().length === 0)) {
      missing.push('ESPECIFICAÇÃO');
    } else {
      components.especificacao = typeof especificacao === 'string' ? especificacao.trim() : especificacao;
    }

    // Validar EXECUÇÃO
    if (!execucao || (typeof execucao === 'string' && execucao.trim().length === 0)) {
      missing.push('EXECUÇÃO');
    } else {
      components.execucao = typeof execucao === 'string' ? execucao.trim() : execucao;
    }

    // Validar EVIDÊNCIA
    if (!evidencia || (typeof evidencia === 'string' && evidencia.trim().length === 0)) {
      missing.push('EVIDÊNCIA');
    } else {
      components.evidencia = typeof evidencia === 'string' ? evidencia.trim() : evidencia;
    }

    // Se algum componente está faltando, check é inválido
    if (missing.length > 0) {
      const error = new Error(
        `Check inválido. Componentes faltando: ${missing.join(', ')}. ` +
        `Regra dos 3E requer: ESPECIFICAÇÃO, EXECUÇÃO e EVIDÊNCIA.`
      );

      this.logger?.error('Check inválido - componentes faltando', {
        checkId: checkId || check.id || 'desconhecido',
        missing,
        checkKeys: Object.keys(check)
      });

      throw error;
    }

    // Check válido - armazenar se tem ID
    if (checkId || check.id) {
      const id = checkId || check.id;
      this.validatedChecks.set(id, {
        ...check,
        validatedAt: new Date().toISOString(),
        components
      });
    }

    this.logger?.debug('Check validado com sucesso', {
      checkId: checkId || check.id || 'desconhecido',
      hasEspecificacao: !!components.especificacao,
      hasExecucao: !!components.execucao,
      hasEvidencia: !!components.evidencia
    });

    return {
      valid: true,
      checkId: checkId || check.id || null,
      components,
      validatedAt: new Date().toISOString()
    };
  }

  /**
   * Extrai componentes dos 3E de um check
   * 
   * @param {Object} check - Check
   * @returns {Object} Componentes extraídos
   */
  extractComponents(check) {
    return {
      especificacao: check.especificacao || check.especificação || check.specification || check.spec || null,
      execucao: check.execucao || check.execução || check.execution || check.exec || null,
      evidencia: check.evidencia || check.evidência || check.evidence || check.evid || null
    };
  }

  /**
   * Verifica se check tem todos os 3E
   * 
   * @param {Object} check - Check
   * @returns {boolean} Se tem todos os 3E
   */
  hasAllThreeE(check) {
    const components = this.extractComponents(check);
    return !!(components.especificacao && components.execucao && components.evidencia);
  }

  /**
   * Obtém checks validados
   * 
   * @returns {Array<Object>} Checks validados
   */
  getValidatedChecks() {
    return Array.from(this.validatedChecks.values());
  }

  /**
   * Obtém check validado por ID
   * 
   * @param {string} checkId - ID do check
   * @returns {Object|null} Check validado ou null
   */
  getValidatedCheck(checkId) {
    return this.validatedChecks.get(checkId) || null;
  }

  /**
   * Limpa checks validados (útil para testes)
   */
  reset() {
    this.validatedChecks.clear();
    this.logger?.info('ThreeERuleValidator resetado');
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

    if (!context.check && !context.checkId) {
      return { valid: false, errors: ['check ou checkId é obrigatório'] };
    }

    if (context.check && typeof context.check !== 'object') {
      return { valid: false, errors: ['check deve ser um objeto'] };
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

export default ThreeERuleValidator;

/**
 * Factory function para criar ThreeERuleValidator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {ThreeERuleValidator} Instância do ThreeERuleValidator
 */
export function createThreeERuleValidator(config = null, logger = null, errorHandler = null) {
  return new ThreeERuleValidator(config, logger, errorHandler);
}
