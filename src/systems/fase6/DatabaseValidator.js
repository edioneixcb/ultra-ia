/**
 * DatabaseValidator - Validador de Banco de Dados
 * 
 * Valida padrões de banco de dados e performance.
 * 
 * Validações:
 * - Migrations
 * - RLS policies
 * - Performance de queries
 * - Índices
 * 
 * Métricas de Sucesso:
 * - 100% das migrations validadas
 * - 100% das queries otimizadas verificadas
 * - 100% dos índices validados
 */

import BaseSystem from '../../core/BaseSystem.js';

class DatabaseValidator extends BaseSystem {
  async onInitialize() {
    this.validations = new Map();
    this.logger?.info('DatabaseValidator inicializado');
  }

  /**
   * Valida banco de dados
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
      return await this.validateDatabase(code, type, options, validationId);
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
   * Valida banco de dados
   * 
   * @param {string} code - Código SQL a validar
   * @param {string} type - Tipo de validação (migration, rls, query-performance, index)
   * @param {Object} options - Opções de validação
   * @param {string} validationId - ID da validação (opcional)
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateDatabase(code, type, options = {}, validationId = null) {
    let result;

    switch (type) {
      case 'migration':
        result = await this.validateMigration(code, options);
        break;
      case 'rls':
        result = await this.validateRLS(code, options);
        break;
      case 'query-performance':
        result = await this.validateQueryPerformance(code, options);
        break;
      case 'index':
        result = await this.validateIndex(code, options);
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
   * Valida Migration
   * 
   * @param {string} code - Código SQL a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateMigration(code, options) {
    const issues = [];

    // Verificar se usa transação
    if (!/BEGIN|START\s+TRANSACTION/i.test(code)) {
      issues.push({
        type: 'missing_transaction',
        severity: 'high',
        description: 'Migration deve usar transação (BEGIN/COMMIT)'
      });
    }

    // Verificar se tem rollback
    if (!/ROLLBACK|COMMIT/i.test(code)) {
      issues.push({
        type: 'missing_commit',
        severity: 'high',
        description: 'Migration deve ter COMMIT ou ROLLBACK'
      });
    }

    // Verificar se usa IF NOT EXISTS
    if (/CREATE\s+TABLE/i.test(code) && !/IF\s+NOT\s+EXISTS/i.test(code)) {
      issues.push({
        type: 'missing_if_not_exists',
        severity: 'medium',
        description: 'CREATE TABLE deve usar IF NOT EXISTS'
      });
    }

    // Verificar se tem índices apropriados
    if (/CREATE\s+TABLE/i.test(code) && !/CREATE\s+INDEX/i.test(code)) {
      issues.push({
        type: 'missing_indexes',
        severity: 'low',
        description: 'Migration deve considerar criar índices para campos frequentemente consultados'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'migration'
    };
  }

  /**
   * Valida RLS
   * 
   * @param {string} code - Código SQL a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateRLS(code, options) {
    const issues = [];

    // Verificar se RLS está habilitado
    if (!/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(code)) {
      issues.push({
        type: 'rls_not_enabled',
        severity: 'high',
        description: 'RLS deve ser habilitado'
      });
    }

    // Verificar se tem policies
    if (!/CREATE\s+POLICY/i.test(code)) {
      issues.push({
        type: 'missing_policies',
        severity: 'high',
        description: 'RLS deve ter policies definidas'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'rls'
    };
  }

  /**
   * Valida Performance de Query
   * 
   * @param {string} code - Código SQL a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateQueryPerformance(code, options) {
    const issues = [];

    // Verificar se usa EXPLAIN ANALYZE
    if (!/EXPLAIN\s+ANALYZE/i.test(code)) {
      issues.push({
        type: 'missing_explain',
        severity: 'low',
        description: 'Query de performance deve usar EXPLAIN ANALYZE'
      });
    }

    // Verificar se tem índices nas condições WHERE
    const whereConditions = code.match(/WHERE\s+([^;]+)/i);
    if (whereConditions) {
      const whereClause = whereConditions[1];
      // Verificar se campos WHERE têm índices sugeridos
      if (!/--.*index|CREATE.*INDEX/i.test(code)) {
        issues.push({
          type: 'missing_index_suggestion',
          severity: 'medium',
          description: 'Query deve sugerir índices para campos em WHERE'
        });
      }
    }

    // Verificar se não usa SELECT *
    if (/SELECT\s+\*/i.test(code)) {
      issues.push({
        type: 'select_all',
        severity: 'low',
        description: 'Evitar SELECT * para melhor performance'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'query-performance'
    };
  }

  /**
   * Valida Index
   * 
   * @param {string} code - Código SQL a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateIndex(code, options) {
    const issues = [];

    // Verificar se usa IF NOT EXISTS
    if (/CREATE\s+INDEX/i.test(code) && !/IF\s+NOT\s+EXISTS/i.test(code)) {
      issues.push({
        type: 'missing_if_not_exists',
        severity: 'medium',
        description: 'CREATE INDEX deve usar IF NOT EXISTS'
      });
    }

    // Verificar se tem ANALYZE após criação
    if (/CREATE\s+INDEX/i.test(code) && !/ANALYZE/i.test(code)) {
      issues.push({
        type: 'missing_analyze',
        severity: 'low',
        description: 'Após criar índice, deve executar ANALYZE'
      });
    }

    // Verificar se índice é apropriado (não muito grande)
    const indexColumns = code.match(/ON\s+\w+\s*\(([^)]+)\)/i);
    if (indexColumns && indexColumns[1].split(',').length > 3) {
      issues.push({
        type: 'too_many_columns',
        severity: 'low',
        description: 'Índices com muitas colunas podem ter performance ruim'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'index'
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
      validDatabases: all.filter(v => v.valid).length
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

export default DatabaseValidator;

/**
 * Factory function para criar DatabaseValidator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {DatabaseValidator} Instância do DatabaseValidator
 */
export function createDatabaseValidator(config = null, logger = null, errorHandler = null) {
  return new DatabaseValidator(config, logger, errorHandler);
}
