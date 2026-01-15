/**
 * Multi-Project Manager
 * 
 * Gerencia isolamento de projetos para Knowledge Base e Context Manager:
 * - Namespace por projeto
 * - Isolamento completo de dados
 * - Gerenciamento de ciclo de vida de projetos
 */

import { getLogger } from './Logger.js';
import { getDatabaseManager } from './DatabaseManager.js';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

class MultiProjectManager {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.dbManager = getDatabaseManager(config, logger);
    
    // Diretório base para projetos
    this.baseDir = config?.paths?.projects || './data/projects';
    
    // Criar diretório base se não existir
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
    
    // Cache de projetos carregados
    this.projects = new Map();
    
    // Inicializar banco de dados de projetos
    this.initializeProjectsDB();
  }

  /**
   * Inicializa banco de dados de metadados de projetos
   */
  initializeProjectsDB() {
    const dbPath = join(this.baseDir, 'projects-meta.db');
    this.db = this.dbManager.getConnection(dbPath, 'projects-manager');
    
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        settings TEXT,
        stats TEXT
      )
    `);
    
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name)
    `);
  }

  /**
   * Cria novo projeto
   * @param {string} projectId - ID único do projeto
   * @param {object} options - Opções { name, description, settings }
   * @returns {object} Projeto criado
   */
  createProject(projectId, options = {}) {
    const { name = projectId, description = '', settings = {} } = options;
    
    // Verificar se projeto já existe
    if (this.projectExists(projectId)) {
      throw new Error(`Projeto '${projectId}' já existe`);
    }

    // Criar diretório do projeto
    const projectDir = this.getProjectDir(projectId);
    mkdirSync(projectDir, { recursive: true });
    mkdirSync(join(projectDir, 'knowledge-base'), { recursive: true });
    mkdirSync(join(projectDir, 'context'), { recursive: true });

    const now = new Date().toISOString();
    const project = {
      id: projectId,
      name,
      description,
      created_at: now,
      updated_at: now,
      settings: JSON.stringify(settings),
      stats: JSON.stringify({ functions: 0, classes: 0, sessions: 0 })
    };

    // Salvar no banco de dados
    this.db.prepare(`
      INSERT INTO projects (id, name, description, created_at, updated_at, settings, stats)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      project.id, 
      project.name, 
      project.description, 
      project.created_at, 
      project.updated_at, 
      project.settings, 
      project.stats
    );

    this.logger?.info('Projeto criado', { projectId, name });

    return {
      id: projectId,
      name,
      description,
      createdAt: now,
      settings,
      paths: {
        base: projectDir,
        knowledgeBase: join(projectDir, 'knowledge-base'),
        context: join(projectDir, 'context')
      }
    };
  }

  /**
   * Obtém projeto por ID
   * @param {string} projectId - ID do projeto
   * @returns {object|null} Projeto ou null
   */
  getProject(projectId) {
    const row = this.db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).get(projectId);

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      settings: JSON.parse(row.settings || '{}'),
      stats: JSON.parse(row.stats || '{}'),
      paths: {
        base: this.getProjectDir(projectId),
        knowledgeBase: join(this.getProjectDir(projectId), 'knowledge-base'),
        context: join(this.getProjectDir(projectId), 'context')
      }
    };
  }

  /**
   * Verifica se projeto existe
   */
  projectExists(projectId) {
    const row = this.db.prepare(`
      SELECT id FROM projects WHERE id = ?
    `).get(projectId);
    return !!row;
  }

  /**
   * Lista todos os projetos
   * @returns {Array} Lista de projetos
   */
  listProjects() {
    const rows = this.db.prepare(`
      SELECT id, name, description, created_at, updated_at, stats
      FROM projects
      ORDER BY updated_at DESC
    `).all();

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      stats: JSON.parse(row.stats || '{}')
    }));
  }

  /**
   * Atualiza metadados do projeto
   * @param {string} projectId - ID do projeto
   * @param {object} updates - Atualizações { name, description, settings }
   */
  updateProject(projectId, updates) {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error(`Projeto '${projectId}' não encontrado`);
    }

    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.settings !== undefined) {
      fields.push('settings = ?');
      values.push(JSON.stringify(updates.settings));
    }
    if (updates.stats !== undefined) {
      fields.push('stats = ?');
      values.push(JSON.stringify(updates.stats));
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(projectId);

    this.db.prepare(`
      UPDATE projects SET ${fields.join(', ')} WHERE id = ?
    `).run(...values);

    this.logger?.info('Projeto atualizado', { projectId });
  }

  /**
   * Remove projeto
   * @param {string} projectId - ID do projeto
   * @param {boolean} deleteData - Se deve deletar dados físicos
   */
  deleteProject(projectId, deleteData = false) {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error(`Projeto '${projectId}' não encontrado`);
    }

    // Fechar conexões do projeto
    this.dbManager.closeConnection(`kb-${projectId}`);
    this.dbManager.closeConnection(`ctx-${projectId}`);

    // Remover do banco de dados
    this.db.prepare(`DELETE FROM projects WHERE id = ?`).run(projectId);

    // Remover dados físicos se solicitado
    if (deleteData) {
      const projectDir = this.getProjectDir(projectId);
      if (existsSync(projectDir)) {
        rmSync(projectDir, { recursive: true, force: true });
      }
    }

    this.projects.delete(projectId);
    this.logger?.info('Projeto removido', { projectId, deleteData });
  }

  /**
   * Obtém diretório do projeto
   */
  getProjectDir(projectId) {
    return join(this.baseDir, projectId);
  }

  /**
   * Obtém paths do projeto para Knowledge Base e Context
   */
  getProjectPaths(projectId) {
    const projectDir = this.getProjectDir(projectId);
    return {
      knowledgeBase: join(projectDir, 'knowledge-base', 'knowledge-base.db'),
      context: join(projectDir, 'context', 'context.db')
    };
  }

  /**
   * Garante que projeto existe ou cria
   */
  ensureProject(projectId, options = {}) {
    if (!this.projectExists(projectId)) {
      return this.createProject(projectId, options);
    }
    return this.getProject(projectId);
  }

  /**
   * Obtém estatísticas agregadas de todos os projetos
   */
  getGlobalStats() {
    const projects = this.listProjects();
    
    return {
      totalProjects: projects.length,
      totalFunctions: projects.reduce((sum, p) => sum + (p.stats?.functions || 0), 0),
      totalClasses: projects.reduce((sum, p) => sum + (p.stats?.classes || 0), 0),
      totalSessions: projects.reduce((sum, p) => sum + (p.stats?.sessions || 0), 0)
    };
  }

  /**
   * Fecha conexões do gerenciador
   */
  close() {
    this.dbManager.closeConnection('projects-manager');
    this.logger?.info('MultiProjectManager fechado');
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do MultiProjectManager
 */
export function getMultiProjectManager(config = null, logger = null) {
  if (!instance) {
    instance = new MultiProjectManager(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do MultiProjectManager
 */
export function createMultiProjectManager(config = null, logger = null) {
  return new MultiProjectManager(config, logger);
}

export default MultiProjectManager;
