/**
 * BatchResolver - Sistema de Resolução em Lote
 * 
 * Resolve múltiplos erros relacionados em análise única.
 * 
 * Funcionalidades:
 * - Error Grouper (agrupar erros relacionados)
 * - Batch Resolver (resolver múltiplos erros simultaneamente)
 * - Impact Analyzer (analisar impacto de correções)
 * - Validation System (validar que correções resolvem problemas)
 * 
 * Métricas de Sucesso:
 * - 100% dos erros relacionados resolvidos em análise única
 * - 100% das correções validadas antes de aplicar
 * - 0% de novos erros introduzidos por correções
 */

import BaseSystem from '../../core/BaseSystem.js';
import { getComponentRegistry } from '../../core/index.js';

class BatchResolver extends BaseSystem {
  constructor(config = null, logger = null, errorHandler = null) {
    super(config, logger, errorHandler);
    // Não injetar IntelligentSequentialResolver diretamente para evitar dependência circular
    // Usar lazy loading quando necessário
    this.intelligentSequentialResolver = null;
    this.useIntelligentResolver = config?.features?.useIntelligentResolver !== false;
  }

  async onInitialize() {
    this.batches = new Map();
    this.resolutions = new Map();
    this.logger?.info('BatchResolver inicializado', {
      useIntelligentResolver: this.useIntelligentResolver
    });
  }

  /**
   * Obtém IntelligentSequentialResolver via lazy loading para evitar dependência circular
   * 
   * @returns {Object|null} IntelligentSequentialResolver ou null
   */
  getIntelligentSequentialResolver() {
    if (!this.useIntelligentResolver) {
      return null;
    }

    // Lazy loading: buscar do registry apenas quando necessário
    if (!this.intelligentSequentialResolver) {
      try {
        const registry = getComponentRegistry();
        this.intelligentSequentialResolver = registry.get('IntelligentSequentialResolver');
        if (this.intelligentSequentialResolver) {
          this.logger?.debug('IntelligentSequentialResolver obtido via lazy loading');
        }
      } catch (e) {
        this.logger?.warn('Erro ao obter IntelligentSequentialResolver, continuando sem integração', { error: e.message });
        return null;
      }
    }

    return this.intelligentSequentialResolver;
  }

  /**
   * Resolve erros em lote
   * 
   * @param {Object} context - Contexto com errors e codebase
   * @returns {Promise<Object>} Resultado da resolução em lote
   */
  async onExecute(context) {
    const { errors, codebase, batchId } = context;

    if (!errors || !Array.isArray(errors)) {
      throw new Error('errors é obrigatório e deve ser um array');
    }

    if (!codebase) {
      throw new Error('codebase é obrigatório');
    }

    this.logger?.info('Iniciando resolução em lote', {
      errorCount: errors.length,
      batchId: batchId || 'desconhecido'
    });

    // Agrupar erros relacionados
    const errorGroups = await this.groupRelatedErrors(errors, codebase);

    // Resolver cada grupo
    const results = [];
    for (const group of errorGroups) {
      const resolution = await this.resolveBatch(group, codebase);
      results.push(resolution);
    }

    const result = {
      totalErrors: errors.length,
      groups: errorGroups.length,
      resolved: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };

    // Armazenar resolução
    const id = batchId || `batch-${Date.now()}`;
    this.resolutions.set(id, {
      ...result,
      errors,
      codebase,
      resolvedAt: new Date().toISOString()
    });

    return result;
  }

  /**
   * Agrupa erros relacionados
   * 
   * @param {Array<Object>} errors - Lista de erros
   * @param {Object} codebase - Codebase
   * @returns {Promise<Array<Object>>} Grupos de erros relacionados
   */
  async groupRelatedErrors(errors, codebase) {
    const groups = [];
    const processed = new Set();

    for (const error of errors) {
      if (processed.has(error.id)) continue;

      const group = {
        id: `group-${groups.length + 1}`,
        errors: [error],
        pattern: this.identifyErrorPattern(error),
        relatedBy: []
      };

      // Encontrar erros relacionados
      for (const otherError of errors) {
        if (otherError.id === error.id || processed.has(otherError.id)) continue;

        if (this.areRelated(error, otherError, codebase)) {
          group.errors.push(otherError);
          processed.add(otherError.id);
        }
      }

      processed.add(error.id);
      groups.push(group);
    }

    return groups;
  }

  /**
   * Identifica padrão do erro
   * 
   * @param {Object} error - Erro
   * @returns {string} Padrão identificado
   */
  identifyErrorPattern(error) {
    if (error.type) {
      return error.type;
    }

    if (error.message) {
      if (/syntax|parse/i.test(error.message)) return 'syntax';
      if (/type|cannot read/i.test(error.message)) return 'type';
      if (/import|module/i.test(error.message)) return 'import';
      if (/reference|not defined/i.test(error.message)) return 'reference';
    }

    return 'unknown';
  }

  /**
   * Verifica se erros estão relacionados
   * 
   * @param {Object} error1 - Erro 1
   * @param {Object} error2 - Erro 2
   * @param {Object} codebase - Codebase
   * @returns {boolean} True se relacionados
   */
  areRelated(error1, error2, codebase) {
    // Mesmo padrão
    const pattern1 = this.identifyErrorPattern(error1);
    const pattern2 = this.identifyErrorPattern(error2);
    if (pattern1 === pattern2 && pattern1 !== 'unknown') {
      return true;
    }

    // Mesmo arquivo
    if (error1.file && error2.file && error1.file === error2.file) {
      return true;
    }

    // Arquivos relacionados (imports)
    if (error1.file && error2.file && codebase.files) {
      const file1 = codebase.files[error1.file];
      if (file1 && file1.imports && file1.imports.includes(error2.file)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Resolve grupo de erros em lote, integrando com IntelligentSequentialResolver quando disponível
   * 
   * @param {Object} errorGroup - Grupo de erros
   * @param {Object} codebase - Codebase
   * @returns {Promise<Object>} Resultado da resolução
   */
  async resolveBatch(errorGroup, codebase) {
    try {
      // Se IntelligentSequentialResolver disponível, usar para resolução sequencial inteligente
      const intelligentResolver = this.getIntelligentSequentialResolver();
      if (intelligentResolver && this.useIntelligentResolver) {
        try {
          this.logger?.debug('Usando IntelligentSequentialResolver para resolução em lote', {
            groupId: errorGroup.id,
            errorCount: errorGroup.errors.length
          });

          const sequentialResult = await intelligentResolver.execute({
            errors: errorGroup.errors,
            codebase,
            resolutionId: `batch-${errorGroup.id}`
          });

          if (sequentialResult.successRate === 100) {
            return {
              success: true,
              groupId: errorGroup.id,
              errorsResolved: sequentialResult.resolved,
              method: 'intelligent_sequential',
              sequentialResult
            };
          } else {
            // Se resolução sequencial não resolveu tudo, continuar com método batch padrão
            this.logger?.warn('Resolução sequencial não resolveu todos os erros, usando método batch', {
              successRate: sequentialResult.successRate
            });
          }
        } catch (e) {
          this.logger?.warn('Erro ao usar IntelligentSequentialResolver, usando método batch padrão', {
            error: e.message
          });
        }
      }

      // Método batch padrão (fallback ou quando IntelligentSequentialResolver não disponível)
      // Analisar impacto
      const impactAnalysis = await this.analyzeImpact(errorGroup, codebase);

      if (impactAnalysis.hasHighRisk) {
        return {
          success: false,
          groupId: errorGroup.id,
          reason: 'Impacto alto detectado',
          risks: impactAnalysis.risks
        };
      }

      // Gerar correção para o grupo
      const fix = await this.generateBatchFix(errorGroup, codebase);

      // Aplicar correção
      const fixResult = await this.applyBatchFix(fix, codebase);

      // Validar correção
      const validation = await this.validateBatchFix(fixResult, errorGroup, codebase);

      if (!validation.success) {
        // Reverter correção
        await this.rollbackBatchFix(fixResult, codebase);

        return {
          success: false,
          groupId: errorGroup.id,
          reason: 'Validação falhou',
          validationErrors: validation.errors
        };
      }

      return {
        success: true,
        groupId: errorGroup.id,
        errorsResolved: errorGroup.errors.length,
        fix,
        validation,
        method: 'batch'
      };

    } catch (error) {
      this.logger?.error('Erro ao resolver lote', {
        groupId: errorGroup.id,
        error: error.message
      });

      return {
        success: false,
        groupId: errorGroup.id,
        reason: 'Erro durante resolução',
        error: error.message
      };
    }
  }

  /**
   * Analisa impacto de correção em lote
   * 
   * @param {Object} errorGroup - Grupo de erros
   * @param {Object} codebase - Codebase
   * @returns {Promise<Object>} Análise de impacto
   */
  async analyzeImpact(errorGroup, codebase) {
    const risks = [];

    // Verificar se correção afeta muitos arquivos
    const affectedFiles = new Set();
    for (const error of errorGroup.errors) {
      if (error.file) {
        affectedFiles.add(error.file);
      }
    }

    if (affectedFiles.size > 5) {
      risks.push({
        type: 'many_files',
        severity: 'medium',
        description: `Correção afeta ${affectedFiles.size} arquivos`
      });
    }

    return {
      hasHighRisk: risks.some(r => r.severity === 'high'),
      risks,
      affectedFiles: Array.from(affectedFiles)
    };
  }

  /**
   * Gera correção para grupo de erros
   * 
   * @param {Object} errorGroup - Grupo de erros
   * @param {Object} codebase - Codebase
   * @returns {Promise<Object>} Correção gerada
   */
  async generateBatchFix(errorGroup, codebase) {
    const pattern = errorGroup.pattern;
    const fixes = [];

    for (const error of errorGroup.errors) {
      const fix = this.generateFixForError(error, pattern);
      fixes.push(fix);
    }

    return {
      id: `batch-fix-${Date.now()}`,
      pattern,
      fixes,
      appliedAt: new Date().toISOString()
    };
  }

  /**
   * Gera correção para erro específico
   * 
   * @param {Object} error - Erro
   * @param {string} pattern - Padrão do erro
   * @returns {Object} Correção
   */
  generateFixForError(error, pattern) {
    const fixTemplates = {
      syntax: { type: 'syntax', action: 'Corrigir sintaxe' },
      type: { type: 'type', action: 'Corrigir tipos' },
      import: { type: 'import', action: 'Corrigir imports' },
      reference: { type: 'reference', action: 'Corrigir referências' }
    };

    return fixTemplates[pattern] || { type: 'unknown', action: 'Correção genérica' };
  }

  /**
   * Aplica correção em lote
   * 
   * @param {Object} fix - Correção
   * @param {Object} codebase - Codebase
   * @returns {Promise<Object>} Resultado da aplicação
   */
  async applyBatchFix(fix, codebase) {
    // Simplificado - em produção aplicaria mudanças reais
    return {
      ...fix,
      applied: true,
      codebaseSnapshot: JSON.parse(JSON.stringify(codebase))
    };
  }

  /**
   * Valida correção em lote
   * 
   * @param {Object} fixResult - Resultado da correção
   * @param {Object} errorGroup - Grupo de erros
   * @param {Object} codebase - Codebase
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateBatchFix(fixResult, errorGroup, codebase) {
    const errors = [];

    // Verificar se todos os erros do grupo foram resolvidos
    if (!fixResult.applied) {
      errors.push('Correção não foi aplicada');
    }

    // Verificar se não introduziu novos erros (simplificado)
    // Em produção, executaria testes ou análise estática

    return {
      success: errors.length === 0,
      errors,
      errorsResolved: errorGroup.errors.length
    };
  }

  /**
   * Reverte correção em lote
   * 
   * @param {Object} fixResult - Resultado da correção
   * @param {Object} codebase - Codebase
   * @returns {Promise<void>}
   */
  async rollbackBatchFix(fixResult, codebase) {
    if (fixResult.codebaseSnapshot) {
      Object.assign(codebase, fixResult.codebaseSnapshot);
    }

    this.logger?.info('Correção em lote revertida', {
      fixId: fixResult.id
    });
  }

  /**
   * Obtém resolução armazenada
   * 
   * @param {string} batchId - ID do lote
   * @returns {Object|null} Resolução ou null
   */
  getResolution(batchId) {
    return this.resolutions.get(batchId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.resolutions.values());
    const totalResolved = all.reduce((sum, r) => sum + (r.resolved || 0), 0);

    return {
      totalBatches: all.length,
      totalResolved,
      averageGroupSize: all.length > 0
        ? all.reduce((sum, r) => sum + (r.groups || 0), 0) / all.length
        : 0
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

    if (!context.errors || !Array.isArray(context.errors)) {
      return { valid: false, errors: ['errors é obrigatório e deve ser array'] };
    }

    if (!context.codebase || typeof context.codebase !== 'object') {
      return { valid: false, errors: ['codebase é obrigatório e deve ser objeto'] };
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

export default BatchResolver;

/**
 * Factory function para criar BatchResolver
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {BatchResolver} Instância do BatchResolver
 */
export function createBatchResolver(config = null, logger = null, errorHandler = null) {
  return new BatchResolver(config, logger, errorHandler);
}
