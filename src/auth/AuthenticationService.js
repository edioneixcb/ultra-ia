/**
 * Authentication Service
 * 
 * Gerencia autenticação via API Key e JWT:
 * - Validação de API Keys
 * - Geração e validação de JWT tokens
 * - Gerenciamento de sessões
 * - Rate limiting por usuário
 */

import crypto from 'crypto';
import { getLogger } from '../utils/Logger.js';

class AuthenticationService {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    
    // Configurações de autenticação
    const authConfig = config?.api?.auth || {};
    this.enabled = authConfig.enabled !== false;
    this.jwtSecret = authConfig.jwtSecret || this.generateSecret();
    this.jwtExpiry = authConfig.jwtExpiry || '24h';
    
    // API Keys válidas (em produção, usar banco de dados)
    this.apiKeys = new Map();
    
    // Se existe API key configurada, adicionar
    if (authConfig.apiKey) {
      this.apiKeys.set(authConfig.apiKey, {
        name: 'default',
        permissions: ['*'],
        createdAt: Date.now()
      });
    }

    // Suporte para múltiplas API keys via configuração
    if (Array.isArray(authConfig.apiKeys)) {
      authConfig.apiKeys.forEach((key, index) => {
        if (typeof key === 'string' && key.length > 0) {
          this.apiKeys.set(key, {
            name: `config-${index + 1}`,
            permissions: ['*'],
            createdAt: Date.now()
          });
        }
      });
    }
    
    // Sessões ativas
    this.sessions = new Map();
    
    // Rate limiting por API key
    this.rateLimits = new Map();
  }

  /**
   * Gera um segredo aleatório para JWT
   */
  generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Gera uma nova API Key
   * @param {string} name - Nome/descrição da API key
   * @param {string[]} permissions - Permissões associadas
   * @returns {object} { apiKey, metadata }
   */
  generateApiKey(name, permissions = ['*']) {
    const apiKey = `ultra_${crypto.randomBytes(24).toString('hex')}`;
    const hashedKey = this.hashApiKey(apiKey);
    
    const metadata = {
      name,
      permissions,
      createdAt: Date.now(),
      lastUsed: null,
      usageCount: 0
    };
    
    this.apiKeys.set(hashedKey, metadata);
    
    this.logger?.info('Nova API Key gerada', { name });
    
    return {
      apiKey,
      metadata: { ...metadata, hash: hashedKey.substring(0, 8) + '...' }
    };
  }

  /**
   * Hash de API key para armazenamento seguro
   */
  hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Valida API Key
   * @param {string} apiKey - API Key a validar
   * @returns {object} { valid, metadata, error }
   */
  validateApiKey(apiKey) {
    if (!this.enabled) {
      return { valid: true, metadata: { permissions: ['*'] } };
    }

    if (!apiKey) {
      return { valid: false, error: 'API Key não fornecida' };
    }

    // Verificar API key direta (para compatibilidade)
    if (this.apiKeys.has(apiKey)) {
      const metadata = this.apiKeys.get(apiKey);
      metadata.lastUsed = Date.now();
      metadata.usageCount++;
      return { valid: true, metadata };
    }

    // Verificar API key hasheada
    const hashedKey = this.hashApiKey(apiKey);
    if (this.apiKeys.has(hashedKey)) {
      const metadata = this.apiKeys.get(hashedKey);
      metadata.lastUsed = Date.now();
      metadata.usageCount++;
      return { valid: true, metadata };
    }

    return { valid: false, error: 'API Key inválida' };
  }

  /**
   * Gera JWT token
   * @param {object} payload - Dados a incluir no token
   * @returns {string} JWT token
   */
  generateJWT(payload) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const expiry = this.parseExpiry(this.jwtExpiry);

    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiry
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload));
    
    const signature = this.signJWT(`${encodedHeader}.${encodedPayload}`);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Valida JWT token
   * @param {string} token - JWT token a validar
   * @returns {object} { valid, payload, error }
   */
  validateJWT(token) {
    if (!token) {
      return { valid: false, error: 'Token não fornecido' };
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: 'Token mal formatado' };
      }

      const [encodedHeader, encodedPayload, signature] = parts;
      
      // Verificar assinatura
      const expectedSignature = this.signJWT(`${encodedHeader}.${encodedPayload}`);
      if (signature !== expectedSignature) {
        return { valid: false, error: 'Assinatura inválida' };
      }

      // Decodificar payload
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload));

      // Verificar expiração
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'Token expirado' };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: `Erro ao validar token: ${error.message}` };
    }
  }

  /**
   * Assina dados para JWT
   */
  signJWT(data) {
    return crypto
      .createHmac('sha256', this.jwtSecret)
      .update(data)
      .digest('base64url');
  }

  /**
   * Codifica em Base64 URL-safe
   */
  base64UrlEncode(str) {
    return Buffer.from(str).toString('base64url');
  }

  /**
   * Decodifica de Base64 URL-safe
   */
  base64UrlDecode(str) {
    return Buffer.from(str, 'base64url').toString();
  }

  /**
   * Converte string de expiração para segundos
   */
  parseExpiry(expiry) {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 86400; // 24h padrão

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400
    };

    return value * (multipliers[unit] || 3600);
  }

  /**
   * Cria sessão autenticada
   * @param {string} identifier - Identificador (API key ou user)
   * @param {object} metadata - Metadados da sessão
   * @returns {string} Session ID
   */
  createSession(identifier, metadata = {}) {
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    this.sessions.set(sessionId, {
      identifier,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ...metadata
    });

    // Limpar sessões antigas
    this.cleanupSessions();

    return sessionId;
  }

  /**
   * Valida sessão
   * @param {string} sessionId - ID da sessão
   * @returns {object} { valid, session }
   */
  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { valid: false, error: 'Sessão não encontrada' };
    }

    // Verificar timeout (30 minutos de inatividade)
    const timeout = 30 * 60 * 1000;
    if (Date.now() - session.lastActivity > timeout) {
      this.sessions.delete(sessionId);
      return { valid: false, error: 'Sessão expirada' };
    }

    // Atualizar última atividade
    session.lastActivity = Date.now();

    return { valid: true, session };
  }

  /**
   * Remove sessão
   */
  invalidateSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  /**
   * Limpa sessões antigas
   */
  cleanupSessions() {
    const timeout = 30 * 60 * 1000;
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > timeout) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Verifica se está habilitado
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Obtém estatísticas
   */
  getStats() {
    return {
      enabled: this.enabled,
      apiKeysCount: this.apiKeys.size,
      activeSessions: this.sessions.size
    };
  }

  /**
   * Lista API keys (sem revelar as keys)
   */
  listApiKeys() {
    return Array.from(this.apiKeys.entries()).map(([hash, metadata]) => ({
      hash: hash.substring(0, 8) + '...',
      ...metadata
    }));
  }

  /**
   * Revoga API key
   */
  revokeApiKey(apiKeyOrHash) {
    // Tentar hash direto
    if (this.apiKeys.has(apiKeyOrHash)) {
      this.apiKeys.delete(apiKeyOrHash);
      return true;
    }

    // Tentar hash da key
    const hashedKey = this.hashApiKey(apiKeyOrHash);
    if (this.apiKeys.has(hashedKey)) {
      this.apiKeys.delete(hashedKey);
      return true;
    }

    return false;
  }
}

// Singleton instance
let instance = null;
let initializationPromise = null;

/**
 * Obtém instância singleton do AuthenticationService
 */
export function getAuthenticationService(config = null, logger = null) {
  if (instance) {
    return instance;
  }

  if (!initializationPromise) {
    instance = new AuthenticationService(config, logger);
  }
  
  return instance;
}

/**
 * Cria nova instância do AuthenticationService
 */
export function createAuthenticationService(config = null, logger = null) {
  return new AuthenticationService(config, logger);
}

export default AuthenticationService;
