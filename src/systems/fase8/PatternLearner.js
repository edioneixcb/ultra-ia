/**
 * PatternLearner - Aprendizado Contínuo
 * 
 * Implementa aprendizado contínuo de padrões e aplicação inteligente.
 * 
 * Funcionalidades:
 * - Extração de Padrões (extrair padrões de código existente)
 * - Aprendizado de Uso (aprender como padrões são usados)
 * - Aplicação de Padrões (aplicar padrões aprendidos)
 * - Atualização de Preferências (atualizar preferências baseado em uso)
 * 
 * Métricas de Sucesso:
 * - 100% dos padrões são extraídos corretamente
 * - 100% do aprendizado melhora a qualidade do código gerado
 */

import BaseSystem from '../../core/BaseSystem.js';

class PatternLearner extends BaseSystem {
  async onInitialize() {
    this.patterns = new Map();
    this.usageStats = new Map();
    this.preferences = new Map();
    this.logger?.info('PatternLearner inicializado');
  }

  /**
   * Aprende padrões ou aplica padrões aprendidos
   * 
   * @param {Object} context - Contexto com action e parâmetros
   * @returns {Promise<Object>} Resultado da operação
   */
  async onExecute(context) {
    const { action, code, patternId, context: usageContext, learningId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'extract') {
      if (!code) {
        throw new Error('code é obrigatório para extract');
      }
      return await this.extractPatterns(code, learningId);
    } else if (action === 'learn') {
      if (!patternId || !usageContext) {
        throw new Error('patternId e context são obrigatórios para learn');
      }
      return await this.learnUsage(patternId, usageContext, learningId);
    } else if (action === 'apply') {
      if (!patternId) {
        throw new Error('patternId é obrigatório para apply');
      }
      return await this.applyPattern(patternId, context.parameters || {});
    } else if (action === 'updatePreferences') {
      return await this.updatePreferences(context.preferences || {});
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Extrai padrões de código
   * 
   * @param {string} code - Código a analisar
   * @param {string} learningId - ID do aprendizado (opcional)
   * @returns {Promise<Object>} Padrões extraídos
   */
  async extractPatterns(code, learningId = null) {
    const patterns = [];

    // Extrair padrão de classe
    const classMatches = code.match(/class\s+(\w+)\s+extends\s+(\w+)/g);
    if (classMatches) {
      for (const match of classMatches) {
        const pattern = {
          type: 'class-inheritance',
          pattern: match,
          frequency: 1
        };
        patterns.push(pattern);
      }
    }

    // Extrair padrão de método async
    const asyncMethodMatches = code.match(/async\s+(\w+)\s*\([^)]*\)\s*\{/g);
    if (asyncMethodMatches) {
      for (const match of asyncMethodMatches) {
        const pattern = {
          type: 'async-method',
          pattern: match,
          frequency: 1
        };
        patterns.push(pattern);
      }
    }

    // Extrair padrão de try-catch
    if (/try\s*\{[\s\S]*catch/i.test(code)) {
      patterns.push({
        type: 'error-handling',
        pattern: 'try-catch',
        frequency: 1
      });
    }

    // Armazenar padrões
    for (const pattern of patterns) {
      const patternId = `${pattern.type}-${Date.now()}`;
      if (!this.patterns.has(patternId)) {
        this.patterns.set(patternId, {
          id: patternId,
          ...pattern,
          extractedAt: new Date().toISOString()
        });
      } else {
        // Incrementar frequência
        const existing = this.patterns.get(patternId);
        existing.frequency++;
      }
    }

    return {
      patterns,
      totalExtracted: patterns.length,
      extractedAt: new Date().toISOString()
    };
  }

  /**
   * Aprende uso de padrão
   * 
   * @param {string} patternId - ID do padrão
   * @param {Object} usageContext - Contexto de uso
   * @param {string} learningId - ID do aprendizado (opcional)
   * @returns {Promise<Object>} Resultado do aprendizado
   */
  async learnUsage(patternId, usageContext, learningId = null) {
    const pattern = this.patterns.get(patternId);

    if (!pattern) {
      throw new Error(`Padrão não encontrado: ${patternId}`);
    }

    // Registrar uso
    if (!this.usageStats.has(patternId)) {
      this.usageStats.set(patternId, {
        patternId,
        usageCount: 0,
        contexts: [],
        successRate: 0
      });
    }

    const stats = this.usageStats.get(patternId);
    stats.usageCount++;
    stats.contexts.push({
      ...usageContext,
      usedAt: new Date().toISOString()
    });

    // Calcular taxa de sucesso se houver feedback
    if (usageContext.success !== undefined) {
      const successes = stats.contexts.filter(c => c.success === true).length;
      stats.successRate = successes / stats.usageCount;
    }

    // Atualizar preferências baseado em uso
    await this.updatePatternPreferences(patternId, stats);

    return {
      patternId,
      learned: true,
      stats,
      learnedAt: new Date().toISOString()
    };
  }

  /**
   * Aplica padrão aprendido
   * 
   * @param {string} patternId - ID do padrão
   * @param {Object} parameters - Parâmetros para aplicação
   * @returns {Promise<Object>} Código gerado com padrão aplicado
   */
  async applyPattern(patternId, parameters = {}) {
    const pattern = this.patterns.get(patternId);

    if (!pattern) {
      throw new Error(`Padrão não encontrado: ${patternId}`);
    }

    // Obter estatísticas de uso
    const stats = this.usageStats.get(patternId);

    // Aplicar padrão baseado em preferências aprendidas
    const appliedCode = await this.generateFromPattern(pattern, parameters, stats);

    return {
      patternId,
      code: appliedCode,
      parameters,
      appliedAt: new Date().toISOString()
    };
  }

  /**
   * Gera código a partir de padrão
   * 
   * @param {Object} pattern - Padrão
   * @param {Object} parameters - Parâmetros
   * @param {Object} stats - Estatísticas
   * @returns {Promise<string>} Código gerado
   */
  async generateFromPattern(pattern, parameters, stats) {
    // Simplificado - em produção geraria código real baseado no padrão
    switch (pattern.type) {
      case 'class-inheritance':
        return `class ${parameters.className || 'GeneratedClass'} extends ${parameters.baseClass || 'BaseSystem'} {
  // Código gerado usando padrão aprendido
}`;
      case 'async-method':
        return `async ${parameters.methodName || 'execute'}(context) {
  // Método async usando padrão aprendido
}`;
      case 'error-handling':
        return `try {
  // Código
} catch (error) {
  // Tratamento de erro usando padrão aprendido
}`;
      default:
        return `// Código usando padrão: ${pattern.type}`;
    }
  }

  /**
   * Atualiza preferências de padrão
   * 
   * @param {string} patternId - ID do padrão
   * @param {Object} stats - Estatísticas
   */
  async updatePatternPreferences(patternId, stats) {
    if (!this.preferences.has(patternId)) {
      this.preferences.set(patternId, {
        patternId,
        preferred: false,
        confidence: 0
      });
    }

    const pref = this.preferences.get(patternId);

    // Atualizar preferência baseado em taxa de sucesso
    if (stats.successRate > 0.8) {
      pref.preferred = true;
      pref.confidence = stats.successRate;
    }

    // Atualizar baseado em frequência de uso
    if (stats.usageCount > 10) {
      pref.confidence = Math.min(pref.confidence + 0.1, 1.0);
    }
  }

  /**
   * Atualiza preferências globais
   * 
   * @param {Object} preferences - Preferências
   * @returns {Promise<Object>} Resultado da atualização
   */
  async updatePreferences(preferences) {
    for (const [key, value] of Object.entries(preferences)) {
      this.preferences.set(key, {
        ...this.preferences.get(key),
        ...value,
        updatedAt: new Date().toISOString()
      });
    }

    return {
      updated: Object.keys(preferences).length,
      preferences: Array.from(this.preferences.entries()).map(([k, v]) => ({ key: k, ...v }))
    };
  }

  /**
   * Obtém padrão armazenado
   * 
   * @param {string} patternId - ID do padrão
   * @returns {Object|null} Padrão ou null
   */
  getPattern(patternId) {
    return this.patterns.get(patternId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      totalPatterns: this.patterns.size,
      totalUsage: Array.from(this.usageStats.values()).reduce((sum, s) => sum + s.usageCount, 0),
      preferredPatterns: Array.from(this.preferences.values()).filter(p => p.preferred).length
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

export default PatternLearner;

export function createPatternLearner(config = null, logger = null, errorHandler = null) {
  return new PatternLearner(config, logger, errorHandler);
}
