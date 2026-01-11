/**
 * DatabaseGenerator - Gerador de Banco de Dados
 * 
 * Gera código SQL completo.
 * 
 * Geradores:
 * - Migration
 * - RLS Policy
 * - Query Otimizada
 */

import BaseSystem from '../../core/BaseSystem.js';

class DatabaseGenerator extends BaseSystem {
  async onInitialize() {
    this.generations = new Map();
    this.logger?.info('DatabaseGenerator inicializado');
  }

  async onExecute(context) {
    const { action, type, parameters = {}, options = {}, generationId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'generate') {
      if (!type) {
        throw new Error('type é obrigatório para generate');
      }
      return await this.generateDatabaseCode(type, parameters, options, generationId);
    } else if (action === 'getGeneration') {
      if (!generationId) {
        throw new Error('generationId é obrigatório para getGeneration');
      }
      return this.getGeneration(generationId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  async generateDatabaseCode(type, parameters, options = {}, generationId = null) {
    let code;

    switch (type) {
      case 'migration':
        code = await this.generateMigration(parameters, options);
        break;
      case 'rls-policy':
        code = await this.generateRLSPolicy(parameters, options);
        break;
      case 'query-optimized':
        code = await this.generateOptimizedQuery(parameters, options);
        break;
      default:
        throw new Error(`Tipo de geração desconhecido: ${type}`);
    }

    let validation = { valid: code && code.length > 0, issues: [] };
    const result = { type, code, parameters, validation, generatedAt: new Date().toISOString() };
    const id = generationId || `generation-${Date.now()}`;
    this.generations.set(id, result);

    return result;
  }

  async generateMigration(parameters, options) {
    const { migrationName, tableName, columns = [] } = parameters;

    if (!migrationName || !tableName) {
      throw new Error('migrationName e tableName são obrigatórios para Migration');
    }

    const columnsCode = columns.map(col => {
      let colDef = `  ${col.name} ${col.type}`;
      if (col.notNull) colDef += ' NOT NULL';
      if (col.unique) colDef += ' UNIQUE';
      return colDef;
    }).join(',\n');

    return `-- Migration: ${migrationName}
-- Created: ${new Date().toISOString()}

BEGIN;

CREATE TABLE IF NOT EXISTS ${tableName} (
${columnsCode},
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_${tableName}_updated_at
  BEFORE UPDATE ON ${tableName}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;`;
  }

  async generateRLSPolicy(parameters, options) {
    const { tableName, policyName = `${tableName}_policy`, operation = 'SELECT', using = "user_id = current_setting('app.current_user_id')::integer" } = parameters;

    if (!tableName) {
      throw new Error('tableName é obrigatório para RLS Policy');
    }

    return `-- Row Level Security Policy para ${tableName}
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "${policyName}" ON ${tableName}
  FOR ${operation}
  USING (${using});`;
  }

  async generateOptimizedQuery(parameters, options) {
    const { queryPurpose, mainTable, selectFields = [], whereConditions = [] } = parameters;

    const selectCode = selectFields.length > 0 
      ? selectFields.map(f => `${f.table}.${f.field}`).join(', ')
      : '*';

    const whereCode = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    return `-- Query otimizada para ${queryPurpose}
-- Índices recomendados:
-- CREATE INDEX idx_${mainTable}_id ON ${mainTable}(id);

EXPLAIN ANALYZE
SELECT ${selectCode}
FROM ${mainTable}
${whereCode};`;
  }

  getGeneration(generationId) {
    return this.generations.get(generationId) || null;
  }

  getStats() {
    const all = Array.from(this.generations.values());
    return {
      totalGenerations: all.length,
      validGenerations: all.filter(g => !g.validation || g.validation.valid).length
    };
  }

  onValidate(context) {
    if (!context || typeof context !== 'object') {
      return { valid: false, errors: ['Context deve ser um objeto'] };
    }
    if (!context.action || typeof context.action !== 'string') {
      return { valid: false, errors: ['action é obrigatório e deve ser string'] };
    }
    return { valid: true };
  }

  onGetDependencies() {
    return ['logger', 'config'];
  }
}

export default DatabaseGenerator;

export function createDatabaseGenerator(config = null, logger = null, errorHandler = null) {
  return new DatabaseGenerator(config, logger, errorHandler);
}
