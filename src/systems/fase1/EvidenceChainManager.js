/**
 * EvidenceChainManager - Sistema de Cadeia de Evidência
 * 
 * Transforma evidência bruta em cadeia rastreável.
 * 
 * Funcionalidades:
 * - Transformação (Observação → Evidência Bruta → Evidência Normalizada → Classificação → Documentação)
 * - Rastreabilidade (preservar evidências brutas, adicionar metadados, manter cadeia completa)
 * 
 * Métricas de Sucesso:
 * - 100% das evidências transformadas em cadeia rastreável
 * - 100% das evidências brutas preservadas
 * - 100% dos metadados adicionados corretamente
 */

import BaseSystem from '../../core/BaseSystem.js';

class EvidenceChainManager extends BaseSystem {
  async onInitialize() {
    this.chains = new Map();
    this.logger?.info('EvidenceChainManager inicializado');
  }

  /**
   * Cria cadeia de evidência
   * 
   * @param {Object} context - Contexto com observation
   * @returns {Promise<Object>} Cadeia criada
   */
  async onExecute(context) {
    const { observation, chainId, action } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'create') {
      if (!observation) {
        throw new Error('observation é obrigatório para create');
      }
      return await this.createChain(observation, chainId);
    } else if (action === 'addRawEvidence') {
      if (!chainId || !context.rawEvidence) {
        throw new Error('chainId e rawEvidence são obrigatórios para addRawEvidence');
      }
      return await this.addRawEvidence(chainId, context.rawEvidence);
    } else if (action === 'normalize') {
      if (!chainId) {
        throw new Error('chainId é obrigatório para normalize');
      }
      return await this.normalizeEvidence(chainId);
    } else if (action === 'validate') {
      if (!chainId) {
        throw new Error('chainId é obrigatório para validate');
      }
      return await this.validateChain(chainId);
    } else if (action === 'get') {
      if (!chainId) {
        throw new Error('chainId é obrigatório para get');
      }
      return await this.getChain(chainId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Cria cadeia de evidência
   * 
   * @param {Object} observation - Observação inicial
   * @param {string} chainId - ID da cadeia (opcional)
   * @returns {Promise<Object>} Cadeia criada
   */
  async createChain(observation, chainId = null) {
    const id = chainId || `chain-${Date.now()}`;

    const chain = {
      id,
      observation: observation,
      rawEvidence: null,
      normalizedEvidence: null,
      classification: null,
      documentation: null,
      metadata: {
        timestamp: new Date().toISOString(),
        agent: 'AGENTE-AUDITOR',
        target: observation.target || null
      }
    };

    this.chains.set(id, chain);

    this.logger?.info('Cadeia de evidência criada', { chainId: id });

    return chain;
  }

  /**
   * Adiciona evidência bruta à cadeia
   * 
   * @param {string} chainId - ID da cadeia
   * @param {*} rawEvidence - Evidência bruta
   * @returns {Promise<Object>} Cadeia atualizada
   */
  async addRawEvidence(chainId, rawEvidence) {
    const chain = this.chains.get(chainId);

    if (!chain) {
      throw new Error(`Cadeia não encontrada: ${chainId}`);
    }

    chain.rawEvidence = {
      data: rawEvidence,
      timestamp: new Date().toISOString(),
      source: 'execution'
    };

    this.chains.set(chainId, chain);

    this.logger?.info('Evidência bruta adicionada', { chainId });

    return chain;
  }

  /**
   * Normaliza evidência
   * 
   * @param {string} chainId - ID da cadeia
   * @returns {Promise<Object>} Cadeia atualizada
   */
  async normalizeEvidence(chainId) {
    const chain = this.chains.get(chainId);

    if (!chain) {
      throw new Error(`Cadeia não encontrada: ${chainId}`);
    }

    if (!chain.rawEvidence) {
      throw new Error('Evidência bruta não encontrada. Adicione evidência bruta primeiro.');
    }

    chain.normalizedEvidence = {
      format: 'standardized',
      data: this.normalize(chain.rawEvidence.data),
      timestamp: new Date().toISOString()
    };

    this.chains.set(chainId, chain);

    this.logger?.info('Evidência normalizada', { chainId });

    return chain;
  }

  /**
   * Normaliza dados brutos
   * 
   * @param {*} data - Dados brutos
   * @returns {*} Dados normalizados
   */
  normalize(data) {
    // Se é string, manter como está
    if (typeof data === 'string') {
      return data.trim();
    }

    // Se é objeto, normalizar estrutura
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map(item => this.normalize(item));
      }

      const normalized = {};
      for (const [key, value] of Object.entries(data)) {
        normalized[key] = this.normalize(value);
      }
      return normalized;
    }

    // Outros tipos, retornar como está
    return data;
  }

  /**
   * Valida cadeia de evidência
   * 
   * @param {string} chainId - ID da cadeia
   * @returns {Object} Resultado da validação
   */
  validateChain(chainId) {
    const chain = this.chains.get(chainId);

    if (!chain) {
      throw new Error(`Cadeia não encontrada: ${chainId}`);
    }

    const required = ['observation', 'rawEvidence', 'normalizedEvidence', 'classification', 'documentation'];
    const missing = required.filter(r => !chain[r] || (typeof chain[r] === 'object' && chain[r] === null));

    if (missing.length > 0) {
      const error = new Error(
        `Cadeia de evidência incompleta. Faltando: ${missing.join(', ')}`
      );

      this.logger?.error('Cadeia de evidência incompleta', {
        chainId,
        missing
      });

      throw error;
    }

    return {
      valid: true,
      chain
    };
  }

  /**
   * Obtém cadeia
   * 
   * @param {string} chainId - ID da cadeia
   * @returns {Object|null} Cadeia ou null
   */
  getChain(chainId) {
    return this.chains.get(chainId) || null;
  }

  /**
   * Lista todas as cadeias
   * 
   * @returns {Array<Object>} Lista de cadeias
   */
  listChains() {
    return Array.from(this.chains.values());
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.chains.values());
    const complete = all.filter(c => 
      c.observation && c.rawEvidence && c.normalizedEvidence && c.classification && c.documentation
    );

    return {
      total: all.length,
      complete: complete.length,
      incomplete: all.length - complete.length
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

export default EvidenceChainManager;

/**
 * Factory function para criar EvidenceChainManager
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {EvidenceChainManager} Instância do EvidenceChainManager
 */
export function createEvidenceChainManager(config = null, logger = null, errorHandler = null) {
  return new EvidenceChainManager(config, logger, errorHandler);
}
