/**
 * EvidenceLevelValidator - Sistema de Níveis de Evidência por Severidade
 * 
 * Valida nível de evidência adequado à severidade do check.
 * 
 * Funcionalidades:
 * - Validação de Nível (validar que evidência atende nível requerido)
 * - Classificação de Evidência (Completa, Padrão, Resumida, Mínima)
 * 
 * Métricas de Sucesso:
 * - 100% das evidências atendem nível requerido
 * - 0% de checks com evidência insuficiente
 * - 100% de classificação automática funcionando
 */

import BaseSystem from '../../core/BaseSystem.js';

class EvidenceLevelValidator extends BaseSystem {
  async onInitialize() {
    this.validations = new Map();
    this.levelHierarchy = ['Mínima', 'Resumida', 'Padrão', 'Completa'];
    this.logger?.info('EvidenceLevelValidator inicializado');
  }

  /**
   * Valida evidência contra severidade
   * 
   * @param {Object} context - Contexto com evidence e severity
   * @returns {Promise<Object>} Resultado da validação
   */
  async onExecute(context) {
    const { evidence, severity, checkId } = context;

    if (!evidence) {
      throw new Error('evidence é obrigatório no contexto');
    }

    if (!severity) {
      throw new Error('severity é obrigatório no contexto');
    }

    this.logger?.info('Validando nível de evidência', {
      checkId: checkId || 'desconhecido',
      severity
    });

    const validation = this.validate(evidence, severity);

    // Armazenar validação
    if (checkId) {
      this.validations.set(checkId, {
        ...validation,
        evidence,
        severity,
        validatedAt: new Date().toISOString()
      });
    }

    return validation;
  }

  /**
   * Valida evidência contra severidade
   * 
   * @param {Object} evidence - Evidência a validar
   * @param {string} severity - Severidade do check
   * @returns {Object} Resultado da validação
   */
  validate(evidence, severity) {
    const requiredLevel = this.getRequiredLevel(severity);
    const actualLevel = this.classifyEvidence(evidence);

    const comparison = this.compareLevels(actualLevel, requiredLevel);

    if (comparison < 0) {
      const error = new Error(
        `Evidência insuficiente. Requerido: ${requiredLevel}, Atual: ${actualLevel}`
      );
      this.logger?.error('Evidência insuficiente', {
        requiredLevel,
        actualLevel,
        severity
      });
      throw error;
    }

    return {
      valid: true,
      level: actualLevel,
      requiredLevel,
      severity,
      meetsRequirement: comparison >= 0
    };
  }

  /**
   * Obtém nível requerido para severidade
   * 
   * @param {string} severity - Severidade
   * @returns {string} Nível requerido
   */
  getRequiredLevel(severity) {
    const levels = {
      'BLOQUEADOR': 'Completa',
      'CRÍTICO': 'Completa',
      'ALTO': 'Padrão',
      'MÉDIO': 'Resumida',
      'BAIXO': 'Mínima'
    };

    return levels[severity?.toUpperCase()] || 'Mínima';
  }

  /**
   * Classifica evidência em nível
   * 
   * @param {Object} evidence - Evidência
   * @returns {string} Nível da evidência
   */
  classifyEvidence(evidence) {
    if (!evidence || typeof evidence !== 'object') {
      return 'Mínima';
    }

    // Verificar componentes da evidência
    const hasCommandOutput = !!(evidence.commandOutput || evidence.output);
    const hasScreenshot = !!(evidence.screenshot || evidence.image);
    const hasLog = !!(evidence.log || evidence.logs);
    const hasVerification = !!(evidence.verification || evidence.verified);
    const hasMultipleSources = !!(evidence.sources && evidence.sources.length > 1);
    const hasRawData = !!(evidence.rawData || evidence.raw);
    const hasMetadata = !!(evidence.metadata && Object.keys(evidence.metadata).length > 0);

    // Evidência Completa: tem todos os componentes principais + múltiplas fontes
    if (
      hasCommandOutput &&
      (hasScreenshot || hasLog) &&
      hasVerification &&
      hasMultipleSources &&
      hasRawData &&
      hasMetadata
    ) {
      return 'Completa';
    }

    // Evidência Padrão: tem output + verificação + log ou screenshot
    if (hasCommandOutput && hasVerification && (hasLog || hasScreenshot)) {
      return 'Padrão';
    }

    // Evidência Resumida: tem output básico + algum metadado
    if (hasCommandOutput && (hasLog || hasMetadata)) {
      return 'Resumida';
    }

    // Evidência Mínima: apenas output básico ou descrição
    if (hasCommandOutput || evidence.description) {
      return 'Mínima';
    }

    return 'Mínima';
  }

  /**
   * Compara dois níveis de evidência
   * 
   * @param {string} actual - Nível atual
   * @param {string} required - Nível requerido
   * @returns {number} -1 se atual < requerido, 0 se igual, 1 se atual > requerido
   */
  compareLevels(actual, required) {
    const actualIndex = this.levelHierarchy.indexOf(actual);
    const requiredIndex = this.levelHierarchy.indexOf(required);

    if (actualIndex === -1 || requiredIndex === -1) {
      this.logger?.warn('Nível de evidência desconhecido', { actual, required });
      return -1; // Assumir insuficiente se nível desconhecido
    }

    return actualIndex - requiredIndex;
  }

  /**
   * Obtém validação armazenada
   * 
   * @param {string} checkId - ID do check
   * @returns {Object|null} Validação ou null
   */
  getValidation(checkId) {
    return this.validations.get(checkId) || null;
  }

  /**
   * Lista todas as validações
   * 
   * @returns {Array<Object>} Lista de validações
   */
  listValidations() {
    return Array.from(this.validations.values());
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.validations.values());
    const byLevel = {
      'Mínima': all.filter(v => v.level === 'Mínima').length,
      'Resumida': all.filter(v => v.level === 'Resumida').length,
      'Padrão': all.filter(v => v.level === 'Padrão').length,
      'Completa': all.filter(v => v.level === 'Completa').length
    };

    return {
      total: all.length,
      byLevel,
      valid: all.filter(v => v.valid).length,
      invalid: all.filter(v => !v.valid).length
    };
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

    if (!context.evidence || typeof context.evidence !== 'object') {
      return { valid: false, errors: ['evidence é obrigatório e deve ser objeto'] };
    }

    if (!context.severity || typeof context.severity !== 'string') {
      return { valid: false, errors: ['severity é obrigatório e deve ser string'] };
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

export default EvidenceLevelValidator;

/**
 * Factory function para criar EvidenceLevelValidator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {EvidenceLevelValidator} Instância do EvidenceLevelValidator
 */
export function createEvidenceLevelValidator(config = null, logger = null, errorHandler = null) {
  return new EvidenceLevelValidator(config, logger, errorHandler);
}
