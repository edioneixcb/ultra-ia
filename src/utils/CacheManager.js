/**
 * Cache Manager
 * 
 * Gerencia cache LRU para operações custosas:
 * - Cache de buscas na Knowledge Base
 * - Cache de análises de requisitos
 * - Invalidação inteligente
 */

import { LRUCache } from 'lru-cache';
import { getLogger } from './Logger.js';

class CacheManager {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger;

    const cacheConfig = config?.cache || {};
    const maxSize = cacheConfig.maxSize || 100;
    const ttl = cacheConfig.ttl || 3600000; // 1 hora padrão

    this.cache = new LRUCache({
      max: maxSize,
      ttl: ttl,
      updateAgeOnGet: true,
      updateAgeOnHas: false
    });

    this.enabled = cacheConfig.enabled !== false;
  }

  get(key) {
    if (!this.enabled) return undefined;
    return this.cache.get(key);
  }

  set(key, value, ttl = null) {
    if (!this.enabled) return;
    if (ttl) {
      this.cache.set(key, value, { ttl });
    } else {
      this.cache.set(key, value);
    }
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
      enabled: this.enabled
    };
  }
}

// Singleton instance with initialization lock
let instance = null;
let initializationPromise = null;

/**
 * Obtém instância singleton do CacheManager
 * Thread-safe: previne criação dupla durante inicialização concorrente
 */
export function getCacheManager(config = null, logger = null) {
  // Fast path: instância já existe
  if (instance) {
    return instance;
  }

  // Se não há inicialização em andamento, criar agora
  if (!initializationPromise) {
    instance = new CacheManager(config, logger);
  }
  
  return instance;
}

/**
 * Cria nova instância do CacheManager (não singleton)
 */
export function createCacheManager(config = null, logger = null) {
  return new CacheManager(config, logger);
}

export default CacheManager;
