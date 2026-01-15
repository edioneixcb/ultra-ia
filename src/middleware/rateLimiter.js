/**
 * Advanced Rate Limiter Middleware
 * 
 * Rate limiting avançado com múltiplas estratégias:
 * - Por IP
 * - Por usuário/API key
 * - Por endpoint
 * - Sliding window algorithm
 */

import { getLogger } from '../utils/Logger.js';
import { getMetricsCollector } from '../utils/MetricsCollector.js';

class RateLimiter {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.metricsCollector = getMetricsCollector(config, logger);
    
    // Configurações
    const rateLimitConfig = config?.api?.rateLimit || {};
    this.windowMs = rateLimitConfig.windowMs || 60000; // 1 minuto
    this.maxRequests = rateLimitConfig.max || 100;
    this.maxPerSession = rateLimitConfig.perSession || 10;
    
    // Stores para diferentes tipos de rate limiting
    this.ipStore = new Map();
    this.userStore = new Map();
    this.endpointStore = new Map();
    
    // Limites por tipo
    this.limits = {
      ip: {
        windowMs: this.windowMs,
        max: this.maxRequests
      },
      user: {
        windowMs: this.windowMs,
        max: this.maxPerSession * 10 // Usuários autenticados têm mais quota
      },
      endpoint: {
        windowMs: this.windowMs,
        max: this.maxRequests * 2
      },
      // Endpoints específicos
      'POST /api/generate': {
        windowMs: this.windowMs,
        max: 20 // Geração é custosa
      },
      'POST /api/index': {
        windowMs: 300000, // 5 minutos
        max: 10 // Indexação é muito custosa
      }
    };
    
    // Iniciar limpeza periódica
    this.startCleanup();
  }

  /**
   * Cria middleware de rate limiting
   */
  middleware() {
    return (req, res, next) => {
      const ip = this.getClientIP(req);
      const userId = req.userId || req.apiKeyHash || null;
      const endpoint = `${req.method} ${req.path}`;
      
      // Verificar limites
      const ipResult = this.checkLimit(this.ipStore, ip, this.limits.ip);
      if (!ipResult.allowed) {
        return this.sendLimitExceeded(res, 'ip', ipResult);
      }
      
      // Se usuário autenticado, verificar limite de usuário
      if (userId) {
        const userLimit = this.limits.user;
        const userResult = this.checkLimit(this.userStore, userId, userLimit);
        if (!userResult.allowed) {
          return this.sendLimitExceeded(res, 'user', userResult);
        }
      }
      
      // Verificar limite específico do endpoint
      const endpointLimit = this.limits[endpoint] || this.limits.endpoint;
      const endpointKey = `${ip}:${endpoint}`;
      const endpointResult = this.checkLimit(this.endpointStore, endpointKey, endpointLimit);
      if (!endpointResult.allowed) {
        return this.sendLimitExceeded(res, 'endpoint', endpointResult);
      }
      
      // Adicionar headers de rate limit
      res.setHeader('X-RateLimit-Limit', ipResult.limit);
      res.setHeader('X-RateLimit-Remaining', ipResult.remaining);
      res.setHeader('X-RateLimit-Reset', ipResult.reset);
      
      next();
    };
  }

  /**
   * Verifica limite para uma chave
   * @param {Map} store - Store de rate limiting
   * @param {string} key - Chave identificadora
   * @param {object} limit - Configuração de limite
   * @returns {object} { allowed, remaining, limit, reset }
   */
  checkLimit(store, key, limit) {
    const now = Date.now();
    const windowStart = now - limit.windowMs;
    
    // Obter ou criar entrada
    let entry = store.get(key);
    if (!entry) {
      entry = { requests: [], blockedUntil: null };
      store.set(key, entry);
    }
    
    // Verificar se está bloqueado
    if (entry.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        limit: limit.max,
        reset: entry.blockedUntil,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
      };
    }
    
    // Remover requests fora da janela
    entry.requests = entry.requests.filter(ts => ts > windowStart);
    
    // Verificar limite
    if (entry.requests.length >= limit.max) {
      // Bloquear por 1 minuto adicional em caso de abuso
      entry.blockedUntil = now + 60000;
      
      this.logger?.warn('Rate limit excedido', { key, count: entry.requests.length });
      this.metricsCollector?.recordError('rate_limit', new Error('Rate limit exceeded'), { key });
      
      return {
        allowed: false,
        remaining: 0,
        limit: limit.max,
        reset: entry.blockedUntil,
        retryAfter: 60
      };
    }
    
    // Adicionar request
    entry.requests.push(now);
    
    return {
      allowed: true,
      remaining: limit.max - entry.requests.length,
      limit: limit.max,
      reset: now + limit.windowMs
    };
  }

  /**
   * Obtém IP do cliente
   */
  getClientIP(req) {
    return req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection?.remoteAddress || 
           'unknown';
  }

  /**
   * Envia resposta de limite excedido
   */
  sendLimitExceeded(res, type, result) {
    res.setHeader('Retry-After', result.retryAfter);
    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', result.reset);
    
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: `Rate limit excedido (${type}). Tente novamente em ${result.retryAfter} segundos.`,
      retryAfter: result.retryAfter
    });
  }

  /**
   * Inicia limpeza periódica de entries antigos
   */
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Limpar a cada minuto
    
    // Não bloquear o processo
    this.cleanupInterval.unref();
  }

  /**
   * Limpa entries antigos
   */
  cleanup() {
    const now = Date.now();
    const maxAge = Math.max(...Object.values(this.limits).map(l => l.windowMs)) * 2;
    
    for (const store of [this.ipStore, this.userStore, this.endpointStore]) {
      for (const [key, entry] of store.entries()) {
        // Remover se não há requests recentes e não está bloqueado
        const latestRequest = Math.max(...(entry.requests || [0]));
        if (now - latestRequest > maxAge && 
            (!entry.blockedUntil || entry.blockedUntil < now)) {
          store.delete(key);
        }
      }
    }
  }

  /**
   * Reseta limite para uma chave
   */
  resetLimit(type, key) {
    const stores = {
      ip: this.ipStore,
      user: this.userStore,
      endpoint: this.endpointStore
    };
    
    const store = stores[type];
    if (store) {
      store.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Define limite customizado para endpoint
   */
  setEndpointLimit(endpoint, windowMs, max) {
    this.limits[endpoint] = { windowMs, max };
  }

  /**
   * Obtém estatísticas
   */
  getStats() {
    return {
      ipEntries: this.ipStore.size,
      userEntries: this.userStore.size,
      endpointEntries: this.endpointStore.size,
      limits: this.limits
    };
  }

  /**
   * Para o rate limiter
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do RateLimiter
 */
export function getRateLimiter(config = null, logger = null) {
  if (!instance) {
    instance = new RateLimiter(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do RateLimiter
 */
export function createRateLimiter(config = null, logger = null) {
  return new RateLimiter(config, logger);
}

/**
 * Cria middleware de rate limiting
 */
export function rateLimitMiddleware(config = null, logger = null) {
  const limiter = getRateLimiter(config, logger);
  return limiter.middleware();
}

export default RateLimiter;
