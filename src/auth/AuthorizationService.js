/**
 * Authorization Service
 * 
 * Gerencia autorizações e permissões:
 * - Verificação de permissões por recurso
 * - Controle de acesso baseado em roles
 * - Políticas de acesso configuráveis
 */

import { getLogger } from '../utils/Logger.js';

class AuthorizationService {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    
    // Definição de roles e permissões
    this.roles = new Map([
      ['admin', {
        permissions: ['*'],
        description: 'Acesso total ao sistema'
      }],
      ['developer', {
        permissions: [
          'api:generate',
          'api:validate',
          'api:index',
          'api:search',
          'api:history',
          'metrics:read'
        ],
        description: 'Acesso às funcionalidades de desenvolvimento'
      }],
      ['viewer', {
        permissions: [
          'api:health',
          'metrics:read'
        ],
        description: 'Acesso somente leitura'
      }]
    ]);

    // Recursos e suas permissões necessárias
    this.resources = new Map([
      ['POST /api/generate', 'api:generate'],
      ['POST /api/validate', 'api:validate'],
      ['POST /api/index', 'api:index'],
      ['GET /api/search', 'api:search'],
      ['GET /api/history', 'api:history'],
      ['GET /api/health', 'api:health'],
      ['GET /api/metrics', 'metrics:read'],
      ['GET /api/metrics/prometheus', 'metrics:read'],
      ['GET /api/metrics/system', 'metrics:read'],
      ['POST /api/metrics/reset', 'admin:metrics'],
      ['GET /api/v1/*', 'api:v1'],
      ['POST /api/v1/*', 'api:v1']
    ]);

    // Cache de verificações
    this.authCache = new Map();
    this.cacheTTL = 60000; // 1 minuto
  }

  /**
   * Verifica se usuário tem permissão para acessar recurso
   * @param {string[]} userPermissions - Permissões do usuário
   * @param {string} resource - Recurso sendo acessado (ex: "POST /api/generate")
   * @returns {object} { allowed, reason }
   */
  authorize(userPermissions, resource) {
    // Verificar cache
    const cacheKey = `${userPermissions.join(',')}:${resource}`;
    const cached = this.authCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.result;
    }

    // Verificar permissão wildcard
    if (userPermissions.includes('*')) {
      return this.cacheResult(cacheKey, { allowed: true, reason: 'Admin access' });
    }

    // Encontrar permissão necessária para o recurso
    const requiredPermission = this.getRequiredPermission(resource);
    
    if (!requiredPermission) {
      // Recurso não mapeado - permitir por padrão (pode mudar para negar)
      return this.cacheResult(cacheKey, { 
        allowed: true, 
        reason: 'Recurso não requer autenticação específica' 
      });
    }

    // Verificar se usuário tem a permissão
    const hasPermission = userPermissions.some(perm => 
      perm === requiredPermission || 
      perm === '*' ||
      this.matchesWildcard(perm, requiredPermission)
    );

    if (hasPermission) {
      return this.cacheResult(cacheKey, { allowed: true, reason: 'Permissão concedida' });
    }

    return this.cacheResult(cacheKey, { 
      allowed: false, 
      reason: `Permissão '${requiredPermission}' necessária` 
    });
  }

  /**
   * Armazena resultado em cache
   */
  cacheResult(key, result) {
    this.authCache.set(key, {
      result,
      timestamp: Date.now()
    });

    // Limpar cache antigo periodicamente
    if (this.authCache.size > 1000) {
      this.cleanupCache();
    }

    return result;
  }

  /**
   * Limpa cache antigo
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.authCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.authCache.delete(key);
      }
    }
  }

  /**
   * Obtém permissão necessária para um recurso
   * @param {string} resource - Recurso (ex: "POST /api/generate")
   */
  getRequiredPermission(resource) {
    // Verificar match exato
    if (this.resources.has(resource)) {
      return this.resources.get(resource);
    }

    // Verificar match com wildcard
    for (const [pattern, permission] of this.resources.entries()) {
      if (this.matchesPattern(resource, pattern)) {
        return permission;
      }
    }

    return null;
  }

  /**
   * Verifica se recurso corresponde a um padrão
   */
  matchesPattern(resource, pattern) {
    if (!pattern.includes('*')) {
      return resource === pattern;
    }

    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\*/g, '.*');
    
    return new RegExp(`^${regexPattern}$`).test(resource);
  }

  /**
   * Verifica se permissão corresponde a um padrão wildcard
   */
  matchesWildcard(permission, required) {
    if (!permission.includes('*')) {
      return permission === required;
    }

    // api:* matches api:generate, api:validate, etc.
    const prefix = permission.replace('*', '');
    return required.startsWith(prefix);
  }

  /**
   * Obtém permissões de um role
   * @param {string} roleName - Nome do role
   * @returns {string[]} Lista de permissões
   */
  getRolePermissions(roleName) {
    const role = this.roles.get(roleName);
    return role ? role.permissions : [];
  }

  /**
   * Verifica se role tem permissão
   * @param {string} roleName - Nome do role
   * @param {string} permission - Permissão a verificar
   */
  roleHasPermission(roleName, permission) {
    const permissions = this.getRolePermissions(roleName);
    return permissions.includes('*') || permissions.includes(permission);
  }

  /**
   * Adiciona novo role
   * @param {string} name - Nome do role
   * @param {string[]} permissions - Permissões
   * @param {string} description - Descrição
   */
  addRole(name, permissions, description = '') {
    this.roles.set(name, { permissions, description });
    this.logger?.info('Role adicionado', { name, permissions });
  }

  /**
   * Remove role
   * @param {string} name - Nome do role
   */
  removeRole(name) {
    return this.roles.delete(name);
  }

  /**
   * Adiciona mapeamento de recurso
   * @param {string} resource - Recurso (ex: "GET /api/custom")
   * @param {string} permission - Permissão necessária
   */
  addResource(resource, permission) {
    this.resources.set(resource, permission);
  }

  /**
   * Lista todos os roles
   */
  listRoles() {
    return Array.from(this.roles.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }

  /**
   * Lista todos os recursos e permissões
   */
  listResources() {
    return Array.from(this.resources.entries()).map(([resource, permission]) => ({
      resource,
      permission
    }));
  }

  /**
   * Obtém estatísticas
   */
  getStats() {
    return {
      rolesCount: this.roles.size,
      resourcesCount: this.resources.size,
      cacheSize: this.authCache.size
    };
  }
}

// Singleton instance
let instance = null;
let initializationPromise = null;

/**
 * Obtém instância singleton do AuthorizationService
 */
export function getAuthorizationService(config = null, logger = null) {
  if (instance) {
    return instance;
  }

  if (!initializationPromise) {
    instance = new AuthorizationService(config, logger);
  }
  
  return instance;
}

/**
 * Cria nova instância do AuthorizationService
 */
export function createAuthorizationService(config = null, logger = null) {
  return new AuthorizationService(config, logger);
}

export default AuthorizationService;
