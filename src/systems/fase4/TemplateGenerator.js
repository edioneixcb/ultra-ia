/**
 * TemplateGenerator - Sistema de Geração de Templates
 * 
 * Gera templates específicos para padrões identificados.
 * 
 * Funcionalidades:
 * - Geração de Templates por Padrão (gerar templates baseados em padrões)
 * - Templates por Domínio (templates específicos por domínio)
 * - Customização de Templates (personalizar templates com parâmetros)
 * - Validação de Templates (validar que templates gerados estão corretos)
 * 
 * Métricas de Sucesso:
 * - 100% dos padrões têm templates correspondentes
 * - 100% dos templates são válidos e funcionais
 * - 100% dos templates são customizáveis
 */

import BaseSystem from '../../core/BaseSystem.js';

class TemplateGenerator extends BaseSystem {
  async onInitialize() {
    this.templates = new Map();
    this.generations = new Map();
    this.logger?.info('TemplateGenerator inicializado');
  }

  /**
   * Gera template ou busca templates
   * 
   * @param {Object} context - Contexto com action e parâmetros
   * @returns {Promise<Object>} Resultado da operação
   */
  async onExecute(context) {
    const { action, templateType, pattern, domain, parameters, templateId, searchQuery } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'generate') {
      if (!templateType && !pattern && !domain) {
        throw new Error('templateType, pattern ou domain são obrigatórios para generate');
      }
      return await this.generateTemplate(templateType, pattern, domain, parameters);
    } else if (action === 'getTemplate') {
      if (!templateId) {
        throw new Error('templateId é obrigatório para getTemplate');
      }
      return this.getTemplate(templateId);
    } else if (action === 'search') {
      return await this.searchTemplates(searchQuery, domain);
    } else if (action === 'validate') {
      if (!templateId) {
        throw new Error('templateId é obrigatório para validate');
      }
      return await this.validateTemplate(templateId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Gera template
   * 
   * @param {string} templateType - Tipo de template (opcional)
   * @param {string} pattern - Padrão (opcional)
   * @param {string} domain - Domínio (opcional)
   * @param {Object} parameters - Parâmetros para customização
   * @returns {Promise<Object>} Template gerado
   */
  async generateTemplate(templateType = null, pattern = null, domain = null, parameters = {}) {
    // Determinar tipo de template
    const type = templateType || this.inferTemplateType(pattern, domain);

    // Obter template base
    let template = this.getBaseTemplate(type, domain);

    if (!template) {
      // Gerar template baseado em tipo ou padrão conhecido
      template = await this.generateFromPattern(pattern || type, domain, parameters);
    }

    // Customizar template com parâmetros
    const customizedTemplate = await this.customizeTemplate(template, parameters);

    // Validar template gerado
    const validation = await this.validateGeneratedTemplate(customizedTemplate);

    const result = {
      template: customizedTemplate,
      type,
      pattern,
      domain,
      parameters,
      validation,
      generatedAt: new Date().toISOString()
    };

    // Armazenar geração
    const id = `generation-${Date.now()}`;
    this.generations.set(id, result);

    return result;
  }

  /**
   * Infere tipo de template
   * 
   * @param {string} pattern - Padrão
   * @param {string} domain - Domínio
   * @returns {string} Tipo inferido
   */
  inferTemplateType(pattern, domain) {
    if (pattern) {
      const patternLower = pattern.toLowerCase();
      if (patternLower.includes('repository')) return 'repository';
      if (patternLower.includes('usecase')) return 'usecase';
      if (patternLower.includes('handler')) return 'handler';
      if (patternLower.includes('service')) return 'service';
    }

    if (domain) {
      return domain;
    }

    return 'generic';
  }

  /**
   * Obtém template base
   * 
   * @param {string} type - Tipo de template
   * @param {string} domain - Domínio
   * @returns {Object|null} Template base ou null
   */
  getBaseTemplate(type, domain) {
    const templateId = `${domain || 'general'}-${type}`;
    return this.templates.get(templateId) || null;
  }

  /**
   * Gera template a partir de padrão
   * 
   * @param {string} pattern - Padrão
   * @param {string} domain - Domínio
   * @param {Object} parameters - Parâmetros
   * @returns {Promise<Object>} Template gerado
   */
  async generateFromPattern(pattern, domain, parameters) {
    const patternLower = (pattern || '').toLowerCase();

    // Template para Repository Pattern ou tipo 'repository'
    if (patternLower.includes('repository') || patternLower === 'repository') {
      return {
        type: 'repository',
        domain: domain || 'architecture',
        code: this.generateRepositoryTemplate(parameters),
        description: 'Template para implementação do padrão Repository'
      };
    }

    // Template para Use Case Pattern ou tipo 'usecase'
    if (patternLower.includes('usecase') || patternLower === 'usecase') {
      return {
        type: 'usecase',
        domain: domain || 'architecture',
        code: this.generateUseCaseTemplate(parameters),
        description: 'Template para implementação do padrão Use Case'
      };
    }

    // Template genérico
    return {
      type: 'generic',
      domain: domain || 'general',
      code: this.generateGenericTemplate(parameters),
      description: 'Template genérico'
    };
  }

  /**
   * Gera template de Repository
   * 
   * @param {Object} parameters - Parâmetros
   * @returns {string} Código do template
   */
  generateRepositoryTemplate(parameters) {
    const entityName = parameters.entityName || 'Entity';
    const repositoryName = `${entityName}Repository`;

    return `class ${repositoryName} {
  constructor(db) {
    this.db = db;
  }

  async findById(id) {
    // Implementar busca por ID
  }

  async findAll() {
    // Implementar busca de todos
  }

  async save(entity) {
    // Implementar salvamento
  }

  async delete(id) {
    // Implementar deleção
  }
}`;
  }

  /**
   * Gera template de Use Case
   * 
   * @param {Object} parameters - Parâmetros
   * @returns {string} Código do template
   */
  generateUseCaseTemplate(parameters) {
    const useCaseName = parameters.useCaseName || 'UseCase';
    const action = parameters.action || 'Execute';

    return `class ${useCaseName} {
  constructor(repository) {
    this.repository = repository;
  }

  async ${action.toLowerCase()}(input) {
    // Validar input
    // Executar lógica de negócio
    // Retornar resultado
  }
}`;
  }

  /**
   * Gera template genérico
   * 
   * @param {Object} parameters - Parâmetros
   * @returns {string} Código do template
   */
  generateGenericTemplate(parameters) {
    const className = parameters.className || 'GeneratedClass';

    return `class ${className} {
  constructor() {
    // Inicialização
  }

  // Implementar métodos necessários
}`;
  }

  /**
   * Customiza template com parâmetros
   * 
   * @param {Object} template - Template base
   * @param {Object} parameters - Parâmetros
   * @returns {Promise<Object>} Template customizado
   */
  async customizeTemplate(template, parameters) {
    let customizedCode = template.code || '';

    // Substituir placeholders
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      customizedCode = customizedCode.replace(placeholder, value);
    }

    return {
      ...template,
      code: customizedCode,
      parameters
    };
  }

  /**
   * Valida template gerado
   * 
   * @param {Object} template - Template
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateGeneratedTemplate(template) {
    const issues = [];

    if (!template.code || template.code.trim().length === 0) {
      issues.push({
        type: 'empty_template',
        severity: 'high',
        description: 'Template gerado está vazio'
      });
    }

    // Verificar sintaxe básica (simplificado)
    if (template.code && !template.code.includes('class') && !template.code.includes('function')) {
      issues.push({
        type: 'invalid_structure',
        severity: 'medium',
        description: 'Template não tem estrutura válida (classe ou função)'
      });
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Obtém template armazenado
   * 
   * @param {string} templateId - ID do template
   * @returns {Object|null} Template ou null
   */
  getTemplate(templateId) {
    return this.templates.get(templateId) || null;
  }

  /**
   * Busca templates
   * 
   * @param {string} searchQuery - Query de busca (opcional)
   * @param {string} domain - Domínio (opcional)
   * @returns {Promise<Object>} Resultados da busca
   */
  async searchTemplates(searchQuery = null, domain = null) {
    let results = Array.from(this.templates.values());

    // Filtrar por domínio
    if (domain) {
      results = results.filter(t => t.domain === domain);
    }

    // Buscar por query
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      results = results.filter(t => {
        if (t.type && t.type.toLowerCase().includes(queryLower)) return true;
        if (t.description && t.description.toLowerCase().includes(queryLower)) return true;
        return false;
      });
    }

    return {
      query: searchQuery,
      domain,
      results,
      count: results.length
    };
  }

  /**
   * Valida template
   * 
   * @param {string} templateId - ID do template
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateTemplate(templateId) {
    const template = this.templates.get(templateId);

    if (!template) {
      return {
        valid: false,
        error: 'Template não encontrado'
      };
    }

    return await this.validateGeneratedTemplate(template);
  }

  /**
   * Registra template
   * 
   * @param {string} templateId - ID do template
   * @param {Object} template - Template
   */
  registerTemplate(templateId, template) {
    this.templates.set(templateId, template);
    this.logger?.info('Template registrado', { templateId });
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      totalTemplates: this.templates.size,
      totalGenerations: this.generations.size,
      templatesByDomain: this.getTemplatesByDomain()
    };
  }

  /**
   * Obtém templates por domínio
   * 
   * @returns {Object} Templates agrupados por domínio
   */
  getTemplatesByDomain() {
    const byDomain = {};

    for (const template of this.templates.values()) {
      const domain = template.domain || 'general';
      if (!byDomain[domain]) {
        byDomain[domain] = [];
      }
      byDomain[domain].push(template);
    }

    return byDomain;
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

export default TemplateGenerator;

/**
 * Factory function para criar TemplateGenerator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {TemplateGenerator} Instância do TemplateGenerator
 */
export function createTemplateGenerator(config = null, logger = null, errorHandler = null) {
  return new TemplateGenerator(config, logger, errorHandler);
}
