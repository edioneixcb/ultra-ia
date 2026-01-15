/**
 * Runtime Config Validator
 * 
 * Valida configuração em tempo de execução antes de operações críticas.
 * Garante que a configuração está íntegra e válida.
 */

import { getLogger } from './Logger.js';

class RuntimeConfigValidator {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    
    // Cache de validações
    this.validationCache = new Map();
    this.lastFullValidation = null;
  }

  /**
   * Valida configuração completa
   * @returns {object} { valid, errors, warnings }
   */
  validateFull() {
    const errors = [];
    const warnings = [];

    // Validar seções críticas
    this.validatePaths(errors, warnings);
    this.validateServices(errors, warnings);
    this.validateTimeouts(errors, warnings);
    this.validateDatabase(errors, warnings);
    this.validateApi(errors, warnings);
    this.validateSecurity(errors, warnings);

    const result = {
      valid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date().toISOString()
    };

    this.lastFullValidation = result;
    return result;
  }

  /**
   * Valida paths de configuração
   */
  validatePaths(errors, warnings) {
    const paths = this.config?.paths;
    
    if (!paths) {
      warnings.push('Seção paths não encontrada, usando valores padrão');
      return;
    }

    // Verificar paths críticos
    const requiredPaths = ['knowledgeBase', 'context', 'logs'];
    for (const pathKey of requiredPaths) {
      if (!paths[pathKey]) {
        warnings.push(`Path '${pathKey}' não definido`);
      }
    }
  }

  /**
   * Valida serviços externos
   */
  validateServices(errors, warnings) {
    const services = this.config?.services;
    
    if (!services) {
      warnings.push('Seção services não encontrada');
      return;
    }

    // Validar Ollama
    if (services.ollama) {
      if (!services.ollama.url) {
        errors.push('Ollama URL não definida');
      }
      if (!services.ollama.defaultModel) {
        warnings.push('Modelo padrão do Ollama não definido');
      }
    }

    // Validar Docker
    if (services.docker?.enabled && !services.docker.timeout) {
      warnings.push('Docker timeout não definido');
    }
  }

  /**
   * Valida timeouts
   */
  validateTimeouts(errors, warnings) {
    const timeouts = this.config?.timeouts;
    
    if (!timeouts) {
      warnings.push('Seção timeouts não encontrada, usando valores padrão');
      return;
    }

    // Validar valores razoáveis
    if (timeouts.default && timeouts.default < 1000) {
      warnings.push('Timeout padrão muito baixo (< 1s)');
    }

    if (timeouts.ollama && timeouts.ollama < 5000) {
      warnings.push('Timeout do Ollama muito baixo (< 5s)');
    }
  }

  /**
   * Valida configuração de banco de dados
   */
  validateDatabase(errors, warnings) {
    const database = this.config?.database;
    
    if (!database) {
      return; // Opcional
    }

    if (database.maxConnections && database.maxConnections < 1) {
      errors.push('maxConnections deve ser >= 1');
    }

    if (database.maxConnections && database.maxConnections > 100) {
      warnings.push('maxConnections muito alto (> 100), pode causar problemas');
    }
  }

  /**
   * Valida configuração de API
   */
  validateApi(errors, warnings) {
    const api = this.config?.api;
    
    if (!api) {
      return; // Opcional
    }

    // Validar rate limiting
    if (api.rateLimit) {
      if (api.rateLimit.max && api.rateLimit.max < 1) {
        errors.push('rateLimit.max deve ser >= 1');
      }
    }

    // Validar validação
    if (api.validation) {
      if (api.validation.maxPromptSize && api.validation.maxPromptSize < 100) {
        warnings.push('maxPromptSize muito baixo (< 100)');
      }
    }
  }

  /**
   * Valida configuração de segurança
   */
  validateSecurity(errors, warnings) {
    const auth = this.config?.api?.auth;
    
    if (auth?.enabled && !auth?.apiKey) {
      errors.push('Autenticação habilitada mas apiKey não definida');
    }

    // Verificar se está em produção sem auth
    if (this.config?.environment === 'production' && (!auth || !auth.enabled)) {
      warnings.push('Ambiente de produção sem autenticação habilitada');
    }
  }

  /**
   * Valida seção específica antes de operação
   * @param {string} section - Nome da seção (paths, services, etc)
   * @returns {object} { valid, errors }
   */
  validateSection(section) {
    const errors = [];
    const warnings = [];

    switch (section) {
      case 'paths':
        this.validatePaths(errors, warnings);
        break;
      case 'services':
        this.validateServices(errors, warnings);
        break;
      case 'timeouts':
        this.validateTimeouts(errors, warnings);
        break;
      case 'database':
        this.validateDatabase(errors, warnings);
        break;
      case 'api':
        this.validateApi(errors, warnings);
        break;
      case 'security':
        this.validateSecurity(errors, warnings);
        break;
      default:
        warnings.push(`Seção desconhecida: ${section}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida antes de operação crítica
   * @param {string} operation - Nome da operação
   * @param {string[]} requiredSections - Seções necessárias
   * @returns {object} { valid, errors }
   */
  validateBeforeOperation(operation, requiredSections = []) {
    const cacheKey = `${operation}:${requiredSections.join(',')}`;
    
    // Verificar cache (válido por 5 minutos)
    const cached = this.validationCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 300000) {
      return cached.result;
    }

    const allErrors = [];
    const allWarnings = [];

    for (const section of requiredSections) {
      const result = this.validateSection(section);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    const result = {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      operation
    };

    // Cachear resultado
    this.validationCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    if (!result.valid) {
      this.logger?.error(`Validação falhou para operação: ${operation}`, {
        errors: allErrors,
        warnings: allWarnings
      });
    }

    return result;
  }

  /**
   * Obtém resultado da última validação completa
   */
  getLastValidation() {
    return this.lastFullValidation;
  }

  /**
   * Limpa cache de validações
   */
  clearCache() {
    this.validationCache.clear();
  }
}

// Singleton instance
let instance = null;
let initializationPromise = null;

/**
 * Obtém instância singleton do RuntimeConfigValidator
 */
export function getRuntimeConfigValidator(config = null, logger = null) {
  if (instance) {
    return instance;
  }

  if (!initializationPromise) {
    instance = new RuntimeConfigValidator(config, logger);
  }
  
  return instance;
}

/**
 * Cria nova instância do RuntimeConfigValidator
 */
export function createRuntimeConfigValidator(config = null, logger = null) {
  return new RuntimeConfigValidator(config, logger);
}

export default RuntimeConfigValidator;
