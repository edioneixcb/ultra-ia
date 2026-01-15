/**
 * Gold Example Searcher
 * 
 * Sistema de busca semântica para recuperar exemplos de código de alta qualidade (Gold Examples).
 * Utiliza o banco de dados SQLite para buscar exemplos relevantes baseados no prompt do usuário.
 * 
 * Funcionalidades:
 * - Busca por similaridade de texto (FTS - Full Text Search)
 * - Filtragem por linguagem
 * - Ranking por relevância e avaliação (rating)
 * - Cache de resultados para performance
 */

import { getKnowledgeBase } from '../components/DynamicKnowledgeBase.js';
import { getLogger } from '../utils/Logger.js';

class GoldExampleSearcher {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.knowledgeBase = getKnowledgeBase(config, this.logger);
  }

  /**
   * Busca exemplos positivos (gold examples) relevantes para o prompt
   * 
   * @param {string} prompt - Prompt do usuário
   * @param {string} language - Linguagem alvo
   * @param {number} limit - Número máximo de exemplos
   * @returns {Promise<Array<object>>} Lista de exemplos encontrados
   */
  async search(prompt, language, limit = 3) {
    try {
      this.logger?.debug('Buscando Gold Examples', { prompt, language, limit });

      // Preparar termos de busca (remover stop words simples)
      const searchTerms = this.extractSearchTerms(prompt);
      
      if (searchTerms.length === 0) {
        return [];
      }

      // Construir query SQL dinâmica baseada nos termos
      // Nota: Em uma implementação ideal, usaríamos embeddings vetoriais.
      // Aqui usamos uma aproximação baseada em palavras-chave e contagem de matches.
      
      const placeholders = searchTerms.map(() => '?').join(' OR prompt LIKE ');
      const query = `
        SELECT id, prompt, code, language, created_at,
          (
            (CASE WHEN prompt LIKE ? THEN 10 ELSE 0 END) +
            (CASE WHEN code LIKE ? THEN 5 ELSE 0 END)
            ${searchTerms.length > 1 ? '+' + searchTerms.slice(1).map(() => '(CASE WHEN prompt LIKE ? THEN 2 ELSE 0 END)').join(' + ') : ''}
          ) as relevance
        FROM gold_examples
        WHERE language = ?
        AND (prompt LIKE ${placeholders})
        ORDER BY relevance DESC, created_at DESC
        LIMIT ?
      `;

      // Preparar parâmetros para a query
      // 1. Match exato no prompt (peso 10)
      // 2. Match exato no código (peso 5)
      // 3. Matches parciais para cada termo (peso 2 cada)
      // 4. Linguagem
      // 5. Termos para o WHERE clause
      // 6. Limit

      const exactMatch = `%${prompt}%`;
      const params = [exactMatch, exactMatch];
      
      // Adicionar parâmetros para relevância dos termos
      if (searchTerms.length > 1) {
        searchTerms.slice(1).forEach(term => params.push(`%${term}%`));
      }
      
      // Adicionar parâmetros para linguagem
      params.push(language);
      
      // Adicionar parâmetros para WHERE
      searchTerms.forEach(term => params.push(`%${term}%`));
      
      // Adicionar limit
      params.push(limit);

      // Executar busca no banco de dados da KnowledgeBase
      const examples = this.knowledgeBase.db.prepare(query).all(...params);

      // Filtrar exemplos com relevância zero (caso algum tenha passado)
      const validExamples = examples.filter(ex => ex.relevance > 0);

      this.logger?.info(`Gold Examples encontrados: ${validExamples.length}`, { 
        terms: searchTerms,
        count: validExamples.length 
      });

      return validExamples.map(ex => ({
        id: ex.id,
        prompt: ex.prompt,
        code: ex.code,
        language: ex.language,
        relevance: ex.relevance
      }));

    } catch (error) {
      this.logger?.error('Erro ao buscar Gold Examples', { error: error.message });
      return [];
    }
  }

  /**
   * Extrai termos de busca do prompt
   * @param {string} prompt - Texto original
   * @returns {string[]} Lista de termos relevantes
   */
  extractSearchTerms(prompt) {
    if (!prompt) return [];
    
    // Remover caracteres especiais e converter para minúsculas
    const cleanPrompt = prompt.toLowerCase().replace(/[^\w\s]/g, '');
    
    // Stop words básicas em português e inglês
    const stopWords = new Set([
      'a', 'o', 'as', 'os', 'um', 'uma', 'de', 'do', 'da', 'em', 'para', 'com', 'por', 'que', 'se',
      'the', 'a', 'an', 'of', 'to', 'in', 'for', 'with', 'by', 'that', 'if', 'is', 'are',
      'crie', 'faça', 'gerar', 'implementar', 'create', 'make', 'generate', 'implement',
      'função', 'function', 'código', 'code', 'classe', 'class'
    ]);

    // Dividir em palavras e filtrar
    return cleanPrompt
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }
}

export default GoldExampleSearcher;
