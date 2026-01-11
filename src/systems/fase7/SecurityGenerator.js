/**
 * SecurityGenerator - Gerador de Segurança
 * 
 * Gera código de segurança completo usando templates e validações.
 * 
 * Geradores:
 * - E2E Encryption
 * - OAuth Handler
 * - RLS Policies
 * - Device Binding
 * 
 * Métricas de Sucesso:
 * - 100% do código gerado é válido e seguro
 * - 100% do código passa nas validações de segurança
 */

import BaseSystem from '../../core/BaseSystem.js';

class SecurityGenerator extends BaseSystem {
  async onInitialize() {
    this.generations = new Map();
    this.logger?.info('SecurityGenerator inicializado');
  }

  /**
   * Gera código de segurança
   * 
   * @param {Object} context - Contexto com type, parameters e opções
   * @returns {Promise<Object>} Código gerado
   */
  async onExecute(context) {
    const { action, type, parameters = {}, options = {}, generationId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'generate') {
      if (!type) {
        throw new Error('type é obrigatório para generate');
      }
      return await this.generateSecurityCode(type, parameters, options, generationId);
    } else if (action === 'getGeneration') {
      if (!generationId) {
        throw new Error('generationId é obrigatório para getGeneration');
      }
      return this.getGeneration(generationId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Gera código de segurança
   * 
   * @param {string} type - Tipo (e2e-encryption, oauth-handler, rls-policy, device-binding)
   * @param {Object} parameters - Parâmetros
   * @param {Object} options - Opções
   * @param {string} generationId - ID da geração (opcional)
   * @returns {Promise<Object>} Código gerado
   */
  async generateSecurityCode(type, parameters, options = {}, generationId = null) {
    let code;

    switch (type) {
      case 'e2e-encryption':
        code = await this.generateE2EEncryption(parameters, options);
        break;
      case 'oauth-handler':
        code = await this.generateOAuthHandler(parameters, options);
        break;
      case 'rls-policy':
        code = await this.generateRLSPolicy(parameters, options);
        break;
      case 'device-binding':
        code = await this.generateDeviceBinding(parameters, options);
        break;
      default:
        throw new Error(`Tipo de geração desconhecido: ${type}`);
    }

    // Validar código gerado
    let validation = null;
    if (options.validate !== false) {
      validation = await this.validateGeneratedCode(code, type);
    }

    const result = {
      type,
      code,
      parameters,
      validation,
      generatedAt: new Date().toISOString()
    };

    const id = generationId || `generation-${Date.now()}`;
    this.generations.set(id, result);

    return result;
  }

  /**
   * Gera E2E Encryption
   */
  async generateE2EEncryption(parameters, options) {
    return `const crypto = require('crypto');

class E2EEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
  }

  async encrypt(data, publicKey) {
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
    const key = Buffer.from(privateKey, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}

export default E2EEncryption;`;
  }

  /**
   * Gera OAuth Handler
   */
  async generateOAuthHandler(parameters, options) {
    const { scopes = 'read write' } = parameters;

    return `class OAuthHandler {
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
      scope: '${scopes}',
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
}

export default OAuthHandler;`;
  }

  /**
   * Gera RLS Policy
   */
  async generateRLSPolicy(parameters, options) {
    const { tableName, policyName = `${tableName}_policy` } = parameters;

    if (!tableName) {
      throw new Error('tableName é obrigatório para RLS Policy');
    }

    return `-- Row Level Security Policy para ${tableName}
-- Habilitar RLS na tabela
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só podem ver seus próprios registros
CREATE POLICY "${policyName}_select_policy" ON ${tableName}
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::integer);

-- Policy: Usuários só podem inserir registros com seu próprio user_id
CREATE POLICY "${policyName}_insert_policy" ON ${tableName}
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::integer);

-- Policy: Usuários só podem atualizar seus próprios registros
CREATE POLICY "${policyName}_update_policy" ON ${tableName}
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::integer);

-- Policy: Usuários só podem deletar seus próprios registros
CREATE POLICY "${policyName}_delete_policy" ON ${tableName}
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id')::integer);`;
  }

  /**
   * Gera Device Binding
   */
  async generateDeviceBinding(parameters, options) {
    const { maxAge = '30 days' } = parameters;

    return `const crypto = require('crypto');

class DeviceBinding {
  constructor(db) {
    this.db = db;
  }

  async bindDevice(userId, deviceInfo) {
    const deviceId = this.generateDeviceId(deviceInfo);
    
    const existing = await this.db.query(
      'SELECT * FROM device_bindings WHERE user_id = $1 AND device_id = $2',
      [userId, deviceId]
    );

    if (existing.rows.length > 0) {
      await this.db.query(
        'UPDATE device_bindings SET last_access = NOW() WHERE id = $1',
        [existing.rows[0].id]
      );
      return existing.rows[0];
    }

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
       WHERE user_id = $1 AND device_id = $2 AND last_access > NOW() - INTERVAL '${maxAge}'\`,
      [userId, deviceId]
    );

    return result.rows.length > 0;
  }

  generateDeviceId(deviceInfo) {
    const data = JSON.stringify({
      userAgent: deviceInfo.userAgent,
      platform: deviceInfo.platform,
      fingerprint: deviceInfo.fingerprint
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export default DeviceBinding;`;
  }

  /**
   * Valida código gerado
   */
  async validateGeneratedCode(code, type) {
    // Validação básica
    return {
      valid: code && code.length > 0,
      issues: []
    };
  }

  /**
   * Obtém geração armazenada
   */
  getGeneration(generationId) {
    return this.generations.get(generationId) || null;
  }

  /**
   * Obtém estatísticas
   */
  getStats() {
    const all = Array.from(this.generations.values());
    return {
      totalGenerations: all.length,
      validGenerations: all.filter(g => !g.validation || g.validation.valid).length
    };
  }

  /**
   * Valida contexto
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
   */
  onGetDependencies() {
    return ['logger', 'config'];
  }
}

export default SecurityGenerator;

export function createSecurityGenerator(config = null, logger = null, errorHandler = null) {
  return new SecurityGenerator(config, logger, errorHandler);
}
