/**
 * KnowledgeBaseManager - Sistema de Gerenciamento de Knowledge Base
 * 
 * Gerencia Knowledge Base estruturada com busca, categorização e organização.
 * 
 * Funcionalidades:
 * - Busca na Knowledge Base (buscar por categoria, tags, padrões)
 * - Organização por Domínio (organizar conhecimento por domínio)
 * - Gestão de Exemplos (adicionar, atualizar, remover exemplos)
 * - Validação de Conhecimento (validar qualidade do conhecimento armazenado)
 * 
 * Métricas de Sucesso:
 * - 100% do conhecimento organizado por domínio
 * - 100% dos exemplos com metadados completos
 * - 100% das buscas retornando resultados relevantes
 */

import BaseSystem from '../../core/BaseSystem.js';

class KnowledgeBaseManager extends BaseSystem {
  async onInitialize() {
    this.knowledgeBase = new Map();
    this.categories = new Map();
    this.tags = new Map();
    this.logger?.info('KnowledgeBaseManager inicializado');
  }

  /**
   * Gerencia Knowledge Base
   * 
   * @param {Object} context - Contexto com action e parâmetros
   * @returns {Promise<Object>} Resultado da operação
   */
  async onExecute(context) {
    const { action, item, query, category, tags, itemId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'add') {
      if (!item) {
        throw new Error('item é obrigatório para add');
      }
      return await this.addKnowledgeItem(item);
    } else if (action === 'search') {
      if (!query && !category && !tags) {
        throw new Error('query, category ou tags são obrigatórios para search');
      }
      return await this.searchKnowledge(query, category, tags);
    } else if (action === 'get') {
      if (!itemId) {
        throw new Error('itemId é obrigatório para get');
      }
      return this.getKnowledgeItem(itemId);
    } else if (action === 'organize') {
      return await this.organizeByDomain();
    } else if (action === 'validate') {
      return await this.validateKnowledge();
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Adiciona item à Knowledge Base
   * 
   * @param {Object} item - Item de conhecimento
   * @returns {Promise<Object>} Item adicionado
   */
  async addKnowledgeItem(item) {
    const id = item.id || `kb-item-${Date.now()}`;

    // Validar item
    const validation = this.validateKnowledgeItem(item);
    if (!validation.valid) {
      throw new Error(`Item inválido: ${validation.errors.join(', ')}`);
    }

    // Adicionar metadados se não presentes
    if (!item.metadata) {
      item.metadata = this.generateMetadata(item);
    }

    // Categorizar se não categorizado
    if (!item.category) {
      item.category = this.inferCategory(item);
    }

    // Adicionar tags se não presentes
    if (!item.tags || item.tags.length === 0) {
      item.tags = this.inferTags(item);
    }

    const knowledgeItem = {
      id,
      ...item,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Armazenar
    this.knowledgeBase.set(id, knowledgeItem);

    // Atualizar índices
    this.updateCategoryIndex(id, knowledgeItem.category);
    this.updateTagIndex(id, knowledgeItem.tags);

    this.logger?.info('Item adicionado à Knowledge Base', { itemId: id });

    return knowledgeItem;
  }

  /**
   * Busca conhecimento
   * 
   * @param {string} query - Query de busca (opcional)
   * @param {string} category - Categoria (opcional)
   * @param {Array<string>} tags - Tags (opcional)
   * @returns {Promise<Object>} Resultados da busca
   */
  async searchKnowledge(query = null, category = null, tags = null) {
    let results = Array.from(this.knowledgeBase.values());

    // Filtrar por categoria
    if (category) {
      results = results.filter(item => item.category === category);
    }

    // Filtrar por tags
    if (tags && tags.length > 0) {
      results = results.filter(item => {
        if (!item.tags) return false;
        return tags.some(tag => item.tags.includes(tag));
      });
    }

    // Buscar por query
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(item => {
        // Buscar no nome
        if (item.name && item.name.toLowerCase().includes(queryLower)) {
          return true;
        }

        // Buscar na descrição
        if (item.description && item.description.toLowerCase().includes(queryLower)) {
          return true;
        }

        // Buscar no código
        if (item.code && item.code.toLowerCase().includes(queryLower)) {
          return true;
        }

        // Buscar em tags
        if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
          return true;
        }

        return false;
      });
    }

    return {
      query,
      category,
      tags,
      results,
      count: results.length
    };
  }

  /**
   * Obtém item de conhecimento
   * 
   * @param {string} itemId - ID do item
   * @returns {Object|null} Item ou null
   */
  getKnowledgeItem(itemId) {
    return this.knowledgeBase.get(itemId) || null;
  }

  /**
   * Organiza conhecimento por domínio
   * 
   * @returns {Promise<Object>} Organização por domínio
   */
  async organizeByDomain() {
    const domains = {
      architecture: [],
      security: [],
      database: [],
      mobile: [],
      integration: [],
      api: [],
      general: []
    };

    for (const item of this.knowledgeBase.values()) {
      const domain = item.category || 'general';
      if (domains[domain]) {
        domains[domain].push(item);
      } else {
        domains.general.push(item);
      }
    }

    return {
      domains,
      stats: {
        total: this.knowledgeBase.size,
        byDomain: Object.fromEntries(
          Object.entries(domains).map(([domain, items]) => [domain, items.length])
        )
      }
    };
  }

  /**
   * Valida conhecimento armazenado
   * 
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateKnowledge() {
    const issues = [];

    for (const [id, item] of this.knowledgeBase.entries()) {
      // Validar metadados obrigatórios
      if (!item.name && !item.title) {
        issues.push({
          itemId: id,
          type: 'missing_name',
          severity: 'high',
          description: 'Item não tem nome ou título'
        });
      }

      if (!item.category) {
        issues.push({
          itemId: id,
          type: 'missing_category',
          severity: 'medium',
          description: 'Item não tem categoria'
        });
      }

      if (!item.tags || item.tags.length === 0) {
        issues.push({
          itemId: id,
          type: 'missing_tags',
          severity: 'low',
          description: 'Item não tem tags'
        });
      }

      // Validar qualidade do conteúdo
      if (item.code && item.code.trim().length < 10) {
        issues.push({
          itemId: id,
          type: 'low_quality_code',
          severity: 'medium',
          description: 'Código do item é muito curto ou vazio'
        });
      }
    }

    const itemsWithIssuesSet = new Set(issues.map(i => i.itemId));

    return {
      valid: issues.length === 0,
      issues,
      totalItems: this.knowledgeBase.size,
      itemsWithIssues: itemsWithIssuesSet.size
    };
  }

  /**
   * Valida item de conhecimento
   * 
   * @param {Object} item - Item
   * @returns {Object} Resultado da validação
   */
  validateKnowledgeItem(item) {
    const errors = [];

    if (!item.name && !item.title) {
      errors.push('Item deve ter name ou title');
    }

    if (!item.content && !item.code && !item.description) {
      errors.push('Item deve ter content, code ou description');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gera metadados para item
   * 
   * @param {Object} item - Item
   * @returns {Object} Metadados
   */
  generateMetadata(item) {
    return {
      createdAt: new Date().toISOString(),
      language: item.language || 'unknown',
      source: item.source || 'manual'
    };
  }

  /**
   * Infere categoria do item
   * 
   * @param {Object} item - Item
   * @returns {string} Categoria inferida
   */
  inferCategory(item) {
    // Inferir por nome
    if (item.name) {
      const nameLower = item.name.toLowerCase();
      if (nameLower.includes('repository') || nameLower.includes('usecase')) {
        return 'architecture';
      }
      if (nameLower.includes('oauth') || nameLower.includes('encrypt')) {
        return 'security';
      }
      if (nameLower.includes('expo') || nameLower.includes('react-native')) {
        return 'mobile';
      }
    }

    // Inferir por conteúdo
    if (item.code || item.content) {
      const content = (item.code || item.content || '').toLowerCase();
      if (/oauth|jwt|encrypt|security/i.test(content)) {
        return 'security';
      }
      if (/repository|usecase|domain/i.test(content)) {
        return 'architecture';
      }
      if (/expo|react-native|watermelon/i.test(content)) {
        return 'mobile';
      }
    }

    return 'general';
  }

  /**
   * Infere tags do item
   * 
   * @param {Object} item - Item
   * @returns {Array<string>} Tags inferidas
   */
  inferTags(item) {
    const tags = [];

    if (item.category) {
      tags.push(item.category);
    }

    if (item.language) {
      tags.push(item.language);
    }

    if (item.name) {
      const nameLower = item.name.toLowerCase();
      if (nameLower.includes('repository')) tags.push('repository-pattern');
      if (nameLower.includes('usecase')) tags.push('usecase-pattern');
      if (nameLower.includes('handler')) tags.push('handler');
      if (nameLower.includes('service')) tags.push('service');
    }

    return [...new Set(tags)];
  }

  /**
   * Atualiza índice de categoria
   * 
   * @param {string} itemId - ID do item
   * @param {string} category - Categoria
   */
  updateCategoryIndex(itemId, category) {
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set());
    }
    this.categories.get(category).add(itemId);
  }

  /**
   * Atualiza índice de tags
   * 
   * @param {string} itemId - ID do item
   * @param {Array<string>} tags - Tags
   */
  updateTagIndex(itemId, tags) {
    for (const tag of tags) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag).add(itemId);
    }
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const validation = this.validateKnowledge();
    
    return {
      totalItems: this.knowledgeBase.size,
      categories: this.categories.size,
      tags: this.tags.size,
      itemsWithIssues: validation.itemsWithIssues || 0
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

export default KnowledgeBaseManager;

/**
 * Factory function para criar KnowledgeBaseManager
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {KnowledgeBaseManager} Instância do KnowledgeBaseManager
 */
export function createKnowledgeBaseManager(config = null, logger = null, errorHandler = null) {
  return new KnowledgeBaseManager(config, logger, errorHandler);
}
