/**
 * ArchitectureValidator - Validador de Arquitetura
 * 
 * Valida padrões arquiteturais e separação de responsabilidades.
 * 
 * Validações:
 * - Clean Architecture (dependências entre camadas)
 * - Repository Pattern
 * - Use Case Pattern
 * - Separação de responsabilidades
 * 
 * Métricas de Sucesso:
 * - 100% das dependências entre camadas validadas
 * - 100% dos padrões Repository e Use Case validados
 * - 100% da separação de responsabilidades verificada
 */

import BaseSystem from '../../core/BaseSystem.js';

class ArchitectureValidator extends BaseSystem {
  async onInitialize() {
    this.validations = new Map();
    this.logger?.info('ArchitectureValidator inicializado');
  }

  /**
   * Valida arquitetura
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
      return await this.validateArchitecture(code, type, options, validationId);
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
   * Valida arquitetura
   * 
   * @param {string} code - Código a validar
   * @param {string} type - Tipo de validação (clean-architecture, repository, usecase, separation)
   * @param {Object} options - Opções de validação
   * @param {string} validationId - ID da validação (opcional)
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateArchitecture(code, type, options = {}, validationId = null) {
    let result;

    switch (type) {
      case 'clean-architecture':
        result = await this.validateCleanArchitecture(code, options);
        break;
      case 'repository':
        result = await this.validateRepositoryPattern(code, options);
        break;
      case 'usecase':
        result = await this.validateUseCasePattern(code, options);
        break;
      case 'separation':
        result = await this.validateSeparationOfConcerns(code, options);
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
   * Valida Clean Architecture
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateCleanArchitecture(code, options) {
    const issues = [];

    // Verificar dependências entre camadas
    const layerViolations = this.checkLayerDependencies(code);
    if (layerViolations.length > 0) {
      issues.push(...layerViolations.map(v => ({
        type: 'layer_dependency_violation',
        severity: 'high',
        description: v.description,
        location: v.location
      })));
    }

    // Verificar se domain não depende de infrastructure
    if (/domain.*infrastructure|domain.*infra/i.test(code)) {
      issues.push({
        type: 'domain_dependency_violation',
        severity: 'high',
        description: 'Camada de domínio não deve depender de infraestrutura'
      });
    }

    // Verificar se use cases não dependem de controllers
    if (/usecase.*controller|usecase.*http/i.test(code)) {
      issues.push({
        type: 'usecase_dependency_violation',
        severity: 'high',
        description: 'Use cases não devem depender de controllers'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'clean-architecture'
    };
  }

  /**
   * Verifica violações de dependências entre camadas
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Violações encontradas
   */
  checkLayerDependencies(code) {
    const violations = [];

    // Domain não deve importar de application, infrastructure ou presentation
    const domainImports = code.match(/from\s+['"](?:application|infrastructure|presentation)/g);
    if (domainImports) {
      violations.push({
        description: 'Camada domain não deve importar de outras camadas',
        location: 'domain'
      });
    }

    // Application não deve importar de infrastructure ou presentation
    const applicationImports = code.match(/from\s+['"](?:infrastructure|presentation)/g);
    if (applicationImports) {
      violations.push({
        description: 'Camada application não deve importar de infrastructure ou presentation',
        location: 'application'
      });
    }

    return violations;
  }

  /**
   * Valida Repository Pattern
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateRepositoryPattern(code, options) {
    const issues = [];

    // Verificar se tem interface
    const hasInterface = /interface\s+\w+Repository|class\s+I\w+Repository/i.test(code);
    if (!hasInterface) {
      issues.push({
        type: 'missing_interface',
        severity: 'medium',
        description: 'Repository Pattern deve ter interface definida'
      });
    }

    // Verificar métodos básicos
    const requiredMethods = ['findById', 'findAll', 'save', 'delete'];
    for (const method of requiredMethods) {
      if (!new RegExp(`\\b${method}\\s*\\(`, 'i').test(code)) {
        issues.push({
          type: 'missing_method',
          severity: 'medium',
          description: `Repository deve ter método ${method}`
        });
      }
    }

    // Verificar se não tem lógica de negócio
    if (/if\s*\(.*business|if\s*\(.*rule/i.test(code)) {
      issues.push({
        type: 'business_logic_in_repository',
        severity: 'high',
        description: 'Repository não deve conter lógica de negócio'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'repository'
    };
  }

  /**
   * Valida Use Case Pattern
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateUseCasePattern(code, options) {
    const issues = [];

    // Verificar se tem método execute
    if (!/\bexecute\s*\(/i.test(code)) {
      issues.push({
        type: 'missing_execute',
        severity: 'high',
        description: 'Use Case deve ter método execute'
      });
    }

    // Verificar se recebe repository via construtor
    if (!/constructor\s*\([^)]*repository/i.test(code)) {
      issues.push({
        type: 'missing_repository',
        severity: 'high',
        description: 'Use Case deve receber repository via construtor'
      });
    }

    // Verificar se não depende de frameworks
    if (/express|fastify|koa|nestjs/i.test(code)) {
      issues.push({
        type: 'framework_dependency',
        severity: 'high',
        description: 'Use Case não deve depender de frameworks'
      });
    }

    // Verificar se tem validação de input
    if (!/validate|validation/i.test(code)) {
      issues.push({
        type: 'missing_validation',
        severity: 'medium',
        description: 'Use Case deve validar input'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'usecase'
    };
  }

  /**
   * Valida separação de responsabilidades
   * 
   * @param {string} code - Código a validar
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateSeparationOfConcerns(code, options) {
    const issues = [];

    // Verificar se classe tem muitas responsabilidades
    const methods = code.match(/\w+\s*\([^)]*\)\s*\{/g) || [];
    if (methods.length > 10) {
      issues.push({
        type: 'too_many_methods',
        severity: 'medium',
        description: `Classe tem ${methods.length} métodos, considere dividir responsabilidades`
      });
    }

    // Verificar se método faz muitas coisas
    const longMethods = code.match(/\w+\s*\([^)]*\)\s*\{[\s\S]{500,}\}/g);
    if (longMethods) {
      issues.push({
        type: 'long_method',
        severity: 'medium',
        description: 'Métodos muito longos violam separação de responsabilidades'
      });
    }

    // Verificar se classe viola Single Responsibility Principle
    const responsibilities = this.detectResponsibilities(code);
    if (responsibilities.length > 1) {
      issues.push({
        type: 'multiple_responsibilities',
        severity: 'high',
        description: `Classe tem múltiplas responsabilidades: ${responsibilities.join(', ')}`
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      type: 'separation'
    };
  }

  /**
   * Detecta responsabilidades na classe
   * 
   * @param {string} code - Código
   * @returns {Array<string>} Responsabilidades detectadas
   */
  detectResponsibilities(code) {
    const responsibilities = [];

    if (/database|db|query|sql/i.test(code)) {
      responsibilities.push('data_access');
    }
    if (/http|request|response|api/i.test(code)) {
      responsibilities.push('http_handling');
    }
    if (/validate|validation|check/i.test(code) && !/database|http/i.test(code)) {
      responsibilities.push('validation');
    }
    if (/business|rule|logic/i.test(code) && !/database|http/i.test(code)) {
      responsibilities.push('business_logic');
    }

    return responsibilities;
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
      validArchitectures: all.filter(v => v.valid).length,
      issuesByType: this.getIssuesByType(all)
    };
  }

  /**
   * Obtém issues agrupadas por tipo
   * 
   * @param {Array<Object>} validations - Validações
   * @returns {Object} Issues agrupadas
   */
  getIssuesByType(validations) {
    const byType = {};

    for (const validation of validations) {
      for (const issue of validation.issues || []) {
        if (!byType[issue.type]) {
          byType[issue.type] = 0;
        }
        byType[issue.type]++;
      }
    }

    return byType;
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

export default ArchitectureValidator;

/**
 * Factory function para criar ArchitectureValidator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {ArchitectureValidator} Instância do ArchitectureValidator
 */
export function createArchitectureValidator(config = null, logger = null, errorHandler = null) {
  return new ArchitectureValidator(config, logger, errorHandler);
}
