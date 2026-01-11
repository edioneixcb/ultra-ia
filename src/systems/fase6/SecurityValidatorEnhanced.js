/**
 * SecurityValidatorEnhanced - Validador de Segurança Avançada
 * 
 * Valida padrões de segurança avançados.
 * 
 * Validações:
 * - E2E Encryption
 * - OAuth flows
 * - RLS policies
 * - Device Binding
 * 
 * Métricas de Sucesso:
 * - 100% das implementações de segurança validadas
 * - 100% dos fluxos OAuth verificados
 * - 100% das políticas RLS validadas
 */

import BaseSystem from '../../core/BaseSystem.js';

class SecurityValidatorEnhanced extends BaseSystem {
  async onInitialize() {
    this.validations = new Map();
    this.logger?.info('SecurityValidatorEnhanced inicializado');
  }

  /**
   * Valida segurança
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
      return await this.validateSecurity(code, type, options, validationId);
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
   * Valida segurança
   * 
   * @param {string} code - Código a validar
   * @param {string} type - Tipo de validação (e2e-encryption, oauth, rls, device-binding)
   * @param {Object} options - Opções de validação
   * @param {string} validationId - ID da validação (opcional)
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateSecurity(code, type, options = {}, validationId = null) {
    let result;

    switch (type) {
      case 'e2e-encryption':
        result = await this.validateE2EEncryption(code, options);
        break;
      case 'oauth':
        result = await this.validateOAuthFlow(code, options);
        break;
      case 'rls':
        result = await this.validateRLSPolicy(code, options);
        break;
      case 'device-binding':
        result = await this.validateDeviceBinding(code, options);
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
   * Valida E2E Encryption
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateE2EEncryption(code, options) {
    const issues = [];

    // Verificar se usa algoritmo seguro
    if (!/aes-256-gcm|chacha20-poly1305/i.test(code)) {
      issues.push({
        type: 'insecure_algorithm',
        severity: 'high',
        description: 'E2E Encryption deve usar algoritmo seguro (AES-256-GCM ou ChaCha20-Poly1305)'
      });
    }

    // Verificar se tem autenticação (auth tag)
    if (!/authTag|auth_tag|getAuthTag/i.test(code)) {
      issues.push({
        type: 'missing_authentication',
        severity: 'high',
        description: 'E2E Encryption deve incluir autenticação (auth tag)'
      });
    }

    // Verificar se usa IV aleatório
    if (!/randomBytes|random.*iv|iv.*random/i.test(code)) {
      issues.push({
        type: 'missing_random_iv',
        severity: 'high',
        description: 'E2E Encryption deve usar IV aleatório'
      });
    }

    // Verificar se não armazena chaves em texto plano
    if (/const\s+\w*key\w*\s*=\s*['"][^'"]+['"]/i.test(code)) {
      issues.push({
        type: 'hardcoded_key',
        severity: 'critical',
        description: 'Chaves não devem ser hardcoded no código'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'e2e-encryption'
    };
  }

  /**
   * Valida OAuth Flow
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateOAuthFlow(code, options) {
    const issues = [];

    // Verificar se valida state
    if (!/validateState|state.*valid/i.test(code)) {
      issues.push({
        type: 'missing_state_validation',
        severity: 'high',
        description: 'OAuth flow deve validar state para prevenir CSRF'
      });
    }

    // Verificar se usa HTTPS
    if (/http:\/\//.test(code) && !/https:\/\//.test(code)) {
      issues.push({
        type: 'insecure_protocol',
        severity: 'high',
        description: 'OAuth deve usar HTTPS'
      });
    }

    // Verificar se não expõe client secret
    if (/clientSecret.*console|console.*clientSecret/i.test(code)) {
      issues.push({
        type: 'exposed_secret',
        severity: 'critical',
        description: 'Client secret não deve ser exposto'
      });
    }

    // Verificar se tem refresh token
    if (!/refreshToken|refresh_token/i.test(code)) {
      issues.push({
        type: 'missing_refresh_token',
        severity: 'medium',
        description: 'OAuth flow deve suportar refresh token'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'oauth'
    };
  }

  /**
   * Valida RLS Policy
   * 
   * @param {string} code - Código SQL a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateRLSPolicy(code, options) {
    const issues = [];

    // Verificar se RLS está habilitado
    if (!/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(code)) {
      issues.push({
        type: 'rls_not_enabled',
        severity: 'high',
        description: 'RLS deve ser habilitado na tabela'
      });
    }

    // Verificar se tem policies definidas
    if (!/CREATE\s+POLICY/i.test(code)) {
      issues.push({
        type: 'missing_policies',
        severity: 'high',
        description: 'RLS deve ter policies definidas'
      });
    }

    // Verificar se policies cobrem todas as operações
    const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    for (const op of operations) {
      if (!new RegExp(`FOR\\s+${op}`, 'i').test(code)) {
        issues.push({
          type: 'missing_operation_policy',
          severity: 'medium',
          description: `RLS deve ter policy para ${op}`
        });
      }
    }

    // Verificar se usa current_setting para user context
    if (!/current_setting/i.test(code)) {
      issues.push({
        type: 'missing_user_context',
        severity: 'medium',
        description: 'RLS policies devem usar current_setting para contexto de usuário'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'rls'
    };
  }

  /**
   * Valida Device Binding
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateDeviceBinding(code, options) {
    const issues = [];

    // Verificar se gera device ID único
    if (!/generateDeviceId|deviceId|device_id/i.test(code)) {
      issues.push({
        type: 'missing_device_id',
        severity: 'high',
        description: 'Device Binding deve gerar device ID único'
      });
    }

    // Verificar se valida device
    if (!/validateDevice|checkDevice/i.test(code)) {
      issues.push({
        type: 'missing_validation',
        severity: 'high',
        description: 'Device Binding deve validar dispositivo'
      });
    }

    // Verificar se armazena device info
    if (!/deviceInfo|device_info|deviceBinding/i.test(code)) {
      issues.push({
        type: 'missing_device_info',
        severity: 'medium',
        description: 'Device Binding deve armazenar informações do dispositivo'
      });
    }

    // Verificar se tem expiração
    if (!/expires|expiration|maxAge/i.test(code)) {
      issues.push({
        type: 'missing_expiration',
        severity: 'medium',
        description: 'Device Binding deve ter expiração'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'device-binding'
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
      validSecurity: all.filter(v => v.valid).length,
      issuesBySeverity: this.getIssuesBySeverity(all)
    };
  }

  /**
   * Obtém issues agrupadas por severidade
   * 
   * @param {Array<Object>} validations - Validações
   * @returns {Object} Issues agrupadas
   */
  getIssuesBySeverity(validations) {
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const validation of validations) {
      for (const issue of validation.issues || []) {
        bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
      }
    }

    return bySeverity;
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

export default SecurityValidatorEnhanced;

/**
 * Factory function para criar SecurityValidatorEnhanced
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {SecurityValidatorEnhanced} Instância do SecurityValidatorEnhanced
 */
export function createSecurityValidatorEnhanced(config = null, logger = null, errorHandler = null) {
  return new SecurityValidatorEnhanced(config, logger, errorHandler);
}
