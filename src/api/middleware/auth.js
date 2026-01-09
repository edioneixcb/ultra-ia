/**
 * Middleware de Autenticação
 * 
 * Implementa autenticação básica via API Key:
 * - Validação de API Key no header
 * - Suporte para múltiplas chaves
 * - Autorização baseada em roles (futuro)
 */

import { getLogger } from '../../utils/Logger.js';
import { loadConfig } from '../../utils/ConfigLoader.js';

/**
 * Middleware de autenticação via API Key
 */
export function authenticateApiKey(req, res, next) {
  const config = loadConfig().get();
  const logger = getLogger(config);
  const authConfig = config.api?.auth || {};

  // Se autenticação não está habilitada, passar direto
  if (!authConfig.enabled) {
    return next();
  }

  // Obter API Key do header
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    logger?.warn('Requisição sem API Key', {
      ip: req.ip,
      path: req.path
    });
    return res.status(401).json({
      success: false,
      error: 'API Key requerida',
      message: 'Forneça uma API Key válida no header X-API-Key ou Authorization'
    });
  }

  // Validar API Key
  const validApiKey = authConfig.apiKey || process.env.API_KEY;
  const apiKeys = authConfig.apiKeys || []; // Suporte para múltiplas chaves

  // Verificar se a chave é válida
  const isValid = apiKey === validApiKey || apiKeys.includes(apiKey);

  if (!isValid) {
    logger?.warn('API Key inválida', {
      ip: req.ip,
      path: req.path,
      providedKey: apiKey.substring(0, 8) + '...'
    });
    return res.status(403).json({
      success: false,
      error: 'API Key inválida',
      message: 'A API Key fornecida não é válida'
    });
  }

  // Adicionar informações de autenticação ao request
  req.authenticated = true;
  req.apiKey = apiKey;

  logger?.debug('Autenticação bem-sucedida', {
    ip: req.ip,
    path: req.path
  });

  next();
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

  if (!authConfig.enabled) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (apiKey) {
    const validApiKey = authConfig.apiKey || process.env.API_KEY;
    const apiKeys = authConfig.apiKeys || [];
    
    if (apiKey === validApiKey || apiKeys.includes(apiKey)) {
      req.authenticated = true;
      req.apiKey = apiKey;
    }
  }

  next();
}
