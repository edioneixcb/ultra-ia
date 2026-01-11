/**
 * MobileValidator - Validador Mobile
 * 
 * Valida padrões de desenvolvimento mobile.
 * 
 * Validações:
 * - Expo Router
 * - WatermelonDB
 * - Offline-first patterns
 * - React Native performance
 * 
 * Métricas de Sucesso:
 * - 100% dos padrões mobile validados
 * - 100% das otimizações de performance verificadas
 */

import BaseSystem from '../../core/BaseSystem.js';

class MobileValidator extends BaseSystem {
  async onInitialize() {
    this.validations = new Map();
    this.logger?.info('MobileValidator inicializado');
  }

  /**
   * Valida código mobile
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
      return await this.validateMobile(code, type, options, validationId);
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
   * Valida código mobile
   * 
   * @param {string} code - Código a validar
   * @param {string} type - Tipo de validação (expo-router, watermelon, offline-first, performance)
   * @param {Object} options - Opções de validação
   * @param {string} validationId - ID da validação (opcional)
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateMobile(code, type, options = {}, validationId = null) {
    let result;

    switch (type) {
      case 'expo-router':
        result = await this.validateExpoRouter(code, options);
        break;
      case 'watermelon':
        result = await this.validateWatermelonDB(code, options);
        break;
      case 'offline-first':
        result = await this.validateOfflineFirst(code, options);
        break;
      case 'performance':
        result = await this.validatePerformance(code, options);
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
   * Valida Expo Router
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateExpoRouter(code, options) {
    const issues = [];

    // Verificar se usa useRouter
    if (!/useRouter|from\s+['"]expo-router['"]/i.test(code)) {
      issues.push({
        type: 'missing_router',
        severity: 'high',
        description: 'Expo Router deve usar useRouter hook'
      });
    }

    // Verificar se usa StyleSheet
    if (!/StyleSheet|from\s+['"]react-native['"]/i.test(code)) {
      issues.push({
        type: 'missing_stylesheet',
        severity: 'medium',
        description: 'Expo Screen deve usar StyleSheet para estilos'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'expo-router'
    };
  }

  /**
   * Valida WatermelonDB
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateWatermelonDB(code, options) {
    const issues = [];

    // Verificar se estende Model
    if (!/extends\s+Model|@nozbe\/watermelondb/i.test(code)) {
      issues.push({
        type: 'missing_model_base',
        severity: 'high',
        description: 'WatermelonDB model deve estender Model'
      });
    }

    // Verificar se tem decorators
    if (!/@field|@text|@date/i.test(code)) {
      issues.push({
        type: 'missing_decorators',
        severity: 'high',
        description: 'WatermelonDB model deve usar decorators'
      });
    }

    // Verificar se tem table estático
    if (!/static\s+table/i.test(code)) {
      issues.push({
        type: 'missing_table',
        severity: 'high',
        description: 'WatermelonDB model deve ter static table'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'watermelon'
    };
  }

  /**
   * Valida Offline-first patterns
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateOfflineFirst(code, options) {
    const issues = [];

    // Verificar se tem sincronização
    if (!/sync|synchronize/i.test(code)) {
      issues.push({
        type: 'missing_sync',
        severity: 'high',
        description: 'Offline-first deve ter sincronização'
      });
    }

    // Verificar se tem fila offline
    if (!/queue|offline.*queue/i.test(code)) {
      issues.push({
        type: 'missing_queue',
        severity: 'medium',
        description: 'Offline-first deve ter fila para operações offline'
      });
    }

    // Verificar se detecta conectividade
    if (!/network|connectivity|online|offline/i.test(code)) {
      issues.push({
        type: 'missing_connectivity_check',
        severity: 'medium',
        description: 'Offline-first deve verificar conectividade'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'offline-first'
    };
  }

  /**
   * Valida Performance
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validatePerformance(code, options) {
    const issues = [];

    // Verificar se usa useMemo para cálculos pesados
    const heavyCalculations = /for\s*\(|\.map\(|\.filter\(|\.reduce\(/g;
    const matches = code.match(heavyCalculations) || [];
    if (matches.length > 3 && !/useMemo/i.test(code)) {
      issues.push({
        type: 'missing_memoization',
        severity: 'medium',
        description: 'Cálculos pesados devem usar useMemo'
      });
    }

    // Verificar se usa FlatList para listas grandes
    if (/\.map\(.*key/i.test(code) && !/FlatList/i.test(code)) {
      issues.push({
        type: 'should_use_flatlist',
        severity: 'low',
        description: 'Listas grandes devem usar FlatList ao invés de map'
      });
    }

    // Verificar se não renderiza inline functions
    if (/onPress.*=>|onPress.*function/i.test(code) && /render/i.test(code)) {
      issues.push({
        type: 'inline_function',
        severity: 'low',
        description: 'Evitar funções inline em render para melhor performance'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'performance'
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
      validMobile: all.filter(v => v.valid).length
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

export default MobileValidator;

/**
 * Factory function para criar MobileValidator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {MobileValidator} Instância do MobileValidator
 */
export function createMobileValidator(config = null, logger = null, errorHandler = null) {
  return new MobileValidator(config, logger, errorHandler);
}
