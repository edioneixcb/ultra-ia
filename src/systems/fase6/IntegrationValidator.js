/**
 * IntegrationValidator - Validador de Integrações
 * 
 * Valida padrões de integração com serviços externos.
 * 
 * Validações:
 * - Webhooks
 * - OAuth callbacks
 * - API clients
 * - Error handling de integrações
 * 
 * Métricas de Sucesso:
 * - 100% dos webhooks validados
 * - 100% dos callbacks OAuth verificados
 * - 100% dos API clients validados
 */

import BaseSystem from '../../core/BaseSystem.js';

class IntegrationValidator extends BaseSystem {
  async onInitialize() {
    this.validations = new Map();
    this.logger?.info('IntegrationValidator inicializado');
  }

  /**
   * Valida integração
   * 
   * @param {Object} context - Contexto com code, type e opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async onExecute(context) {
    const { action, code, type, validationId, options = {} } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'validate') {
      if (!code || !type) {
        throw new Error('code e type são obrigatórios para validate');
      }
      return await this.validateIntegration(code, type, options, validationId);
    } else if (action === 'getValidation') {
      if (!validationId) {
        throw new Error('validationId é obrigatório para getValidation');
      }
      return this.getValidation(validationId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Valida integração
   * 
   * @param {string} code - Código a validar
   * @param {string} type - Tipo de validação (webhook, oauth-callback, api-client, error-handling)
   * @param {Object} options - Opções de validação
   * @param {string} validationId - ID da validação (opcional)
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateIntegration(code, type, options = {}, validationId = null) {
    let result;

    switch (type) {
      case 'webhook':
        result = await this.validateWebhook(code, options);
        break;
      case 'oauth-callback':
        result = await this.validateOAuthCallback(code, options);
        break;
      case 'api-client':
        result = await this.validateAPIClient(code, options);
        break;
      case 'error-handling':
        result = await this.validateErrorHandling(code, options);
        break;
      default:
        throw new Error(`Tipo de validação desconhecido: ${type}`);
    }

    // Armazenar validação
    const id = validationId || `validation-${Date.now()}`;
    this.validations.set(id, {
      ...result,
      code,
      type,
      validatedAt: new Date().toISOString()
    });

    return result;
  }

  /**
   * Valida Webhook
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateWebhook(code, options) {
    const issues = [];

    // Verificar se valida assinatura
    if (!/validateSignature|verifySignature|signature.*valid/i.test(code)) {
      issues.push({
        type: 'missing_signature_validation',
        severity: 'high',
        description: 'Webhook deve validar assinatura para segurança'
      });
    }

    // Verificar se tem tratamento de erro
    if (!/try.*catch|error.*handle/i.test(code)) {
      issues.push({
        type: 'missing_error_handling',
        severity: 'medium',
        description: 'Webhook deve ter tratamento de erro'
      });
    }

    // Verificar se retorna resposta apropriada
    if (!/res\.status\(200\)|res\.json/i.test(code)) {
      issues.push({
        type: 'missing_response',
        severity: 'medium',
        description: 'Webhook deve retornar resposta apropriada'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'webhook'
    };
  }

  /**
   * Valida OAuth Callback
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateOAuthCallback(code, options) {
    const issues = [];

    // Verificar se valida state
    if (!/validateState|state.*valid/i.test(code)) {
      issues.push({
        type: 'missing_state_validation',
        severity: 'high',
        description: 'OAuth callback deve validar state'
      });
    }

    // Verificar se trata erro
    if (!/error.*query|req\.query\.error/i.test(code)) {
      issues.push({
        type: 'missing_error_check',
        severity: 'high',
        description: 'OAuth callback deve verificar erros na query'
      });
    }

    // Verificar se troca código por token
    if (!/exchangeCodeForToken|code.*token/i.test(code)) {
      issues.push({
        type: 'missing_token_exchange',
        severity: 'high',
        description: 'OAuth callback deve trocar código por token'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'oauth-callback'
    };
  }

  /**
   * Valida API Client
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateAPIClient(code, options) {
    const issues = [];

    // Verificar se tem timeout
    if (!/timeout/i.test(code)) {
      issues.push({
        type: 'missing_timeout',
        severity: 'medium',
        description: 'API Client deve ter timeout configurado'
      });
    }

    // Verificar se tem tratamento de erro
    if (!/try.*catch|error.*handle/i.test(code)) {
      issues.push({
        type: 'missing_error_handling',
        severity: 'high',
        description: 'API Client deve ter tratamento de erro'
      });
    }

    // Verificar se valida resposta
    if (!/response\.ok|status.*200/i.test(code)) {
      issues.push({
        type: 'missing_response_validation',
        severity: 'medium',
        description: 'API Client deve validar resposta'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'api-client'
    };
  }

  /**
   * Valida Error Handling
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateErrorHandling(code, options) {
    const issues = [];

    // Verificar se classifica erros
    if (!/classifyError|error.*type/i.test(code)) {
      issues.push({
        type: 'missing_error_classification',
        severity: 'medium',
        description: 'Error handling deve classificar erros'
      });
    }

    // Verificar se tem retry logic
    if (!/retry|retryable/i.test(code)) {
      issues.push({
        type: 'missing_retry_logic',
        severity: 'low',
        description: 'Error handling deve ter lógica de retry para erros temporários'
      });
    }

    // Verificar se loga erros
    if (!/logger|log.*error/i.test(code)) {
      issues.push({
        type: 'missing_logging',
        severity: 'medium',
        description: 'Error handling deve logar erros'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'error-handling'
    };
  }

  /**
   * Obtém validação armazenada
   * 
   * @param {string} validationId - ID da validação
   * @returns {Object|null} Validação ou null
   */
  getValidation(validationId) {
    return this.validations.get(validationId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.validations.values());

    return {
      totalValidations: all.length,
      validIntegrations: all.filter(v => v.valid).length
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

    if (!context.action || typeof context.action !== 'string') {
      return { valid: false, errors: ['action é obrigatório e deve ser string'] };
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

export default IntegrationValidator;

/**
 * Factory function para criar IntegrationValidator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {IntegrationValidator} Instância do IntegrationValidator
 */
export function createIntegrationValidator(config = null, logger = null, errorHandler = null) {
  return new IntegrationValidator(config, logger, errorHandler);
}
