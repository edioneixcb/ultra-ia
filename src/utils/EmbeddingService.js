/**
 * Embedding Service
 * 
 * Gera embeddings de texto para busca semântica usando Ollama:
 * - Geração de embeddings via Ollama
 * - Cache de embeddings
 * - Busca por similaridade (cosine similarity)
 */

import { getLogger } from './Logger.js';
import { getCacheManager } from './CacheManager.js';
import axios from 'axios';

class EmbeddingService {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.cacheManager = getCacheManager(config, logger);
    
    // Configurações do Ollama
    const ollamaConfig = config?.services?.ollama || {};
    this.ollamaUrl = ollamaConfig.url || 'http://localhost:11434';
    this.embeddingModel = ollamaConfig.embeddingModel || 'nomic-embed-text';
    this.timeout = ollamaConfig.timeout || 30000;
    
    // Cache de embeddings (para evitar recálculos)
    this.embeddingsCache = new Map();
    this.maxCacheSize = 1000;
  }

  /**
   * Gera embedding para um texto
   * @param {string} text - Texto a converter em embedding
   * @returns {Promise<number[]>} Vetor de embedding
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Texto inválido para embedding');
    }

    // Normalizar texto
    const normalizedText = this.normalizeText(text);
    
    // Verificar cache
    const cacheKey = this.getCacheKey(normalizedText);
    const cached = this.embeddingsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.post(
        `${this.ollamaUrl}/api/embeddings`,
        {
          model: this.embeddingModel,
          prompt: normalizedText
        },
        { timeout: this.timeout }
      );

      const embedding = response.data?.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Resposta de embedding inválida');
      }

      // Cachear resultado
      this.cacheEmbedding(cacheKey, embedding);

      return embedding;
    } catch (error) {
      this.logger?.error('Erro ao gerar embedding', { error: error.message });
      
      // Fallback: embedding baseado em hash simples
      return this.generateFallbackEmbedding(normalizedText);
    }
  }

  /**
   * Gera embeddings para múltiplos textos
   * @param {string[]} texts - Lista de textos
   * @returns {Promise<number[][]>} Lista de embeddings
   */
  async generateEmbeddings(texts) {
    const embeddings = await Promise.all(
      texts.map(text => this.generateEmbedding(text))
    );
    return embeddings;
  }

  /**
   * Calcula similaridade de cosseno entre dois vetores
   * @param {number[]} vecA - Primeiro vetor
   * @param {number[]} vecB - Segundo vetor
   * @returns {number} Similaridade (0 a 1)
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vetores devem ter mesmo tamanho');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Busca itens mais similares a um texto de query
   * @param {string} query - Texto de busca
   * @param {Array<{text: string, data: any}>} items - Itens para buscar
   * @param {number} topK - Número de resultados
   * @returns {Promise<Array>} Itens ordenados por similaridade
   */
  async search(query, items, topK = 10) {
    // Gerar embedding da query
    const queryEmbedding = await this.generateEmbedding(query);

    // Gerar embeddings dos itens (ou usar cached)
    const results = await Promise.all(
      items.map(async (item) => {
        const itemEmbedding = await this.generateEmbedding(item.text);
        const similarity = this.cosineSimilarity(queryEmbedding, itemEmbedding);
        return {
          ...item,
          similarity
        };
      })
    );

    // Ordenar por similaridade e retornar top K
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Normaliza texto para embedding
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, 8000); // Limitar tamanho
  }

  /**
   * Gera chave de cache para texto
   */
  getCacheKey(text) {
    // Hash simples do texto
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `emb_${hash}`;
  }

  /**
   * Armazena embedding em cache
   */
  cacheEmbedding(key, embedding) {
    // Limpar cache se muito grande
    if (this.embeddingsCache.size >= this.maxCacheSize) {
      // Remover 10% mais antigos
      const toRemove = Math.floor(this.maxCacheSize * 0.1);
      const keys = Array.from(this.embeddingsCache.keys()).slice(0, toRemove);
      keys.forEach(k => this.embeddingsCache.delete(k));
    }

    this.embeddingsCache.set(key, embedding);
  }

  /**
   * Gera embedding de fallback quando Ollama não está disponível
   * Usa técnica simples de bag-of-words com hash
   */
  generateFallbackEmbedding(text, dimensions = 384) {
    const embedding = new Array(dimensions).fill(0);
    const words = text.split(/\s+/);

    for (const word of words) {
      // Hash simples da palavra
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash = hash & hash;
      }

      // Usar hash para atualizar múltiplas dimensões
      for (let i = 0; i < 5; i++) {
        const dim = Math.abs((hash + i * 997) % dimensions);
        embedding[dim] += 1 / (i + 1);
      }
    }

    // Normalizar
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) {
        embedding[i] /= norm;
      }
    }

    return embedding;
  }

  /**
   * Verifica se Ollama está disponível
   */
  async isOllamaAvailable() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Lista modelos de embedding disponíveis
   */
  async listAvailableModels() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
        timeout: 5000
      });
      
      return response.data?.models
        ?.filter(m => m.name.includes('embed') || m.name.includes('nomic'))
        ?.map(m => m.name) || [];
    } catch {
      return [];
    }
  }

  /**
   * Limpa cache de embeddings
   */
  clearCache() {
    this.embeddingsCache.clear();
  }

  /**
   * Obtém estatísticas
   */
  getStats() {
    return {
      cacheSize: this.embeddingsCache.size,
      maxCacheSize: this.maxCacheSize,
      model: this.embeddingModel,
      ollamaUrl: this.ollamaUrl
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do EmbeddingService
 */
export function getEmbeddingService(config = null, logger = null) {
  if (!instance) {
    instance = new EmbeddingService(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do EmbeddingService
 */
export function createEmbeddingService(config = null, logger = null) {
  return new EmbeddingService(config, logger);
}

export default EmbeddingService;
