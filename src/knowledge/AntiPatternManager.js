/**
 * Anti-Pattern Manager
 * 
 * Sistema para gerenciamento de anti-padrões de código (o que NÃO fazer).
 * Permite buscar padrões proibidos ou desencorajados para instruir o LLM negativamente.
 * 
 * Funcionalidades:
 * - Busca de anti-padrões relevantes ao prompt
 * - Filtragem por linguagem
 * - Instruções de correção/prevenção
 */

import { getKnowledgeBase } from '../components/DynamicKnowledgeBase.js';
import { getLogger } from '../utils/Logger.js';

class AntiPatternManager {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.knowledgeBase = getKnowledgeBase(config, this.logger);
  }

  /**
   * Busca anti-padrões relevantes para o contexto
   * 
   * @param {string} prompt - Prompt do usuário
   * @param {string} language - Linguagem alvo
   * @param {number} limit - Número máximo de resultados
   * @returns {Promise<Array<object>>} Lista de anti-padrões
   */
  async search(prompt, language, limit = 3) {
    try {
      this.logger?.debug('Buscando Anti-Patterns', { prompt, language });

      // Preparar termos de busca
      const searchTerms = this.extractSearchTerms(prompt);
      
      if (searchTerms.length === 0) {
        return [];
      }

      // Query similar ao GoldExampleSearcher, mas focada em anti_patterns
      // Tabela 'anti_patterns' tem colunas: id, prompt, code, reason, language, created_at
      
      const placeholders = searchTerms.map(() => '?').join(' OR prompt LIKE ');
      const query = `
        SELECT id, prompt, code, reason, language, created_at,
          (
            (CASE WHEN prompt LIKE ? THEN 10 ELSE 0 END) +
            (CASE WHEN reason LIKE ? THEN 8 ELSE 0 END) +
            (CASE WHEN code LIKE ? THEN 5 ELSE 0 END)
            ${searchTerms.length > 1 ? '+' + searchTerms.slice(1).map(() => '(CASE WHEN prompt LIKE ? THEN 2 ELSE 0 END)').join(' + ') : ''}
          ) as relevance
        FROM anti_patterns
        WHERE language = ?
        AND (prompt LIKE ${placeholders} OR reason LIKE ${placeholders})
        ORDER BY relevance DESC, created_at DESC
        LIMIT ?
      `;

      // Preparar parâmetros para a query
      const exactMatch = `%${prompt}%`;
      const params = [exactMatch, exactMatch, exactMatch]; // prompt, reason, code
      
      // Adicionar parâmetros para relevância dos termos adicionais
      if (searchTerms.length > 1) {
        searchTerms.slice(1).forEach(term => params.push(`%${term}%`));
      }
      
      // Adicionar parâmetros para linguagem
      params.push(language);
      
      // Adicionar parâmetros para WHERE (duplicado para prompt e reason)
      searchTerms.forEach(term => params.push(`%${term}%`));
      searchTerms.forEach(term => params.push(`%${term}%`));
      
      // Adicionar limit
      params.push(limit);

      // Executar busca
      const patterns = this.knowledgeBase.db.prepare(query).all(...params);

      // Filtrar resultados relevantes
      const validPatterns = patterns.filter(p => p.relevance > 0);

      this.logger?.info(`Anti-Patterns encontrados: ${validPatterns.length}`, { count: validPatterns.length });

      return validPatterns.map(p => ({
        id: p.id,
        prompt: p.prompt,
        badCode: p.code,
        reason: p.reason,
        language: p.language,
        relevance: p.relevance
      }));

    } catch (error) {
      this.logger?.error('Erro ao buscar Anti-Patterns', { error: error.message });
      return [];
    }
  }

  /**
   * Extrai termos de busca (reutiliza lógica simples, poderia ser compartilhada)
   */
  extractSearchTerms(prompt) {
    if (!prompt) return [];
    const cleanPrompt = prompt.toLowerCase().replace(/[^\w\s]/g, '');
    const stopWords = new Set(['a', 'o', 'as', 'os', 'um', 'uma', 'de', 'do', 'da', 'em', 'para', 'com', 'por', 'que', 'se', 'the', 'a', 'an', 'of', 'to', 'in', 'for', 'with', 'by', 'that']);
    return cleanPrompt.split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word));
  }
}

export default AntiPatternManager;
