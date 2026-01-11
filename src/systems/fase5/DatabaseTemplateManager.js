/**
 * DatabaseTemplateManager - Gerenciador de Templates de Banco de Dados
 * 
 * Gerencia templates específicos para banco de dados.
 * 
 * Templates disponíveis:
 * - Migration
 * - RLS Policy
 * - Query Otimizada
 * - Index
 * 
 * Métricas de Sucesso:
 * - 100% dos templates de banco de dados disponíveis
 * - 100% dos templates são válidos e funcionais
 */

import BaseSystem from '../../core/BaseSystem.js';

class DatabaseTemplateManager extends BaseSystem {
  async onInitialize() {
    this.templates = new Map();
    this.initializeTemplates();
    this.logger?.info('DatabaseTemplateManager inicializado');
  }

  /**
   * Inicializa templates de banco de dados
   */
  initializeTemplates() {
    // Template: Migration
    this.templates.set('migration', {
      id: 'migration',
      name: 'Migration',
      category: 'database',
      code: `-- Migration: {{migrationName}}
-- Created: {{timestamp}}

BEGIN;

-- Criar tabela
CREATE TABLE IF NOT EXISTS {{tableName}} (
  id SERIAL PRIMARY KEY,
  {{#each columns}}
  {{name}} {{type}}{{#if notNull}} NOT NULL{{/if}}{{#if unique}} UNIQUE{{/if}}{{#unless @last}},{{/unless}}
  {{/each}}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
{{#each indexes}}
CREATE INDEX IF NOT EXISTS idx_{{tableName}}_{{column}} ON {{tableName}}({{column}});
{{/each}}

-- Criar triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_{{tableName}}_updated_at
  BEFORE UPDATE ON {{tableName}}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;`,
      description: 'Template para migration do banco de dados',
      parameters: ['migrationName', 'timestamp', 'tableName', 'columns', 'name', 'type', 'notNull', 'unique', 'indexes', 'column']
    });

    // Template: RLS Policy
    this.templates.set('rls-policy', {
      id: 'rls-policy',
      name: 'RLS Policy',
      category: 'database',
      code: `-- Row Level Security Policy para {{tableName}}
-- Habilitar RLS na tabela
ALTER TABLE {{tableName}} ENABLE ROW LEVEL SECURITY;

-- Policy: {{policyDescription}}
CREATE POLICY "{{policyName}}" ON {{tableName}}
  FOR {{operation}}
  {{#if using}}
  USING ({{using}})
  {{/if}}
  {{#if withCheck}}
  WITH CHECK ({{withCheck}})
  {{/if}};`,
      description: 'Template para política RLS',
      parameters: ['tableName', 'policyDescription', 'policyName', 'operation', 'using', 'withCheck']
    });

    // Template: Query Otimizada
    this.templates.set('optimized-query', {
      id: 'optimized-query',
      name: 'Optimized Query',
      category: 'database',
      code: `-- Query otimizada para {{queryPurpose}}
-- Índices recomendados:
{{#each recommendedIndexes}}
-- CREATE INDEX idx_{{table}}_{{column}} ON {{table}}({{column}});
{{/each}}

EXPLAIN ANALYZE
SELECT 
  {{#each selectFields}}
  {{table}}.{{field}}{{#unless @last}},{{/unless}}
  {{/each}}
FROM {{mainTable}}
{{#each joins}}
{{type}} JOIN {{table}} ON {{condition}}
{{/each}}
WHERE 
  {{#each whereConditions}}
  {{condition}}{{#unless @last}} AND{{/unless}}
  {{/each}}
{{#if groupBy}}
GROUP BY {{groupBy}}
{{/if}}
{{#if orderBy}}
ORDER BY {{orderBy}}
{{/if}}
{{#if limit}}
LIMIT {{limit}}
{{/if}};`,
      description: 'Template para query otimizada',
      parameters: ['queryPurpose', 'recommendedIndexes', 'table', 'column', 'selectFields', 'field', 'mainTable', 'joins', 'type', 'condition', 'whereConditions', 'groupBy', 'orderBy', 'limit']
    });

    // Template: Index
    this.templates.set('index', {
      id: 'index',
      name: 'Index',
      category: 'database',
      code: `-- Índice: {{indexName}}
-- Tabela: {{tableName}}
-- Colunas: {{columns}}

{{#if unique}}
CREATE UNIQUE INDEX IF NOT EXISTS {{indexName}}
ON {{tableName}} ({{columns}});
{{else}}
CREATE INDEX IF NOT EXISTS {{indexName}}
ON {{tableName}} ({{columns}})
{{#if where}}
WHERE {{where}}
{{/if}}
{{#if include}}
INCLUDE ({{include}})
{{/if}};
{{/if}}

-- Análise do índice
ANALYZE {{tableName}};`,
      description: 'Template para criação de índice',
      parameters: ['indexName', 'tableName', 'columns', 'unique', 'where', 'include']
    });
  }

  /**
   * Gera código a partir de template
   * 
   * @param {Object} context - Contexto com action e templateId
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

    // Substituir placeholders
    let code = template.code;
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      code = code.replace(placeholder, value);
    }

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

export default DatabaseTemplateManager;

/**
 * Factory function para criar DatabaseTemplateManager
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {DatabaseTemplateManager} Instância do DatabaseTemplateManager
 */
export function createDatabaseTemplateManager(config = null, logger = null, errorHandler = null) {
  return new DatabaseTemplateManager(config, logger, errorHandler);
}
