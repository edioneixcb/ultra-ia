/**
 * IntegrationTemplateManager - Gerenciador de Templates de Integrações
 * 
 * Gerencia templates específicos para padrões de integração.
 * 
 * Templates disponíveis:
 * - Webhook Handler
 * - OAuth Callback
 * - API Client
 * - Error Handler de integração
 * 
 * Métricas de Sucesso:
 * - 100% dos templates de integração disponíveis
 * - 100% dos templates são válidos e funcionais
 */

import BaseSystem from '../../core/BaseSystem.js';

class IntegrationTemplateManager extends BaseSystem {
  async onInitialize() {
    this.templates = new Map();
    this.initializeTemplates();
    this.logger?.info('IntegrationTemplateManager inicializado');
  }

  /**
   * Inicializa templates de integração
   */
  initializeTemplates() {
    // Template: Webhook Handler
    this.templates.set('webhook-handler', {
      id: 'webhook-handler',
      name: 'Webhook Handler',
      category: 'integration',
      code: `class WebhookHandler {
  constructor(secret) {
    this.secret = secret;
  }

  async handle(req, res) {
    try {
      // Validar assinatura
      const signature = req.headers['{{signatureHeader}}'];
      if (!this.validateSignature(req.body, signature)) {
        return res.status(401).json({ error: 'Assinatura inválida' });
      }

      // Processar evento
      const event = req.body;
      await this.processEvent(event);

      // Retornar resposta
      res.status(200).json({ received: true });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  validateSignature(payload, signature) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.secret);
    const hash = hmac.update(JSON.stringify(payload)).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(hash)
    );
  }

  async processEvent(event) {
    switch (event.type) {
      case '{{eventType1}}':
        await this.handle{{EventType1}}(event);
        break;
      case '{{eventType2}}':
        await this.handle{{EventType2}}(event);
        break;
      default:
        this.logger?.warn('Tipo de evento desconhecido', { type: event.type });
    }
  }

  async handle{{EventType1}}(event) {
    // Implementar handler para {{eventType1}}
  }

  async handle{{EventType2}}(event) {
    // Implementar handler para {{eventType2}}
  }

  handleError(error, res) {
    this.logger?.error('Erro ao processar webhook', { error });
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
}`,
      description: 'Template para handler de webhook',
      parameters: ['signatureHeader', 'eventType1', 'EventType1', 'eventType2', 'EventType2']
    });

    // Template: OAuth Callback
    this.templates.set('oauth-callback', {
      id: 'oauth-callback',
      name: 'OAuth Callback',
      category: 'integration',
      code: `class OAuthCallbackHandler {
  constructor(oauthHandler, userService) {
    this.oauthHandler = oauthHandler;
    this.userService = userService;
  }

  async handle(req, res) {
    try {
      const { code, state, error } = req.query;

      // Verificar erro
      if (error) {
        return res.redirect(\`{{errorRedirectUrl}}?error=\${error}\`);
      }

      // Validar state
      if (!this.validateState(state)) {
        return res.redirect(\`{{errorRedirectUrl}}?error=invalid_state\`);
      }

      // Trocar código por token
      const tokens = await this.oauthHandler.exchangeCodeForToken(code);

      // Obter informações do usuário
      const userInfo = await this.getUserInfo(tokens.access_token);

      // Criar ou atualizar usuário
      const user = await this.userService.findOrCreate({
        providerId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name
      });

      // Criar sessão
      const session = await this.createSession(user.id, tokens);

      // Redirecionar para sucesso
      res.redirect(\`{{successRedirectUrl}}?session=\${session.token}\`);
    } catch (error) {
      this.logger?.error('Erro no callback OAuth', { error });
      res.redirect(\`{{errorRedirectUrl}}?error=callback_failed\`);
    }
  }

  validateState(state) {
    // Validar state contra sessão
    return true; // Implementar validação real
  }

  async getUserInfo(accessToken) {
    const response = await fetch('{{userInfoUrl}}', {
      headers: {
        'Authorization': \`Bearer \${accessToken}\`
      }
    });
    return await response.json();
  }

  async createSession(userId, tokens) {
    // Criar sessão com tokens
    return { token: 'session_token', userId };
  }
}`,
      description: 'Template para handler de callback OAuth',
      parameters: ['errorRedirectUrl', 'successRedirectUrl', 'userInfoUrl']
    });

    // Template: API Client
    this.templates.set('api-client', {
      id: 'api-client',
      name: 'API Client',
      category: 'integration',
      code: `class {{ApiName}}Client {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  async request(method, endpoint, data = null) {
    const url = \`\${this.baseUrl}\${endpoint}\`;
    const options = {
      method,
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      timeout: this.timeout
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async get(endpoint) {
    return await this.request('GET', endpoint);
  }

  async post(endpoint, data) {
    return await this.request('POST', endpoint, data);
  }

  async put(endpoint, data) {
    return await this.request('PUT', endpoint, data);
  }

  async delete(endpoint) {
    return await this.request('DELETE', endpoint);
  }
}`,
      description: 'Template para cliente de API',
      parameters: ['ApiName']
    });

    // Template: Error Handler de Integração
    this.templates.set('integration-error-handler', {
      id: 'integration-error-handler',
      name: 'Integration Error Handler',
      category: 'integration',
      code: `class IntegrationErrorHandler {
  constructor(logger) {
    this.logger = logger;
  }

  handle(error, context) {
    const errorInfo = this.classifyError(error);

    // Log erro
    this.logger.error('Erro de integração', {
      error: error.message,
      type: errorInfo.type,
      context,
      stack: error.stack
    });

    // Retry logic para erros temporários
    if (errorInfo.retryable) {
      return this.scheduleRetry(context, errorInfo);
    }

    // Notificar para erros críticos
    if (errorInfo.critical) {
      this.notifyCriticalError(error, context);
    }

    return {
      handled: true,
      retryable: errorInfo.retryable,
      critical: errorInfo.critical
    };
  }

  classifyError(error) {
    // Erros de rede são retryable
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return { type: 'network', retryable: true, critical: false };
    }

    // Erros 5xx são retryable
    if (error.status >= 500) {
      return { type: 'server', retryable: true, critical: false };
    }

    // Erros 4xx não são retryable
    if (error.status >= 400 && error.status < 500) {
      return { type: 'client', retryable: false, critical: false };
    }

    // Erro desconhecido
    return { type: 'unknown', retryable: false, critical: true };
  }

  scheduleRetry(context, errorInfo) {
    // Implementar lógica de retry
    return { scheduled: true };
  }

  notifyCriticalError(error, context) {
    // Implementar notificação de erro crítico
  }
}`,
      description: 'Template para handler de erros de integração',
      parameters: []
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

export default IntegrationTemplateManager;

/**
 * Factory function para criar IntegrationTemplateManager
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {IntegrationTemplateManager} Instância do IntegrationTemplateManager
 */
export function createIntegrationTemplateManager(config = null, logger = null, errorHandler = null) {
  return new IntegrationTemplateManager(config, logger, errorHandler);
}
