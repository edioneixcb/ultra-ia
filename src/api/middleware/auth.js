/**
 * Middleware de Autenticação e Autorização
 *
 * Implementa autenticação via API Key e JWT:
 * - Validação de API Key (X-API-Key ou Bearer)
 * - Validação de JWT (Authorization: Bearer)
 * - Autorização por permissões/roles
 */

import { getLogger } from '../../utils/Logger.js';
import { loadConfig } from '../../utils/ConfigLoader.js';
import { getAuthenticationService } from '../../auth/AuthenticationService.js';
import { getAuthorizationService } from '../../auth/AuthorizationService.js';

/**
 * Middleware de autenticação via API Key
 */
export function authenticateApiKey(req, res, next) {
  const config = loadConfig().get();
  const logger = getLogger(config);
  const authConfig = config.api?.auth || {};
  const authService = getAuthenticationService(config, logger);
  const authorizationService = getAuthorizationService(config, logger);

  // Se autenticação não está habilitada, passar direto
  if (!authConfig.enabled) {
    return next();
  }

  const apiKeyHeader = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;

  let authResult = null;
  let authMethod = null;
  let permissions = [];
  let role = null;
  let userId = null;

  if (apiKeyHeader) {
    authResult = authService.validateApiKey(apiKeyHeader);
    authMethod = 'apiKey';
    if (authResult.valid) {
      permissions = authResult.metadata?.permissions || [];
      req.apiKeyHash = authService.hashApiKey(apiKeyHeader);
    }
  }

  if ((!authResult || !authResult.valid) && bearerToken) {
    if (bearerToken.split('.').length === 3) {
      authResult = authService.validateJWT(bearerToken);
      authMethod = 'jwt';
      if (authResult.valid) {
        const payload = authResult.payload || {};
        role = payload.role || null;
        userId = payload.sub || payload.userId || null;
        permissions = Array.isArray(payload.permissions)
          ? payload.permissions
          : authorizationService.getRolePermissions(role);
      }
    } else {
      authResult = authService.validateApiKey(bearerToken);
      authMethod = 'apiKey';
      if (authResult.valid) {
        permissions = authResult.metadata?.permissions || [];
        req.apiKeyHash = authService.hashApiKey(bearerToken);
      }
    }
  }

  if (!authResult || !authResult.valid) {
    const hasAnyCredential = Boolean(apiKeyHeader || bearerToken);
    const statusCode = hasAnyCredential ? 403 : 401;
    const message = authResult?.error || 'Credenciais inválidas';
    logger?.warn('Falha de autenticação', {
      ip: req.ip,
      path: req.path,
      method: authMethod || 'none',
      reason: message
    });
    return res.status(statusCode).json({
      success: false,
      error: hasAnyCredential ? 'Credenciais inválidas' : 'Credenciais requeridas',
      message
    });
  }

  const resource = `${req.method} ${req.baseUrl}${req.path}`;
  const authz = authorizationService.authorize(permissions, resource);
  if (!authz.allowed) {
    logger?.warn('Autorização negada', {
      ip: req.ip,
      path: req.path,
      resource,
      reason: authz.reason
    });
    return res.status(403).json({
      success: false,
      error: 'Acesso negado',
      message: authz.reason
    });
  }

  req.authenticated = true;
  req.authMethod = authMethod;
  req.userId = userId;
  req.userRole = role;
  req.userPermissions = permissions;

  logger?.debug('Autenticação bem-sucedida', {
    ip: req.ip,
    path: req.path,
    method: authMethod,
    role
  });

  return next();
}

/**
 * Middleware de autorização baseada em roles (placeholder para futuro)
 */
export function authorize(roles = []) {
  return (req, res, next) => {
    // Por enquanto, apenas verifica se está autenticado
    // Futuro: verificar roles do usuário
    if (!req.authenticated) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado'
      });
    }

    // TODO: Implementar verificação de roles quando sistema de usuários estiver pronto
    next();
  };
}

/**
 * Middleware opcional de autenticação (não bloqueia se não fornecido)
 */
export function optionalAuth(req, res, next) {
  const config = loadConfig().get();
  const authConfig = config.api?.auth || {};
  const logger = getLogger(config);
  const authService = getAuthenticationService(config, logger);
  const authorizationService = getAuthorizationService(config, logger);

  if (!authConfig.enabled) {
    return next();
  }

  const apiKeyHeader = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;

  let authResult = null;
  let permissions = [];
  let role = null;
  let userId = null;

  if (apiKeyHeader) {
    authResult = authService.validateApiKey(apiKeyHeader);
    if (authResult.valid) {
      permissions = authResult.metadata?.permissions || [];
      req.apiKeyHash = authService.hashApiKey(apiKeyHeader);
      req.authMethod = 'apiKey';
    }
  }

  if ((!authResult || !authResult.valid) && bearerToken) {
    if (bearerToken.split('.').length === 3) {
      authResult = authService.validateJWT(bearerToken);
      if (authResult.valid) {
        const payload = authResult.payload || {};
        role = payload.role || null;
        userId = payload.sub || payload.userId || null;
        permissions = Array.isArray(payload.permissions)
          ? payload.permissions
          : authorizationService.getRolePermissions(role);
        req.authMethod = 'jwt';
      }
    } else {
      authResult = authService.validateApiKey(bearerToken);
      if (authResult.valid) {
        permissions = authResult.metadata?.permissions || [];
        req.apiKeyHash = authService.hashApiKey(bearerToken);
        req.authMethod = 'apiKey';
      }
    }
  }

  if (authResult && authResult.valid) {
    req.authenticated = true;
    req.userId = userId;
    req.userRole = role;
    req.userPermissions = permissions;
  }

  next();
}
