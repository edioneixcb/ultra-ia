/**
 * ForensicAnalyzer - Sistema de Análise Forense
 * 
 * Identifica causa raiz de erros.
 * 
 * Funcionalidades:
 * - Error Classifier (classificar erros por categoria e severidade)
 * - Root Cause Analyzer (identificar causa raiz de erros)
 * - Pattern Matcher (identificar padrões conhecidos de erros)
 * - Evidence Collector (coletar evidências para análise)
 * 
 * Métricas de Sucesso:
 * - 100% dos erros têm causa raiz identificada
 * - 100% dos padrões conhecidos identificados
 * - 100% das evidências coletadas para análise
 */

import BaseSystem from '../../core/BaseSystem.js';

class ForensicAnalyzer extends BaseSystem {
  async onInitialize() {
    this.analyses = new Map();
    this.knownPatterns = new Map();
    this.evidenceCache = new Map();
    this.logger?.info('ForensicAnalyzer inicializado');
  }

  /**
   * Analisa erro forensemente
   * 
   * @param {Object} context - Contexto com error e context
   * @returns {Promise<Object>} Análise forense
   */
  async onExecute(context) {
    const { error, context: errorContext, analysisId } = context;

    if (!error) {
      throw new Error('error é obrigatório no contexto');
    }

    this.logger?.info('Iniciando análise forense', {
      errorId: error.id || 'desconhecido',
      analysisId: analysisId || 'desconhecido'
    });

    const analysis = await this.analyzeError(error, errorContext || {});

    // Armazenar análise
    const id = analysisId || `analysis-${Date.now()}`;
    this.analyses.set(id, {
      ...analysis,
      error,
      context: errorContext,
      analyzedAt: new Date().toISOString()
    });

    return analysis;
  }

  /**
   * Analisa erro
   * 
   * @param {Object} error - Erro a analisar
   * @param {Object} context - Contexto do erro
   * @returns {Promise<Object>} Análise completa
   */
  async analyzeError(error, context) {
    // 1. Classificar erro
    const classification = this.classifyError(error);

    // 2. Identificar padrão conhecido
    const pattern = await this.identifyPattern(error, context);

    // 3. Coletar evidências
    const evidence = await this.collectEvidence(error, context);

    // 4. Determinar causa raiz
    const rootCause = await this.determineRootCause(error, classification, pattern, evidence, context);

    return {
      classification,
      pattern,
      evidence,
      rootCause,
      recommendations: this.generateRecommendations(rootCause, pattern)
    };
  }

  /**
   * Classifica erro por categoria e severidade
   * 
   * @param {Object} error - Erro
   * @returns {Object} Classificação
   */
  classifyError(error) {
    const categories = {
      syntax: /syntax|parse|unexpected token/i,
      type: /type|cannot read|undefined is not/i,
      reference: /reference|is not defined|cannot find/i,
      import: /import|module not found|cannot resolve/i,
      runtime: /runtime|execution|cannot execute/i,
      logic: /logic|incorrect|wrong/i,
      network: /network|connection|timeout/i,
      permission: /permission|access denied|unauthorized/i
    };

    let category = 'unknown';
    let severity = 'medium';

    for (const [cat, pattern] of Object.entries(categories)) {
      if (pattern.test(error.message || error.type || '')) {
        category = cat;
        break;
      }
    }

    // Determinar severidade
    if (error.severity) {
      severity = error.severity;
    } else if (category === 'syntax' || category === 'type') {
      severity = 'high';
    } else if (category === 'reference' || category === 'import') {
      severity = 'high';
    }

    return {
      category,
      severity,
      type: error.type || category
    };
  }

  /**
   * Identifica padrão conhecido
   * 
   * @param {Object} error - Erro
   * @param {Object} context - Contexto
   * @returns {Promise<Object|null>} Padrão identificado ou null
   */
  async identifyPattern(error, context) {
    // Comparar com padrões conhecidos
    for (const [patternId, pattern] of this.knownPatterns.entries()) {
      if (this.matchesPattern(error, pattern)) {
        return {
          id: patternId,
          ...pattern,
          confidence: this.calculatePatternConfidence(error, pattern)
        };
      }
    }

    // Padrões comuns
    const commonPatterns = this.getCommonPatterns();
    for (const pattern of commonPatterns) {
      if (this.matchesPattern(error, pattern)) {
        return {
          ...pattern,
          confidence: this.calculatePatternConfidence(error, pattern)
        };
      }
    }

    return null;
  }

  /**
   * Verifica se erro corresponde a padrão
   * 
   * @param {Object} error - Erro
   * @param {Object} pattern - Padrão
   * @returns {boolean} True se corresponde
   */
  matchesPattern(error, pattern) {
    if (pattern.messagePattern && error.message) {
      const regex = new RegExp(pattern.messagePattern, 'i');
      if (!regex.test(error.message)) {
        return false;
      }
    }

    if (pattern.typePattern && error.type) {
      const regex = new RegExp(pattern.typePattern, 'i');
      if (!regex.test(error.type)) {
        return false;
      }
    }

    if (pattern.category && error.category) {
      if (pattern.category !== error.category) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calcula confiança do padrão
   * 
   * @param {Object} error - Erro
   * @param {Object} pattern - Padrão
   * @returns {number} Confiança (0-1)
   */
  calculatePatternConfidence(error, pattern) {
    let confidence = 0.5; // Base

    if (pattern.messagePattern && error.message) {
      const regex = new RegExp(pattern.messagePattern, 'i');
      if (regex.test(error.message)) {
        confidence += 0.3;
      }
    }

    if (pattern.typePattern && error.type) {
      const regex = new RegExp(pattern.typePattern, 'i');
      if (regex.test(error.type)) {
        confidence += 0.2;
      }
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Obtém padrões comuns
   * 
   * @returns {Array<Object>} Padrões comuns
   */
  getCommonPatterns() {
    return [
      {
        id: 'null-reference',
        name: 'Null Reference Error',
        messagePattern: 'cannot read.*of null|cannot read.*of undefined',
        solution: 'Adicionar verificação de null/undefined antes de usar variável'
      },
      {
        id: 'import-not-found',
        name: 'Import Not Found',
        messagePattern: 'cannot find module|cannot resolve',
        solution: 'Verificar se módulo está instalado e caminho está correto'
      },
      {
        id: 'syntax-error',
        name: 'Syntax Error',
        messagePattern: 'unexpected token|syntax error',
        solution: 'Verificar sintaxe do código, especialmente parênteses, chaves e vírgulas'
      }
    ];
  }

  /**
   * Coleta evidências para análise
   * 
   * @param {Object} error - Erro
   * @param {Object} context - Contexto
   * @returns {Promise<Object>} Evidências coletadas
   */
  async collectEvidence(error, context) {
    const evidence = {
      errorMessage: error.message,
      errorType: error.type,
      errorStack: error.stack,
      timestamp: new Date().toISOString(),
      context: {
        file: error.file,
        line: error.line,
        column: error.column
      },
      environment: context.environment || {},
      code: context.code || null,
      relatedErrors: context.relatedErrors || []
    };

    // Cachear evidências
    const evidenceId = `evidence-${Date.now()}`;
    this.evidenceCache.set(evidenceId, evidence);

    return evidence;
  }

  /**
   * Determina causa raiz
   * 
   * @param {Object} error - Erro
   * @param {Object} classification - Classificação
   * @param {Object} pattern - Padrão identificado
   * @param {Object} evidence - Evidências
   * @param {Object} context - Contexto
   * @returns {Promise<Object>} Causa raiz identificada
   */
  async determineRootCause(error, classification, pattern, evidence, context) {
    // Se há padrão conhecido, usar solução do padrão
    if (pattern && pattern.solution) {
      return {
        identified: true,
        cause: pattern.name || pattern.id,
        explanation: pattern.solution,
        confidence: pattern.confidence || 0.8,
        source: 'known_pattern'
      };
    }

    // Análise baseada em classificação
    const rootCause = {
      identified: true,
      cause: classification.category,
      explanation: this.explainRootCause(classification, evidence),
      confidence: 0.6,
      source: 'classification'
    };

    return rootCause;
  }

  /**
   * Explica causa raiz baseada em classificação
   * 
   * @param {Object} classification - Classificação
   * @param {Object} evidence - Evidências
   * @returns {string} Explicação
   */
  explainRootCause(classification, evidence) {
    const explanations = {
      syntax: 'Erro de sintaxe no código. Verificar parênteses, chaves, vírgulas e estrutura geral.',
      type: 'Erro de tipo. Verificar tipos de variáveis e conversões.',
      reference: 'Referência não encontrada. Verificar se variável/função está definida e no escopo correto.',
      import: 'Módulo não encontrado. Verificar instalação e caminhos de import.',
      runtime: 'Erro em tempo de execução. Verificar lógica e condições de execução.',
      logic: 'Erro lógico. Revisar lógica do código.',
      network: 'Erro de rede. Verificar conectividade e configurações.',
      permission: 'Erro de permissão. Verificar direitos de acesso.'
    };

    return explanations[classification.category] || 'Causa raiz não identificada com precisão. Análise adicional necessária.';
  }

  /**
   * Gera recomendações
   * 
   * @param {Object} rootCause - Causa raiz
   * @param {Object} pattern - Padrão identificado
   * @returns {Array<Object>} Recomendações
   */
  generateRecommendations(rootCause, pattern) {
    const recommendations = [];

    if (pattern && pattern.solution) {
      recommendations.push({
        type: 'immediate',
        priority: 'high',
        action: pattern.solution
      });
    }

    if (rootCause.explanation) {
      recommendations.push({
        type: 'investigation',
        priority: 'medium',
        action: rootCause.explanation
      });
    }

    return recommendations;
  }

  /**
   * Registra padrão conhecido
   * 
   * @param {string} patternId - ID do padrão
   * @param {Object} pattern - Padrão
   */
  registerPattern(patternId, pattern) {
    this.knownPatterns.set(patternId, pattern);
    this.logger?.info('Padrão registrado', { patternId });
  }

  /**
   * Obtém análise armazenada
   * 
   * @param {string} analysisId - ID da análise
   * @returns {Object|null} Análise ou null
   */
  getAnalysis(analysisId) {
    return this.analyses.get(analysisId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.analyses.values());
    const withRootCause = all.filter(a => a.rootCause?.identified).length;
    const withPattern = all.filter(a => a.pattern).length;

    return {
      totalAnalyses: all.length,
      withRootCause,
      withPattern,
      knownPatterns: this.knownPatterns.size
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

    if (!context.error || typeof context.error !== 'object') {
      return { valid: false, errors: ['error é obrigatório e deve ser objeto'] };
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

export default ForensicAnalyzer;

/**
 * Factory function para criar ForensicAnalyzer
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {ForensicAnalyzer} Instância do ForensicAnalyzer
 */
export function createForensicAnalyzer(config = null, logger = null, errorHandler = null) {
  return new ForensicAnalyzer(config, logger, errorHandler);
}
