/**
 * ConfigSchema - Sistema de Configuração Extensível e Type-Safe
 * 
 * Permite definição de schemas de configuração, validação type-safe e merge de defaults.
 * 
 * Funcionalidades:
 * - Definição de schemas para sistemas
 * - Validação type-safe de configurações
 * - Merge inteligente de defaults
 * - Suporte a tipos complexos (object, array, union, etc.)
 * - Validação de valores (min, max, enum, pattern)
 * 
 * Princípios Arquiteturais:
 * - Single Responsibility: Responsável apenas por validação e merge de configuração
 * - Open/Closed: Aberto para extensão (novos tipos), fechado para modificação
 * - Type Safety: Garante tipos corretos em tempo de execução
 * 
 * @module ConfigSchema
 */

/**
 * Schema de configuração para um campo
 * @typedef {Object} FieldSchema
 * @property {string} type - Tipo do campo ('string', 'number', 'boolean', 'object', 'array')
 * @property {boolean} [required] - Se o campo é obrigatório
 * @property {*} [default] - Valor padrão
 * @property {Object} [properties] - Propriedades para tipo 'object'
 * @property {FieldSchema} [items] - Schema para itens de array
 * @property {number} [min] - Valor mínimo (para number)
 * @property {number} [max] - Valor máximo (para number)
 * @property {string[]} [enum] - Valores permitidos
 * @property {RegExp|string} [pattern] - Padrão regex (para string)
 * @property {Function} [validator] - Função de validação customizada
 */

/**
 * Resultado de validação
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Se a validação passou
 * @property {string[]} errors - Array de mensagens de erro
 * @property {string[]} [warnings] - Array de mensagens de aviso
 */

/**
 * ConfigSchema - Gerenciador de schemas e validação de configuração
 */
class ConfigSchema {
  /**
   * Cria uma nova instância do ConfigSchema
   * 
   * @param {Object} [options={}] - Opções de configuração
   * @param {Object} [options.logger] - Logger para registro de eventos
   * @param {Object} [options.errorHandler] - Error handler para tratamento de erros
   */
  constructor(options = {}) {
    const { logger = null, errorHandler = null } = options;
    
    this.logger = logger;
    this.errorHandler = errorHandler;
    
    // Map de schemas: nome do sistema -> schema
    this.schemas = new Map();
    
    // Map de defaults: nome do sistema -> defaults
    this.defaults = new Map();
    
    this.logger?.info('ConfigSchema inicializado');
  }

  /**
   * Define schema de configuração para um sistema
   * 
   * @param {string} name - Nome do sistema
   * @param {FieldSchema} schema - Schema de configuração
   * @param {Object} [defaults={}] - Valores padrão
   * @throws {Error} Se schema já está definido
   * @throws {Error} Se schema é inválido
   * 
   * @example
   * configSchema.defineSystem('database', {
   *   type: 'object',
   *   properties: {
   *     host: { type: 'string', required: true },
   *     port: { type: 'number', min: 1, max: 65535, default: 5432 }
   *   }
   * }, { port: 5432 });
   */
  defineSystem(name, schema, defaults = {}) {
    // Validação de entrada
    this.validateSchemaInput(name, schema, defaults);

    // Verificar se já está definido
    if (this.schemas.has(name)) {
      const error = new Error(`Schema para '${name}' já está definido`);
      this.errorHandler?.handleError(error, {
        component: 'ConfigSchema',
        operation: 'defineSystem',
        systemName: name
      });
      throw error;
    }

    // Validar schema
    this.validateSchemaStructure(schema, name);

    // Registrar schema primeiro (temporariamente) para validar defaults
    this.schemas.set(name, schema);
    this.defaults.set(name, {}); // Placeholder

    // Validar defaults contra schema (sem exigir campos obrigatórios)
    if (Object.keys(defaults).length > 0) {
      const errors = [];
      const warnings = [];
      // Validar defaults sem exigir campos obrigatórios
      this.validateValue(defaults, schema, '', errors, warnings, true);
      
      if (errors.length > 0) {
        // Remover schema temporário se validação falhar
        this.schemas.delete(name);
        this.defaults.delete(name);
        
        const error = new Error(
          `Defaults inválidos para '${name}': ${errors.join(', ')}`
        );
        this.errorHandler?.handleError(error, {
          component: 'ConfigSchema',
          operation: 'defineSystem',
          systemName: name,
          errors
        });
        throw error;
      }
    }

    // Registrar defaults finais
    this.defaults.set(name, defaults);

    this.logger?.info(`Schema definido para sistema: ${name}`, {
      hasDefaults: Object.keys(defaults).length > 0
    });
  }

  /**
   * Valida configuração contra schema
   * 
   * @param {Object} config - Configuração a validar
   * @param {string} systemName - Nome do sistema
   * @returns {ValidationResult} Resultado da validação
   * @throws {Error} Se schema não está definido
   * 
   * @example
   * const result = configSchema.validate({ host: 'localhost', port: 5432 }, 'database');
   * if (!result.valid) {
   *   console.error('Erros:', result.errors);
   * }
   */
  validate(config, systemName) {
    // Validação de entrada
    if (typeof systemName !== 'string' || systemName.trim() === '') {
      throw new Error('Nome do sistema deve ser uma string não vazia');
    }

    const schema = this.schemas.get(systemName);
    if (!schema) {
      const error = new Error(`Schema para '${systemName}' não encontrado`);
      this.errorHandler?.handleError(error, {
        component: 'ConfigSchema',
        operation: 'validate',
        systemName: systemName,
        availableSchemas: Array.from(this.schemas.keys())
      });
      throw error;
    }

    const errors = [];
    const warnings = [];

    // Validar recursivamente
    this.validateValue(config, schema, '', errors, warnings, false);

    const result = {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };

    if (!result.valid) {
      this.logger?.warn(`Validação falhou para '${systemName}'`, {
        errors: result.errors
      });
    }

    return result;
  }

  /**
   * Mescla configuração com defaults
   * 
   * @param {Object} config - Configuração fornecida
   * @param {string} systemName - Nome do sistema
   * @returns {Object} Configuração mesclada (defaults + config)
   * @throws {Error} Se schema não está definido
   * 
   * @example
   * const merged = configSchema.mergeDefaults({ host: 'localhost' }, 'database');
   * // { host: 'localhost', port: 5432 } (port vem do default)
   */
  mergeDefaults(config, systemName) {
    if (!this.schemas.has(systemName)) {
      throw new Error(`Schema para '${systemName}' não encontrado`);
    }

    const defaults = this.defaults.get(systemName) || {};
    
    // Merge profundo (deep merge) para objetos aninhados
    return this.deepMerge(defaults, config || {});
  }

  /**
   * Obtém schema de um sistema
   * 
   * @param {string} systemName - Nome do sistema
   * @returns {FieldSchema|undefined} Schema do sistema ou undefined se não encontrado
   */
  getSchema(systemName) {
    return this.schemas.get(systemName);
  }

  /**
   * Obtém defaults de um sistema
   * 
   * @param {string} systemName - Nome do sistema
   * @returns {Object} Defaults do sistema ou objeto vazio se não encontrado
   */
  getDefaults(systemName) {
    return this.defaults.get(systemName) || {};
  }

  /**
   * Verifica se schema está definido
   * 
   * @param {string} systemName - Nome do sistema
   * @returns {boolean} True se está definido, false caso contrário
   */
  hasSchema(systemName) {
    return this.schemas.has(systemName);
  }

  /**
   * Retorna todos os sistemas com schema definido
   * 
   * @returns {string[]} Array de nomes de sistemas
   */
  getAllSystems() {
    return Array.from(this.schemas.keys());
  }

  // ========== Métodos Privados ==========

  /**
   * Valida valor recursivamente contra schema
   * 
   * @param {*} value - Valor a validar
   * @param {FieldSchema} schema - Schema a validar contra
   * @param {string} path - Caminho do campo (para mensagens de erro)
   * @param {string[]} errors - Array de erros (modificado in-place)
   * @param {string[]} warnings - Array de avisos (modificado in-place)
   * @param {boolean} [skipRequired=false] - Se true, não valida campos obrigatórios (para defaults)
   * @private
   */
  validateValue(value, schema, path, errors, warnings, skipRequired = false) {
    const fieldPath = path || 'root';

    // Validar tipo
    const typeValidation = this.validateType(value, schema, fieldPath);
    if (!typeValidation.valid) {
      errors.push(...typeValidation.errors);
      return; // Parar validação se tipo está errado
    }

    // Validar valor específico do tipo
    if (schema.type === 'object') {
      this.validateObject(value, schema, fieldPath, errors, warnings, skipRequired);
    } else if (schema.type === 'array') {
      this.validateArray(value, schema, fieldPath, errors, warnings);
    } else {
      // Validar constraints específicos do tipo
      this.validateConstraints(value, schema, fieldPath, errors, warnings);
    }
  }

  /**
   * Valida tipo do valor
   * 
   * @param {*} value - Valor a validar
   * @param {FieldSchema} schema - Schema
   * @param {string} path - Caminho do campo
   * @returns {{valid: boolean, errors: string[]}} Resultado da validação de tipo
   * @private
   */
  validateType(value, schema, path) {
    const errors = [];
    const expectedType = schema.type;
    const actualType = this.getActualType(value);

    if (actualType !== expectedType) {
      errors.push(`${path}: tipo esperado '${expectedType}', recebido '${actualType}'`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtém tipo real do valor
   * 
   * @param {*} value - Valor
   * @returns {string} Tipo do valor
   * @private
   */
  getActualType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  /**
   * Valida objeto
   * 
   * @param {Object} value - Objeto a validar
   * @param {FieldSchema} schema - Schema do objeto
   * @param {string} path - Caminho do campo
   * @param {string[]} errors - Array de erros
   * @param {string[]} warnings - Array de avisos
   * @param {boolean} [skipRequired=false] - Se true, não valida campos obrigatórios (para defaults)
   * @private
   */
  validateObject(value, schema, path, errors, warnings, skipRequired = false) {
    const properties = schema.properties || {};

    // Validar propriedades obrigatórias
    for (const [key, subSchema] of Object.entries(properties)) {
      const subPath = path ? `${path}.${key}` : key;
      
      if (key in value) {
        this.validateValue(value[key], subSchema, subPath, errors, warnings, skipRequired);
      } else if (subSchema.required && !skipRequired) {
        errors.push(`${subPath}: campo obrigatório faltando`);
      }
    }

    // Avisar sobre propriedades desconhecidas (se schema tem strict: true)
    if (schema.strict) {
      const knownKeys = Object.keys(properties);
      const providedKeys = Object.keys(value);
      const unknownKeys = providedKeys.filter(k => !knownKeys.includes(k));
      if (unknownKeys.length > 0) {
        warnings.push(`${path}: propriedades desconhecidas: ${unknownKeys.join(', ')}`);
      }
    }
  }

  /**
   * Valida array
   * 
   * @param {Array} value - Array a validar
   * @param {FieldSchema} schema - Schema do array
   * @param {string} path - Caminho do campo
   * @param {string[]} errors - Array de erros
   * @param {string[]} warnings - Array de avisos
   * @private
   */
  validateArray(value, schema, path, errors, warnings) {
    if (!schema.items) {
      return; // Sem schema de itens, apenas validar que é array
    }

    // Validar tamanho mínimo/máximo
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path}: array deve ter pelo menos ${schema.minItems} item(s), tem ${value.length}`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${path}: array deve ter no máximo ${schema.maxItems} item(s), tem ${value.length}`);
    }

      // Validar cada item
      value.forEach((item, index) => {
        this.validateValue(item, schema.items, `${path}[${index}]`, errors, warnings, false);
      });
  }

  /**
   * Valida constraints específicos do tipo
   * 
   * @param {*} value - Valor a validar
   * @param {FieldSchema} schema - Schema
   * @param {string} path - Caminho do campo
   * @param {string[]} errors - Array de erros
   * @param {string[]} warnings - Array de avisos
   * @private
   */
  validateConstraints(value, schema, path, errors, warnings) {
    // Validação para number
    if (schema.type === 'number') {
      if (schema.min !== undefined && value < schema.min) {
        errors.push(`${path}: valor ${value} é menor que mínimo ${schema.min}`);
      }
      if (schema.max !== undefined && value > schema.max) {
        errors.push(`${path}: valor ${value} é maior que máximo ${schema.max}`);
      }
    }

    // Validação para string
    if (schema.type === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push(`${path}: string deve ter pelo menos ${schema.minLength} caractere(s)`);
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push(`${path}: string deve ter no máximo ${schema.maxLength} caractere(s)`);
      }
      if (schema.pattern) {
        const regex = typeof schema.pattern === 'string' ? new RegExp(schema.pattern) : schema.pattern;
        if (!regex.test(value)) {
          errors.push(`${path}: string não corresponde ao padrão esperado`);
        }
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`${path}: valor '${value}' não está em enum permitido: ${schema.enum.join(', ')}`);
      }
    }

    // Validação customizada
    if (schema.validator && typeof schema.validator === 'function') {
      try {
        const customResult = schema.validator(value);
        if (customResult !== true && typeof customResult === 'string') {
          errors.push(`${path}: ${customResult}`);
        } else if (customResult !== true) {
          errors.push(`${path}: validação customizada falhou`);
        }
      } catch (error) {
        errors.push(`${path}: erro na validação customizada: ${error.message}`);
      }
    }
  }

  /**
   * Valida entrada para defineSystem
   * 
   * @param {string} name - Nome do sistema
   * @param {FieldSchema} schema - Schema
   * @param {Object} defaults - Defaults
   * @private
   */
  validateSchemaInput(name, schema, defaults) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error('Nome do sistema deve ser uma string não vazia');
    }

    if (!schema || typeof schema !== 'object') {
      throw new Error('Schema deve ser um objeto');
    }

    if (!schema.type) {
      throw new Error('Schema deve ter propriedade "type"');
    }

    if (defaults !== null && typeof defaults !== 'object') {
      throw new Error('Defaults deve ser um objeto ou null');
    }
  }

  /**
   * Valida estrutura do schema
   * 
   * @param {FieldSchema} schema - Schema a validar
   * @param {string} systemName - Nome do sistema (para mensagens de erro)
   * @private
   */
  validateSchemaStructure(schema, systemName) {
    const validTypes = ['string', 'number', 'boolean', 'object', 'array'];
    
    if (!validTypes.includes(schema.type)) {
      throw new Error(
        `Tipo inválido '${schema.type}' no schema de '${systemName}'. ` +
        `Tipos válidos: ${validTypes.join(', ')}`
      );
    }

    // Validar estrutura específica do tipo
    if (schema.type === 'object' && !schema.properties) {
      // Objeto sem properties é válido (permite qualquer objeto)
    }

    if (schema.type === 'array' && !schema.items) {
      // Array sem items é válido (permite qualquer array)
    }
  }

  /**
   * Faz merge profundo de objetos
   * 
   * @param {Object} target - Objeto alvo (defaults)
   * @param {Object} source - Objeto fonte (config)
   * @returns {Object} Objeto mesclado
   * @private
   */
  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          typeof target[key] === 'object' &&
          target[key] !== null &&
          !Array.isArray(target[key])
        ) {
          // Merge profundo para objetos aninhados
          result[key] = this.deepMerge(target[key], source[key]);
        } else {
          // Sobrescrever para valores primitivos e arrays
          result[key] = source[key];
        }
      }
    }

    return result;
  }
}

/**
 * Singleton global do ConfigSchema (opcional)
 * @type {ConfigSchema|null}
 */
let globalConfigSchema = null;

/**
 * Obtém ou cria instância global do ConfigSchema
 * 
 * @param {Object} [options={}] - Opções de configuração
 * @returns {ConfigSchema} Instância do ConfigSchema
 */
export function getConfigSchema(options = {}) {
  if (!globalConfigSchema) {
    globalConfigSchema = new ConfigSchema(options);
  }
  return globalConfigSchema;
}

/**
 * Cria uma nova instância do ConfigSchema
 * 
 * @param {Object} [options={}] - Opções de configuração
 * @returns {ConfigSchema} Nova instância do ConfigSchema
 */
export function createConfigSchema(options = {}) {
  return new ConfigSchema(options);
}

export default ConfigSchema;
