/**
 * SecurityTemplateManager - Gerenciador de Templates de Segurança
 * 
 * Gerencia templates específicos para padrões de segurança.
 * 
 * Templates disponíveis:
 * - E2E Encryption
 * - OAuth Handler
 * - JWT Middleware
 * - RLS Policy
 * - Device Binding
 * 
 * Métricas de Sucesso:
 * - 100% dos templates de segurança disponíveis
 * - 100% dos templates são válidos e funcionais
 */

import BaseSystem from '../../core/BaseSystem.js';

class SecurityTemplateManager extends BaseSystem {
  async onInitialize() {
    this.templates = new Map();
    this.initializeTemplates();
    this.logger?.info('SecurityTemplateManager inicializado');
  }

  /**
   * Inicializa templates de segurança
   */
  initializeTemplates() {
    // Template: E2E Encryption
    this.templates.set('e2e-encryption', {
      id: 'e2e-encryption',
      name: 'E2E Encryption',
      category: 'security',
      code: `class E2EEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
  }

  async encrypt(data, publicKey) {
    const crypto = require('crypto');
    const key = Buffer.from(publicKey, 'base64');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  async decrypt(encryptedData, privateKey) {
    const crypto = require('crypto');
    const key = Buffer.from(privateKey, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}`,
      description: 'Template para criptografia end-to-end',
      parameters: []
    });

    // Template: OAuth Handler
    this.templates.set('oauth-handler', {
      id: 'oauth-handler',
      name: 'OAuth Handler',
      category: 'security',
      code: `class OAuthHandler {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.authorizationUrl = config.authorizationUrl;
    this.tokenUrl = config.tokenUrl;
  }

  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: '{{scopes}}',
      state: state
    });
    
    return \`\${this.authorizationUrl}?\${params.toString()}\`;
  }

  async exchangeCodeForToken(code) {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': \`Basic \${Buffer.from(\`\${this.clientId}:\${this.clientSecret}\`).toString('base64')}\`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri
      })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return await response.json();
  }

  async refreshToken(refreshToken) {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': \`Basic \${Buffer.from(\`\${this.clientId}:\${this.clientSecret}\`).toString('base64')}\`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return await response.json();
  }
}`,
      description: 'Template para handler OAuth 2.0',
      parameters: ['scopes']
    });

    // Template: JWT Middleware
    this.templates.set('jwt-middleware', {
      id: 'jwt-middleware',
      name: 'JWT Middleware',
      category: 'security',
      code: `const jwt = require('jsonwebtoken');

function jwtMiddleware(secret) {
  return async (req, res, next) => {
    try {
      const token = extractToken(req);
      
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Token inválido' });
      }
      return res.status(500).json({ error: 'Erro ao validar token' });
    }
  };
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

module.exports = jwtMiddleware;`,
      description: 'Template para middleware de validação JWT',
      parameters: []
    });

    // Template: RLS Policy
    this.templates.set('rls-policy', {
      id: 'rls-policy',
      name: 'RLS Policy',
      category: 'security',
      code: `-- Row Level Security Policy para {{tableName}}
-- Habilitar RLS na tabela
ALTER TABLE {{tableName}} ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só podem ver seus próprios registros
CREATE POLICY "{{policyName}}_select_policy" ON {{tableName}}
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::integer);

-- Policy: Usuários só podem inserir registros com seu próprio user_id
CREATE POLICY "{{policyName}}_insert_policy" ON {{tableName}}
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::integer);

-- Policy: Usuários só podem atualizar seus próprios registros
CREATE POLICY "{{policyName}}_update_policy" ON {{tableName}}
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::integer);

-- Policy: Usuários só podem deletar seus próprios registros
CREATE POLICY "{{policyName}}_delete_policy" ON {{tableName}}
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id')::integer);`,
      description: 'Template para política RLS (Row Level Security)',
      parameters: ['tableName', 'policyName']
    });

    // Template: Device Binding
    this.templates.set('device-binding', {
      id: 'device-binding',
      name: 'Device Binding',
      category: 'security',
      code: `class DeviceBinding {
  constructor(db) {
    this.db = db;
  }

  async bindDevice(userId, deviceInfo) {
    const deviceId = this.generateDeviceId(deviceInfo);
    
    // Verificar se dispositivo já está vinculado
    const existing = await this.db.query(
      'SELECT * FROM device_bindings WHERE user_id = $1 AND device_id = $2',
      [userId, deviceId]
    );

    if (existing.rows.length > 0) {
      // Atualizar último acesso
      await this.db.query(
        'UPDATE device_bindings SET last_access = NOW() WHERE id = $1',
        [existing.rows[0].id]
      );
      return existing.rows[0];
    }

    // Criar novo vínculo
    const result = await this.db.query(
      \`INSERT INTO device_bindings (user_id, device_id, device_info, created_at, last_access)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *\`,
      [userId, deviceId, JSON.stringify(deviceInfo)]
    );

    return result.rows[0];
  }

  async validateDevice(userId, deviceInfo) {
    const deviceId = this.generateDeviceId(deviceInfo);
    
    const result = await this.db.query(
      \`SELECT * FROM device_bindings 
       WHERE user_id = $1 AND device_id = $2 AND last_access > NOW() - INTERVAL '{{maxAge}}'\`,
      [userId, deviceId]
    );

    return result.rows.length > 0;
  }

  generateDeviceId(deviceInfo) {
    const crypto = require('crypto');
    const data = JSON.stringify({
      userAgent: deviceInfo.userAgent,
      platform: deviceInfo.platform,
      fingerprint: deviceInfo.fingerprint
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}`,
      description: 'Template para vinculação de dispositivos',
      parameters: ['maxAge']
    });
  }

  /**
   * Gera código a partir de template
   * 
   * @param {Object} context - Contexto com action e templateId
   * @returns {Promise<Object>} Código gerado
   */
  async onExecute(context) {
    const { action, templateId, parameters = {} } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'generate') {
      if (!templateId) {
        throw new Error('templateId é obrigatório para generate');
      }
      return await this.generateFromTemplate(templateId, parameters);
    } else if (action === 'getTemplate') {
      if (!templateId) {
        throw new Error('templateId é obrigatório para getTemplate');
      }
      return this.getTemplate(templateId);
    } else if (action === 'listTemplates') {
      return this.listTemplates();
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Gera código a partir de template
   * 
   * @param {string} templateId - ID do template
   * @param {Object} parameters - Parâmetros
   * @returns {Promise<Object>} Código gerado
   */
  async generateFromTemplate(templateId, parameters) {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template não encontrado: ${templateId}`);
    }

    // Substituir placeholders
    let code = template.code;
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      code = code.replace(placeholder, value);
    }

    const validation = this.validateGeneratedCode(code);

    return {
      templateId,
      code,
      parameters,
      validation,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Obtém template
   * 
   * @param {string} templateId - ID do template
   * @returns {Object|null} Template ou null
   */
  getTemplate(templateId) {
    return this.templates.get(templateId) || null;
  }

  /**
   * Lista todos os templates
   * 
   * @returns {Array<Object>} Lista de templates
   */
  listTemplates() {
    return Array.from(this.templates.values()).map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      description: t.description
    }));
  }

  /**
   * Valida código gerado
   * 
   * @param {string} code - Código gerado
   * @returns {Object} Resultado da validação
   */
  validateGeneratedCode(code) {
    const issues = [];

    if (!code || code.trim().length === 0) {
      issues.push({
        type: 'empty_code',
        severity: 'high',
        description: 'Código gerado está vazio'
      });
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      totalTemplates: this.templates.size,
      templates: Array.from(this.templates.keys())
    };
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

export default SecurityTemplateManager;

/**
 * Factory function para criar SecurityTemplateManager
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {SecurityTemplateManager} Instância do SecurityTemplateManager
 */
export function createSecurityTemplateManager(config = null, logger = null, errorHandler = null) {
  return new SecurityTemplateManager(config, logger, errorHandler);
}
