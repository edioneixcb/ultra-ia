/**
 * PatternDocumentationSystem - Sistema de Documentação de Padrões e Práticas
 * 
 * Documenta padrões arquiteturais, práticas e anti-padrões.
 * 
 * Funcionalidades:
 * - Documentação de Padrões Arquiteturais (Clean Architecture, Repository, Use Case)
 * - Documentação de Práticas (boas práticas por domínio)
 * - Documentação de Anti-Padrões (padrões a evitar)
 * - Exemplos e Templates (exemplos de uso de cada padrão)
 * 
 * Métricas de Sucesso:
 * - 100% dos padrões documentados com exemplos
 * - 100% das práticas categorizadas por domínio
 * - 100% dos anti-padrões documentados com alternativas
 */

import BaseSystem from '../../core/BaseSystem.js';

class PatternDocumentationSystem extends BaseSystem {
  async onInitialize() {
    this.patterns = new Map();
    this.practices = new Map();
    this.antiPatterns = new Map();
    this.logger?.info('PatternDocumentationSystem inicializado');
  }

  /**
   * Documenta padrão ou busca documentação
   * 
   * @param {Object} context - Contexto com action e parâmetros
   * @returns {Promise<Object>} Resultado da operação
   */
  async onExecute(context) {
    const { action, pattern, practice, antiPattern, patternId, category, searchQuery } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'documentPattern') {
      if (!pattern) {
        throw new Error('pattern é obrigatório para documentPattern');
      }
      return await this.documentPattern(pattern);
    } else if (action === 'documentPractice') {
      if (!practice) {
        throw new Error('practice é obrigatório para documentPractice');
      }
      return await this.documentPractice(practice);
    } else if (action === 'documentAntiPattern') {
      if (!antiPattern) {
        throw new Error('antiPattern é obrigatório para documentAntiPattern');
      }
      return await this.documentAntiPattern(antiPattern);
    } else if (action === 'getPattern') {
      if (!patternId) {
        throw new Error('patternId é obrigatório para getPattern');
      }
      return this.getPattern(patternId);
    } else if (action === 'search') {
      return await this.searchPatterns(searchQuery, category);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Documenta padrão arquitetural
   * 
   * @param {Object} pattern - Padrão a documentar
   * @returns {Promise<Object>} Padrão documentado
   */
  async documentPattern(pattern) {
    const id = pattern.id || `pattern-${Date.now()}`;

    const documentedPattern = {
      id,
      name: pattern.name,
      type: pattern.type || 'architecture',
      category: pattern.category || this.inferCategory(pattern),
      description: pattern.description || '',
      examples: pattern.examples || [],
      bestPractices: pattern.bestPractices || [],
      whenToUse: pattern.whenToUse || [],
      whenNotToUse: pattern.whenNotToUse || [],
      relatedPatterns: pattern.relatedPatterns || [],
      documentedAt: new Date().toISOString()
    };

    this.patterns.set(id, documentedPattern);

    this.logger?.info('Padrão documentado', { patternId: id });

    return documentedPattern;
  }

  /**
   * Documenta prática
   * 
   * @param {Object} practice - Prática a documentar
   * @returns {Promise<Object>} Prática documentada
   */
  async documentPractice(practice) {
    const id = practice.id || `practice-${Date.now()}`;

    const documentedPractice = {
      id,
      name: practice.name,
      domain: practice.domain || 'general',
      description: practice.description || '',
      examples: practice.examples || [],
      benefits: practice.benefits || [],
      implementation: practice.implementation || '',
      documentedAt: new Date().toISOString()
    };

    this.practices.set(id, documentedPractice);

    this.logger?.info('Prática documentada', { practiceId: id });

    return documentedPractice;
  }

  /**
   * Documenta anti-padrão
   * 
   * @param {Object} antiPattern - Anti-padrão a documentar
   * @returns {Promise<Object>} Anti-padrão documentado
   */
  async documentAntiPattern(antiPattern) {
    const id = antiPattern.id || `antipattern-${Date.now()}`;

    const documentedAntiPattern = {
      id,
      name: antiPattern.name,
      category: antiPattern.category || 'general',
      description: antiPattern.description || '',
      whyBad: antiPattern.whyBad || [],
      alternatives: antiPattern.alternatives || [],
      examples: antiPattern.examples || [],
      documentedAt: new Date().toISOString()
    };

    this.antiPatterns.set(id, documentedAntiPattern);

    this.logger?.info('Anti-padrão documentado', { antiPatternId: id });

    return documentedAntiPattern;
  }

  /**
   * Obtém padrão documentado
   * 
   * @param {string} patternId - ID do padrão
   * @returns {Object|null} Padrão ou null
   */
  getPattern(patternId) {
    return this.patterns.get(patternId) || null;
  }

  /**
   * Busca padrões
   * 
   * @param {string} searchQuery - Query de busca (opcional)
   * @param {string} category - Categoria (opcional)
   * @returns {Promise<Object>} Resultados da busca
   */
  async searchPatterns(searchQuery = null, category = null) {
    let results = Array.from(this.patterns.values());

    // Filtrar por categoria
    if (category) {
      results = results.filter(p => p.category === category);
    }

    // Buscar por query
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      results = results.filter(p => {
        if (p.name && p.name.toLowerCase().includes(queryLower)) return true;
        if (p.description && p.description.toLowerCase().includes(queryLower)) return true;
        return false;
      });
    }

    return {
      query: searchQuery,
      category,
      results,
      count: results.length
    };
  }

  /**
   * Infere categoria do padrão
   * 
   * @param {Object} pattern - Padrão
   * @returns {string} Categoria inferida
   */
  inferCategory(pattern) {
    if (pattern.type) {
      return pattern.type;
    }

    if (pattern.name) {
      const nameLower = pattern.name.toLowerCase();
      if (nameLower.includes('repository') || nameLower.includes('usecase')) {
        return 'architecture';
      }
      if (nameLower.includes('oauth') || nameLower.includes('encrypt')) {
        return 'security';
      }
      if (nameLower.includes('expo') || nameLower.includes('mobile')) {
        return 'mobile';
      }
    }

    return 'general';
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      totalPatterns: this.patterns.size,
      totalPractices: this.practices.size,
      totalAntiPatterns: this.antiPatterns.size,
      patternsByCategory: this.getPatternsByCategory()
    };
  }

  /**
   * Obtém padrões por categoria
   * 
   * @returns {Object} Padrões agrupados por categoria
   */
  getPatternsByCategory() {
    const byCategory = {};

    for (const pattern of this.patterns.values()) {
      const category = pattern.category || 'general';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(pattern);
    }

    return byCategory;
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

export default PatternDocumentationSystem;

/**
 * Factory function para criar PatternDocumentationSystem
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {PatternDocumentationSystem} Instância do PatternDocumentationSystem
 */
export function createPatternDocumentationSystem(config = null, logger = null, errorHandler = null) {
  return new PatternDocumentationSystem(config, logger, errorHandler);
}
