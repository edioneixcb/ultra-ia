/**
 * IntegrationGenerator - Gerador de Integrações
 * 
 * Gera código de integração completo.
 * 
 * Geradores:
 * - Webhook Handler
 * - OAuth Callback
 * - API Client
 */

import BaseSystem from '../../core/BaseSystem.js';

class IntegrationGenerator extends BaseSystem {
  async onInitialize() {
    this.generations = new Map();
    this.logger?.info('IntegrationGenerator inicializado');
  }

  async onExecute(context) {
    const { action, type, parameters = {}, options = {}, generationId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'generate') {
      if (!type) {
        throw new Error('type é obrigatório para generate');
      }
      return await this.generateIntegrationCode(type, parameters, options, generationId);
    } else if (action === 'getGeneration') {
      if (!generationId) {
        throw new Error('generationId é obrigatório para getGeneration');
      }
      return this.getGeneration(generationId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  async generateIntegrationCode(type, parameters, options = {}, generationId = null) {
    let code;

    switch (type) {
      case 'webhook-handler':
        code = await this.generateWebhookHandler(parameters, options);
        break;
      case 'oauth-callback':
        code = await this.generateOAuthCallback(parameters, options);
        break;
      case 'api-client':
        code = await this.generateAPIClient(parameters, options);
        break;
      default:
        throw new Error(`Tipo de geração desconhecido: ${type}`);
    }

    let validation = null;
    if (options.validate !== false) {
      validation = { valid: code && code.length > 0, issues: [] };
    }

    const result = { type, code, parameters, validation, generatedAt: new Date().toISOString() };
    const id = generationId || `generation-${Date.now()}`;
    this.generations.set(id, result);

    return result;
  }

  async generateWebhookHandler(parameters, options) {
    const { signatureHeader = 'x-signature', eventType1 = 'payment', EventType1 = 'Payment' } = parameters;

    return `class WebhookHandler {
  constructor(secret) {
    this.secret = secret;
  }

  async handle(req, res) {
    try {
      const signature = req.headers['${signatureHeader}'];
      if (!this.validateSignature(req.body, signature)) {
        return res.status(401).json({ error: 'Assinatura inválida' });
      }

      const event = req.body;
      await this.processEvent(event);

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
      case '${eventType1}':
        await this.handle${EventType1}(event);
        break;
      default:
        this.logger?.warn('Tipo de evento desconhecido', { type: event.type });
    }
  }

  async handle${EventType1}(event) {
    // Implementar handler para ${eventType1}
  }

  handleError(error, res) {
    this.logger?.error('Erro ao processar webhook', { error });
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
}

export default WebhookHandler;`;
  }

  async generateOAuthCallback(parameters, options) {
    const { errorRedirectUrl = '/auth/error', successRedirectUrl = '/auth/success', userInfoUrl = 'https://api.example.com/user' } = parameters;

    return `class OAuthCallbackHandler {
  constructor(oauthHandler, userService) {
    this.oauthHandler = oauthHandler;
    this.userService = userService;
  }

  async handle(req, res) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(\`${errorRedirectUrl}?error=\${error}\`);
      }

      if (!this.validateState(state)) {
        return res.redirect(\`${errorRedirectUrl}?error=invalid_state\`);
      }

      const tokens = await this.oauthHandler.exchangeCodeForToken(code);
      const userInfo = await this.getUserInfo(tokens.access_token);
      const user = await this.userService.findOrCreate({
        providerId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name
      });

      const session = await this.createSession(user.id, tokens);
      res.redirect(\`${successRedirectUrl}?session=\${session.token}\`);
    } catch (error) {
      this.logger?.error('Erro no callback OAuth', { error });
      res.redirect(\`${errorRedirectUrl}?error=callback_failed\`);
    }
  }

  validateState(state) {
    return true; // Implementar validação real
  }

  async getUserInfo(accessToken) {
    const response = await fetch('${userInfoUrl}', {
      headers: { 'Authorization': \`Bearer \${accessToken}\` }
    });
    return await response.json();
  }

  async createSession(userId, tokens) {
    return { token: 'session_token', userId };
  }
}

export default OAuthCallbackHandler;`;
  }

  async generateAPIClient(parameters, options) {
    const { apiName = 'API' } = parameters;

    return `class ${apiName}Client {
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
}

export default ${apiName}Client;`;
  }

  getGeneration(generationId) {
    return this.generations.get(generationId) || null;
  }

  getStats() {
    const all = Array.from(this.generations.values());
    return {
      totalGenerations: all.length,
      validGenerations: all.filter(g => !g.validation || g.validation.valid).length
    };
  }

  onValidate(context) {
    if (!context || typeof context !== 'object') {
      return { valid: false, errors: ['Context deve ser um objeto'] };
    }
    if (!context.action || typeof context.action !== 'string') {
      return { valid: false, errors: ['action é obrigatório e deve ser string'] };
    }
    return { valid: true };
  }

  onGetDependencies() {
    return ['logger', 'config'];
  }
}

export default IntegrationGenerator;

export function createIntegrationGenerator(config = null, logger = null, errorHandler = null) {
  return new IntegrationGenerator(config, logger, errorHandler);
}
