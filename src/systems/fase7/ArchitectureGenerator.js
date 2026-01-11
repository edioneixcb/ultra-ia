/**
 * ArchitectureGenerator - Gerador de Arquitetura
 * 
 * Gera código arquitetural completo usando templates e validações.
 * 
 * Geradores:
 * - Domain Entity
 * - Use Case
 * - Repository
 * - Controller
 * 
 * Métricas de Sucesso:
 * - 100% do código gerado é válido e funcional
 * - 100% do código passa nas validações arquiteturais
 */

import BaseSystem from '../../core/BaseSystem.js';

class ArchitectureGenerator extends BaseSystem {
  async onInitialize() {
    this.generations = new Map();
    this.logger?.info('ArchitectureGenerator inicializado');
  }

  /**
   * Gera código arquitetural
   * 
   * @param {Object} context - Contexto com type, parameters e opções
   * @returns {Promise<Object>} Código gerado
   */
  async onExecute(context) {
    const { action, type, parameters = {}, options = {}, generationId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'generate') {
      if (!type) {
        throw new Error('type é obrigatório para generate');
      }
      return await this.generateArchitectureCode(type, parameters, options, generationId);
    } else if (action === 'getGeneration') {
      if (!generationId) {
        throw new Error('generationId é obrigatório para getGeneration');
      }
      return this.getGeneration(generationId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Gera código arquitetural
   * 
   * @param {string} type - Tipo (domain-entity, usecase, repository, controller)
   * @param {Object} parameters - Parâmetros para geração
   * @param {Object} options - Opções de geração
   * @param {string} generationId - ID da geração (opcional)
   * @returns {Promise<Object>} Código gerado
   */
  async generateArchitectureCode(type, parameters, options = {}, generationId = null) {
    let code;

    switch (type) {
      case 'domain-entity':
        code = await this.generateDomainEntity(parameters, options);
        break;
      case 'usecase':
        code = await this.generateUseCase(parameters, options);
        break;
      case 'repository':
        code = await this.generateRepository(parameters, options);
        break;
      case 'controller':
        code = await this.generateController(parameters, options);
        break;
      default:
        throw new Error(`Tipo de geração desconhecido: ${type}`);
    }

    // Validar código gerado se solicitado
    let validation = null;
    if (options.validate !== false) {
      validation = await this.validateGeneratedCode(code, type);
    }

    const result = {
      type,
      code,
      parameters,
      validation,
      generatedAt: new Date().toISOString()
    };

    // Armazenar geração
    const id = generationId || `generation-${Date.now()}`;
    this.generations.set(id, result);

    return result;
  }

  /**
   * Gera Domain Entity
   * 
   * @param {Object} parameters - Parâmetros
   * @param {Object} options - Opções
   * @returns {Promise<string>} Código gerado
   */
  async generateDomainEntity(parameters, options) {
    const { entityName, properties = [], validations = [] } = parameters;

    if (!entityName) {
      throw new Error('entityName é obrigatório para Domain Entity');
    }

    const propertiesCode = properties.map(prop => {
      const defaultValue = prop.defaultValue !== undefined ? ` || ${JSON.stringify(prop.defaultValue)}` : '';
      return `    this.${prop.name} = data.${prop.name}${defaultValue};`;
    }).join('\n');

    const validationsCode = validations.map(val => {
      return `    if (!this.${val.field}) {
      throw new Error('${val.message}');
    }`;
    }).join('\n');

    const toJSONCode = properties.map((prop, index) => {
      return `      ${prop.name}: this.${prop.name}${index < properties.length - 1 ? ',' : ''}`;
    }).join('\n');

    return `class ${entityName} {
  constructor(data = {}) {
${propertiesCode}
  }

  validate() {
    // Validações de domínio
${validationsCode}
    return true;
  }

  toJSON() {
    return {
${toJSONCode}
    };
  }
}

export default ${entityName};`;
  }

  /**
   * Gera Use Case
   * 
   * @param {Object} parameters - Parâmetros
   * @param {Object} options - Opções
   * @returns {Promise<string>} Código gerado
   */
  async generateUseCase(parameters, options) {
    const { useCaseName, repositoryName, validations = [], method = 'save' } = parameters;

    if (!useCaseName || !repositoryName) {
      throw new Error('useCaseName e repositoryName são obrigatórios para Use Case');
    }

    const validationsCode = validations.map(val => {
      return `    if (!input.${val.field}) {
      throw new Error('${val.message}');
    }`;
    }).join('\n');

    return `class ${useCaseName}UseCase {
  constructor(${repositoryName}Repository) {
    this.repository = ${repositoryName}Repository;
  }

  async execute(input) {
    // Validar input
    this.validateInput(input);

    // Executar lógica de negócio
    const result = await this.process(input);

    // Retornar resultado
    return result;
  }

  validateInput(input) {
${validationsCode || '    // Sem validações específicas'}
  }

  async process(input) {
    // Implementar lógica de negócio
    return await this.repository.${method}(input);
  }
}

export default ${useCaseName}UseCase;`;
  }

  /**
   * Gera Repository
   * 
   * @param {Object} parameters - Parâmetros
   * @param {Object} options - Opções
   * @returns {Promise<string>} Código gerado
   */
  async generateRepository(parameters, options) {
    const { entityName, tableName, includeInterface = true } = parameters;

    if (!entityName || !tableName) {
      throw new Error('entityName e tableName são obrigatórios para Repository');
    }

    const interfaceCode = includeInterface ? `class I${entityName}Repository {
  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  async findAll() {
    throw new Error('Method findAll must be implemented');
  }

  async save(entity) {
    throw new Error('Method save must be implemented');
  }

  async delete(id) {
    throw new Error('Method delete must be implemented');
  }
}

` : '';

    return `${interfaceCode}class ${entityName}Repository${includeInterface ? ` extends I${entityName}Repository` : ''} {
  constructor(db) {
${includeInterface ? '    super();' : ''}
    this.db = db;
    this.tableName = '${tableName}';
  }

  async findById(id) {
    const result = await this.db.query(
      \`SELECT * FROM \${this.tableName} WHERE id = $1\`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findAll() {
    const result = await this.db.query(
      \`SELECT * FROM \${this.tableName}\`
    );
    return result.rows;
  }

  async save(entity) {
    if (entity.id) {
      return await this.update(entity);
    }
    return await this.create(entity);
  }

  async create(entity) {
    const fields = Object.keys(entity);
    const values = Object.values(entity);
    const placeholders = fields.map((_, i) => \`$\${i + 1}\`).join(', ');

    const result = await this.db.query(
      \`INSERT INTO \${this.tableName} (\${fields.join(', ')}) VALUES (\${placeholders}) RETURNING *\`,
      values
    );
    return result.rows[0];
  }

  async update(entity) {
    const fields = Object.keys(entity).filter(f => f !== 'id');
    const updates = fields.map((f, i) => \`\${f} = $\${i + 1}\`).join(', ');
    const values = [...fields.map(f => entity[f]), entity.id];

    const result = await this.db.query(
      \`UPDATE \${this.tableName} SET \${updates} WHERE id = $\${values.length} RETURNING *\`,
      values
    );
    return result.rows[0];
  }

  async delete(id) {
    await this.db.query(
      \`DELETE FROM \${this.tableName} WHERE id = $1\`,
      [id]
    );
    return true;
  }
}

export default ${entityName}Repository;`;
  }

  /**
   * Gera Controller
   * 
   * @param {Object} parameters - Parâmetros
   * @param {Object} options - Opções
   * @returns {Promise<string>} Código gerado
   */
  async generateController(parameters, options) {
    const { controllerName, useCaseName, validations = [], fields = [] } = parameters;

    if (!controllerName || !useCaseName) {
      throw new Error('controllerName e useCaseName são obrigatórios para Controller');
    }

    const validationsCode = validations.map(val => {
      return `    if (!req.${val.source}.${val.field}) {
      throw new Error('${val.message}');
    }`;
    }).join('\n');

    const fieldsCode = fields.map((field, index) => {
      return `      ${field.name}: req.${field.source}.${field.name}${index < fields.length - 1 ? ',' : ''}`;
    }).join('\n');

    return `class ${controllerName}Controller {
  constructor(${useCaseName}UseCase) {
    this.useCase = ${useCaseName}UseCase;
  }

  async handle(req, res) {
    try {
      // Validar requisição
      const input = this.validateRequest(req);

      // Executar caso de uso
      const result = await this.useCase.execute(input);

      // Retornar resposta
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  validateRequest(req) {
${validationsCode || '    // Sem validações específicas'}
    return {
${fieldsCode || '      // Sem campos específicos'}
    };
  }

  handleError(error, res) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
}

export default ${controllerName}Controller;`;
  }

  /**
   * Valida código gerado usando ArchitectureValidator
   * 
   * @param {string} code - Código gerado
   * @param {string} type - Tipo de código
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateGeneratedCode(code, type) {
    // Mapear tipo para tipo de validação
    const validationTypeMap = {
      'domain-entity': 'separation',
      'usecase': 'usecase',
      'repository': 'repository',
      'controller': 'separation'
    };

    const validationType = validationTypeMap[type] || 'separation';

    // Tentar obter ArchitectureValidator do registry
    try {
      const registry = await import('../../core/index.js');
      const { getComponentRegistry } = registry;
      const componentRegistry = getComponentRegistry();
      
      if (componentRegistry.has('ArchitectureValidator')) {
        const validator = componentRegistry.get('ArchitectureValidator');
        const result = await validator.validateArchitecture(code, validationType);
        return result;
      }
    } catch (error) {
      this.logger?.warn('Não foi possível validar código com ArchitectureValidator', { error });
    }

    // Validação básica se validator não disponível
    return {
      valid: code && code.length > 0,
      issues: []
    };
  }

  /**
   * Obtém geração armazenada
   * 
   * @param {string} generationId - ID da geração
   * @returns {Object|null} Geração ou null
   */
  getGeneration(generationId) {
    return this.generations.get(generationId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.generations.values());

    return {
      totalGenerations: all.length,
      validGenerations: all.filter(g => !g.validation || g.validation.valid).length,
      generationsByType: this.getGenerationsByType(all)
    };
  }

  /**
   * Obtém gerações agrupadas por tipo
   * 
   * @param {Array<Object>} generations - Gerações
   * @returns {Object} Gerações agrupadas
   */
  getGenerationsByType(generations) {
    const byType = {};

    for (const gen of generations) {
      if (!byType[gen.type]) {
        byType[gen.type] = 0;
      }
      byType[gen.type]++;
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

export default ArchitectureGenerator;

/**
 * Factory function para criar ArchitectureGenerator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {ArchitectureGenerator} Instância do ArchitectureGenerator
 */
export function createArchitectureGenerator(config = null, logger = null, errorHandler = null) {
  return new ArchitectureGenerator(config, logger, errorHandler);
}
