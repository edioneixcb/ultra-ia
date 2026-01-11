/**
 * ArchitectureTemplateManager - Gerenciador de Templates de Arquitetura
 * 
 * Gerencia templates específicos para padrões arquiteturais.
 * 
 * Templates disponíveis:
 * - Domain Entity
 * - Use Case
 * - Repository Interface
 * - Repository Implementation
 * - Controller
 * - Application Service
 * 
 * Métricas de Sucesso:
 * - 100% dos templates de arquitetura disponíveis
 * - 100% dos templates são válidos e funcionais
 */

import BaseSystem from '../../core/BaseSystem.js';

class ArchitectureTemplateManager extends BaseSystem {
  async onInitialize() {
    this.templates = new Map();
    this.initializeTemplates();
    this.logger?.info('ArchitectureTemplateManager inicializado');
  }

  /**
   * Inicializa templates de arquitetura
   */
  initializeTemplates() {
    // Template: Domain Entity
    this.templates.set('domain-entity', {
      id: 'domain-entity',
      name: 'Domain Entity',
      category: 'architecture',
      code: `class {{EntityName}} {
  constructor(data) {
    {{#each properties}}
    this.{{name}} = data.{{name}} || {{defaultValue}};
    {{/each}}
  }

  validate() {
    // Validações de domínio
    {{#each validations}}
    if (!this.{{field}}) {
      throw new Error('{{message}}');
    }
    {{/each}}
    return true;
  }

  toJSON() {
    return {
      {{#each properties}}
      {{name}}: this.{{name}}{{#unless @last}},{{/unless}}
      {{/each}}
    };
  }
}`,
      description: 'Template para entidade de domínio seguindo DDD',
      parameters: ['EntityName', 'properties', 'validations']
    });

    // Template: Use Case
    this.templates.set('usecase', {
      id: 'usecase',
      name: 'Use Case',
      category: 'architecture',
      code: `class {{UseCaseName}}UseCase {
  constructor({{repositoryName}}Repository) {
    this.repository = {{repositoryName}}Repository;
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
    {{#each validations}}
    if (!input.{{field}}) {
      throw new Error('{{message}}');
    }
    {{/each}}
  }

  async process(input) {
    // Implementar lógica de negócio
    return await this.repository.{{method}}(input);
  }
}`,
      description: 'Template para caso de uso seguindo Clean Architecture',
      parameters: ['UseCaseName', 'repositoryName', 'validations', 'method']
    });

    // Template: Repository Interface
    this.templates.set('repository-interface', {
      id: 'repository-interface',
      name: 'Repository Interface',
      category: 'architecture',
      code: `class I{{EntityName}}Repository {
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

  async findBy(filters) {
    throw new Error('Method findBy must be implemented');
  }
}`,
      description: 'Template para interface de repositório',
      parameters: ['EntityName']
    });

    // Template: Repository Implementation
    this.templates.set('repository-implementation', {
      id: 'repository-implementation',
      name: 'Repository Implementation',
      category: 'architecture',
      code: `class {{EntityName}}Repository extends I{{EntityName}}Repository {
  constructor(db) {
    super();
    this.db = db;
    this.tableName = '{{tableName}}';
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

  async findBy(filters) {
    const conditions = Object.keys(filters).map((key, i) => \`\${key} = $\${i + 1}\`).join(' AND ');
    const values = Object.values(filters);

    const result = await this.db.query(
      \`SELECT * FROM \${this.tableName} WHERE \${conditions}\`,
      values
    );
    return result.rows;
  }
}`,
      description: 'Template para implementação de repositório',
      parameters: ['EntityName', 'tableName']
    });

    // Template: Controller
    this.templates.set('controller', {
      id: 'controller',
      name: 'Controller',
      category: 'architecture',
      code: `class {{ControllerName}}Controller {
  constructor({{useCaseName}}UseCase) {
    this.useCase = {{useCaseName}}UseCase;
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
    {{#each validations}}
    if (!req.{{source}}.{{field}}) {
      throw new Error('{{message}}');
    }
    {{/each}}
    return {
      {{#each fields}}
      {{name}}: req.{{source}}.{{name}}{{#unless @last}},{{/unless}}
      {{/each}}
    };
  }

  handleError(error, res) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
}`,
      description: 'Template para controller seguindo Clean Architecture',
      parameters: ['ControllerName', 'useCaseName', 'validations', 'fields']
    });

    // Template: Application Service
    this.templates.set('application-service', {
      id: 'application-service',
      name: 'Application Service',
      category: 'architecture',
      code: `class {{ServiceName}}Service {
  constructor({{#each dependencies}}
    {{name}}Repository{{#unless @last}},{{/unless}}
  {{/each}}) {
    {{#each dependencies}}
    this.{{name}}Repository = {{name}}Repository;
    {{/each}}
  }

  async {{methodName}}(input) {
    // Validar input
    this.validateInput(input);

    // Executar lógica de aplicação
    const result = await this.executeLogic(input);

    // Retornar resultado
    return result;
  }

  validateInput(input) {
    {{#each validations}}
    if (!input.{{field}}) {
      throw new Error('{{message}}');
    }
    {{/each}}
  }

  async executeLogic(input) {
    // Implementar lógica de aplicação
    {{#each steps}}
    // {{description}}
    {{code}}
    {{/each}}
    return result;
  }
}`,
      description: 'Template para serviço de aplicação',
      parameters: ['ServiceName', 'dependencies', 'methodName', 'validations', 'steps']
    });
  }

  /**
   * Gera código a partir de template
   * 
   * @param {Object} context - Contexto com templateId e parameters
   * @returns {Promise<Object>} Código gerado
   */
  async onExecute(context) {
    const { action, templateId, parameters = {} } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'generate') {
      if (!templateId) {
        throw new Error('templateId é obrigatório para generate');
      }
      return await this.generateFromTemplate(templateId, parameters);
    } else if (action === 'getTemplate') {
      if (!templateId) {
        throw new Error('templateId é obrigatório para getTemplate');
      }
      return this.getTemplate(templateId);
    } else if (action === 'listTemplates') {
      return this.listTemplates();
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Gera código a partir de template
   * 
   * @param {string} templateId - ID do template
   * @param {Object} parameters - Parâmetros
   * @returns {Promise<Object>} Código gerado
   */
  async generateFromTemplate(templateId, parameters) {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template não encontrado: ${templateId}`);
    }

    // Substituir placeholders simples
    let code = template.code;
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      code = code.replace(placeholder, value);
    }

    // Validação básica
    const validation = this.validateGeneratedCode(code);

    return {
      templateId,
      code,
      parameters,
      validation,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Obtém template
   * 
   * @param {string} templateId - ID do template
   * @returns {Object|null} Template ou null
   */
  getTemplate(templateId) {
    return this.templates.get(templateId) || null;
  }

  /**
   * Lista todos os templates
   * 
   * @returns {Array<Object>} Lista de templates
   */
  listTemplates() {
    return Array.from(this.templates.values()).map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      description: t.description
    }));
  }

  /**
   * Valida código gerado
   * 
   * @param {string} code - Código gerado
   * @returns {Object} Resultado da validação
   */
  validateGeneratedCode(code) {
    const issues = [];

    if (!code || code.trim().length === 0) {
      issues.push({
        type: 'empty_code',
        severity: 'high',
        description: 'Código gerado está vazio'
      });
    }

    if (code && !code.includes('class') && !code.includes('function')) {
      issues.push({
        type: 'invalid_structure',
        severity: 'medium',
        description: 'Código não tem estrutura válida'
      });
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      totalTemplates: this.templates.size,
      templates: Array.from(this.templates.keys())
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

export default ArchitectureTemplateManager;

/**
 * Factory function para criar ArchitectureTemplateManager
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {ArchitectureTemplateManager} Instância do ArchitectureTemplateManager
 */
export function createArchitectureTemplateManager(config = null, logger = null, errorHandler = null) {
  return new ArchitectureTemplateManager(config, logger, errorHandler);
}
