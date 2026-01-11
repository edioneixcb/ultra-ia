/**
 * DecisionClassifier - Sistema de Classificação de Decisões
 * 
 * Classifica decisões em Níveis 1, 2, 3 e aplica ação apropriada.
 * 
 * Funcionalidades:
 * - Classificação Automática (analisar impacto, classificar em Nível 1/2/3)
 * - Aplicação de Ação (Nível 1: executar e documentar, Nível 2: informar e prosseguir, Nível 3: parar e aguardar aprovação)
 * 
 * Métricas de Sucesso:
 * - 100% das decisões classificadas corretamente
 * - 100% das ações aplicadas conforme classificação
 * - 0% de decisões Nível 3 executadas sem aprovação
 */

import BaseSystem from '../../core/BaseSystem.js';

class DecisionClassifier extends BaseSystem {
  async onInitialize() {
    this.classifications = new Map();
    this.logger?.info('DecisionClassifier inicializado');
  }

  /**
   * Classifica decisão
   * 
   * @param {Object} context - Contexto com decision a classificar
   * @returns {Promise<Object>} Classificação e ação recomendada
   */
  async onExecute(context) {
    const { decision } = context;

    if (!decision) {
      throw new Error('decision é obrigatório no contexto');
    }

    this.logger?.info('Classificando decisão', { decisionId: decision.id || 'desconhecido' });

    const classification = this.classify(decision);

    // Armazenar classificação
    if (decision.id) {
      this.classifications.set(decision.id, {
        ...classification,
        decision,
        classifiedAt: new Date().toISOString()
      });
    }

    this.logger?.info('Decisão classificada', {
      decisionId: decision.id || 'desconhecido',
      level: classification.level,
      action: classification.action
    });

    return classification;
  }

  /**
   * Classifica decisão baseado em impacto
   * 
   * @param {Object} decision - Decisão a classificar
   * @returns {Object} Classificação (level, action, impact)
   */
  classify(decision) {
    const impact = this.analyzeImpact(decision);

    // Nível 3: Afeta mais de 5 arquivos OU muda comportamento OU afeta segurança/dados
    if (
      impact.filesAffected > 5 ||
      impact.changesBehavior ||
      impact.affectsSecurity ||
      impact.affectsData
    ) {
      return {
        level: 3,
        action: 'Parar e aguardar aprovação',
        impact,
        requiresApproval: true,
        canProceed: false
      };
    }

    // Nível 2: Afeta 2-5 arquivos OU escolha entre alternativas equivalentes
    if (impact.filesAffected >= 2 || impact.alternativesEquivalent) {
      return {
        level: 2,
        action: 'Informar e prosseguir',
        impact,
        requiresApproval: false,
        canProceed: true,
        shouldNotify: true
      };
    }

    // Nível 1: Afeta 1 arquivo ou menos E sem mudança de comportamento
    return {
      level: 1,
      action: 'Executar e documentar',
      impact,
      requiresApproval: false,
      canProceed: true,
      shouldNotify: false,
      shouldDocument: true
    };
  }

  /**
   * Analisa impacto da decisão
   * 
   * @param {Object} decision - Decisão
   * @returns {Object} Análise de impacto
   */
  analyzeImpact(decision) {
    const impact = {
      filesAffected: decision.filesAffected || 0,
      changesBehavior: decision.changesBehavior || false,
      affectsSecurity: decision.affectsSecurity || false,
      affectsData: decision.affectsData || false,
      alternativesEquivalent: decision.alternativesEquivalent || false,
      complexity: decision.complexity || 'low',
      risk: decision.risk || 'low'
    };

    // Analisar descrição se fornecida
    if (decision.description) {
      const desc = decision.description.toLowerCase();
      
      // Detectar mudanças de comportamento
      if (!impact.changesBehavior) {
        impact.changesBehavior = /mudar|alterar|modificar|comportamento|funcionalidade/i.test(desc);
      }

      // Detectar impacto em segurança
      if (!impact.affectsSecurity) {
        impact.affectsSecurity = /segurança|autenticação|autorização|senha|token|credential/i.test(desc);
      }

      // Detectar impacto em dados
      if (!impact.affectsData) {
        impact.affectsData = /dados|database|persistência|armazenamento|salvar|deletar/i.test(desc);
      }

      // Detectar complexidade
      if (impact.complexity === 'low') {
        if (/complexo|difícil|refatoração|arquitetura/i.test(desc)) {
          impact.complexity = 'high';
        } else if (/médio|moderado/i.test(desc)) {
          impact.complexity = 'medium';
        }
      }
    }

    // Calcular risco baseado em fatores
    if (impact.affectsSecurity || impact.affectsData) {
      impact.risk = 'high';
    } else if (impact.changesBehavior || impact.complexity === 'high') {
      impact.risk = 'medium';
    }

    return impact;
  }

  /**
   * Valida se decisão pode ser executada
   * 
   * @param {string} decisionId - ID da decisão
   * @param {boolean} approved - Se foi aprovada (para nível 3)
   * @returns {Object} Resultado da validação
   */
  canExecute(decisionId, approved = false) {
    const classification = this.classifications.get(decisionId);

    if (!classification) {
      return {
        canExecute: false,
        reason: 'Decisão não classificada'
      };
    }

    if (classification.level === 3 && !approved) {
      return {
        canExecute: false,
        reason: 'Decisão Nível 3 requer aprovação',
        requiresApproval: true
      };
    }

    return {
      canExecute: true,
      level: classification.level,
      action: classification.action
    };
  }

  /**
   * Obtém classificação armazenada
   * 
   * @param {string} decisionId - ID da decisão
   * @returns {Object|null} Classificação ou null
   */
  getClassification(decisionId) {
    return this.classifications.get(decisionId) || null;
  }

  /**
   * Lista todas as classificações
   * 
   * @returns {Array<Object>} Lista de classificações
   */
  listClassifications() {
    return Array.from(this.classifications.values());
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.classifications.values());
    const byLevel = {
      1: all.filter(c => c.level === 1).length,
      2: all.filter(c => c.level === 2).length,
      3: all.filter(c => c.level === 3).length
    };

    return {
      total: all.length,
      byLevel,
      requiresApproval: all.filter(c => c.requiresApproval).length,
      canProceed: all.filter(c => c.canProceed).length
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

    if (!context.decision || typeof context.decision !== 'object') {
      return { valid: false, errors: ['decision é obrigatório e deve ser objeto'] };
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

export default DecisionClassifier;

/**
 * Factory function para criar DecisionClassifier
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {DecisionClassifier} Instância do DecisionClassifier
 */
export function createDecisionClassifier(config = null, logger = null, errorHandler = null) {
  return new DecisionClassifier(config, logger, errorHandler);
}
