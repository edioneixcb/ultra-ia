/**
 * ChainOfThoughtValidator - Sistema de Chain-of-Thought Obrigatório
 * 
 * Garante raciocínio explícito e rastreável em formato estruturado.
 * 
 * Funcionalidades:
 * - Formato Estruturado Obrigatório (Observação, Análise, Decisão, Ação)
 * - Validação de Completude (todos os componentes presentes)
 * - Rastreabilidade Completa
 * 
 * Métricas de Sucesso:
 * - 100% do raciocínio em formato estruturado
 * - 100% dos componentes presentes
 * - 100% de rastreabilidade completa
 */

import BaseSystem from '../../core/BaseSystem.js';

class ChainOfThoughtValidator extends BaseSystem {
  async onInitialize() {
    this.validatedThoughts = new Map();
    this.logger?.info('ChainOfThoughtValidator inicializado');
  }

  /**
   * Valida chain-of-thought
   * 
   * @param {Object} context - Contexto com thought a validar
   * @returns {Promise<Object>} Resultado da validação
   */
  async onExecute(context) {
    const { thought, thoughtId } = context;

    if (!thought) {
      throw new Error('thought é obrigatório no contexto');
    }

    this.logger?.info('Validando chain-of-thought', {
      thoughtId: thoughtId || thought.id || 'desconhecido'
    });

    // Enforçar formato se necessário
    const formattedThought = this.enforceFormat(thought);

    // Validar
    const validation = this.validate(formattedThought);

    // Armazenar se tem ID
    const id = thoughtId || thought.id || `thought-${Date.now()}`;
    this.validatedThoughts.set(id, {
      ...validation,
      thought: formattedThought,
      validatedAt: new Date().toISOString()
    });

    this.logger?.info('Chain-of-thought validado', {
      thoughtId: id,
      valid: validation.valid
    });

    return {
      ...validation,
      thought: formattedThought,
      thoughtId: id
    };
  }

  /**
   * Valida chain-of-thought
   * 
   * @param {Object} thought - Chain-of-thought a validar
   * @returns {Object} Resultado da validação
   */
  validate(thought) {
    const required = ['observacao', 'analise', 'decisao', 'acao'];
    const missing = [];

    for (const field of required) {
      const value = thought[field];
      if (!value || (typeof value === 'string' && value.trim().length === 0)) {
        missing.push(field.toUpperCase());
      }
    }

    if (missing.length > 0) {
      const error = new Error(
        `Chain-of-Thought incompleto. Faltando: ${missing.join(', ')}. ` +
        `Componentes obrigatórios: OBSERVAÇÃO, ANÁLISE, DECISÃO, AÇÃO`
      );

      this.logger?.error('Chain-of-thought incompleto', {
        missing,
        thoughtKeys: Object.keys(thought)
      });

      throw error;
    }

    return {
      valid: true,
      components: {
        observacao: thought.observacao,
        analise: thought.analise,
        decisao: thought.decisao,
        acao: thought.acao
      }
    };
  }

  /**
   * Enforça formato estruturado
   * 
   * @param {Object} reasoning - Raciocínio em qualquer formato
   * @returns {Object} Raciocínio em formato estruturado
   */
  enforceFormat(reasoning) {
    // Suporta múltiplos formatos de entrada
    return {
      observacao: reasoning.observacao || reasoning.observation || reasoning.what || reasoning.o || '',
      analise: reasoning.analise || reasoning.analysis || reasoning.why || reasoning.a || '',
      decisao: reasoning.decisao || reasoning.decision || reasoning.how || reasoning.d || '',
      acao: reasoning.acao || reasoning.action || reasoning.nextStep || reasoning.next || ''
    };
  }

  /**
   * Verifica se thought tem todos os componentes
   * 
   * @param {Object} thought - Thought a verificar
   * @returns {boolean} Se tem todos os componentes
   */
  hasAllComponents(thought) {
    const formatted = this.enforceFormat(thought);
    const required = ['observacao', 'analise', 'decisao', 'acao'];

    return required.every(field => {
      const value = formatted[field];
      return value && typeof value === 'string' && value.trim().length > 0;
    });
  }

  /**
   * Obtém thought validado
   * 
   * @param {string} thoughtId - ID do thought
   * @returns {Object|null} Thought validado ou null
   */
  getValidatedThought(thoughtId) {
    return this.validatedThoughts.get(thoughtId) || null;
  }

  /**
   * Lista todos os thoughts validados
   * 
   * @returns {Array<Object>} Lista de thoughts validados
   */
  listValidatedThoughts() {
    return Array.from(this.validatedThoughts.values());
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.validatedThoughts.values());
    return {
      total: all.length,
      valid: all.filter(t => t.valid).length,
      invalid: all.filter(t => !t.valid).length
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

    if (!context.thought || typeof context.thought !== 'object') {
      return { valid: false, errors: ['thought é obrigatório e deve ser objeto'] };
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

export default ChainOfThoughtValidator;

/**
 * Factory function para criar ChainOfThoughtValidator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {ChainOfThoughtValidator} Instância do ChainOfThoughtValidator
 */
export function createChainOfThoughtValidator(config = null, logger = null, errorHandler = null) {
  return new ChainOfThoughtValidator(config, logger, errorHandler);
}
