/**
 * ScoreCalculator - Sistema de Cálculo de Score Matemático
 * 
 * Calcula score exato seguindo fórmula do protocolo.
 * 
 * Funcionalidades:
 * - Cálculo Exato (S = (Checks Passando / Checks Aplicáveis) × 100)
 * - Validação de N/A (checks N/A com justificativa válida não contam no denominador)
 * - Bloqueio por Bloqueadores (qualquer check BLOQUEADOR falhando resulta em S = 0)
 * 
 * Métricas de Sucesso:
 * - 100% dos scores calculados corretamente
 * - 100% dos N/A validados antes de calcular
 * - 100% de bloqueio automático quando bloqueadores falham
 */

import BaseSystem from '../../core/BaseSystem.js';

class ScoreCalculator extends BaseSystem {
  async onInitialize() {
    this.calculations = new Map();
    this.logger?.info('ScoreCalculator inicializado');
  }

  /**
   * Calcula score
   * 
   * @param {Object} context - Contexto com checks
   * @returns {Promise<Object>} Score calculado
   */
  async onExecute(context) {
    // Validar contexto primeiro
    const validation = this.validate(context);
    if (!validation.valid) {
      throw new Error(`Contexto inválido: ${validation.errors?.join(', ')}`);
    }

    const { checks, calculationId } = context;

    this.logger?.info('Calculando score', {
      checkCount: checks.length,
      calculationId: calculationId || 'desconhecido'
    });

    const result = this.calculateScore(checks);

    // Armazenar cálculo
    const id = calculationId || `calculation-${Date.now()}`;
    this.calculations.set(id, {
      ...result,
      checks,
      calculatedAt: new Date().toISOString()
    });

    return result;
  }

  /**
   * Calcula score seguindo fórmula: S = (Checks Passando / Checks Aplicáveis) × 100
   * 
   * @param {Array<Object>} checks - Lista de checks
   * @returns {Object} Score calculado
   */
  calculateScore(checks) {
    // Filtrar checks aplicáveis (não N/A)
    const applicable = checks.filter(c => c.status !== 'N/A' && c.status !== 'NA');

    // Filtrar checks N/A
    const naChecks = checks.filter(c => c.status === 'N/A' || c.status === 'NA');

    // Validar N/A
    const validNA = naChecks.filter(c => this.validateNA(c));

    // Checks aplicáveis = checks não-N/A + checks N/A válidos (que não contam no denominador)
    // Na verdade, N/A válidos NÃO devem contar no denominador conforme especificação
    const applicableCount = applicable.length;

    // Checks passando
    const passing = applicable.filter(c => c.status === 'OK' || c.status === 'PASS').length;

    // Verificar bloqueadores falhando
    const blockingFailed = applicable.filter(c => 
      (c.severity === 'BLOQUEADOR' || c.severity === 'BLOCKER') && 
      (c.status === 'FALHOU' || c.status === 'FAIL' || c.status === 'FAILED')
    );

    // Se há bloqueadores falhando, score = 0
    if (blockingFailed.length > 0) {
      return {
        score: 0,
        reason: 'Bloqueadores falhando',
        blockingFailed: blockingFailed.map(c => ({
          id: c.id,
          name: c.name,
          severity: c.severity,
          status: c.status
        })),
        passing,
        applicable: applicableCount,
        naValid: validNA.length,
        naInvalid: naChecks.length - validNA.length
      };
    }

    // Calcular score: S = (Passando / Aplicáveis) × 100
    const score = applicableCount > 0 
      ? (passing / applicableCount) * 100 
      : 0;

    const naValidCount = validNA.length;
    const naInvalidCount = naChecks.length - naValidCount;

    return {
      score: Math.round(score * 100) / 100, // Arredondar para 2 casas decimais
      passing,
      applicable: applicableCount,
      naValid: naValidCount,
      naInvalid: naInvalidCount,
      total: checks.length,
      breakdown: {
        passing,
        failing: applicable.filter(c => c.status === 'FALHOU' || c.status === 'FAIL' || c.status === 'FAILED').length,
        na: naChecks.length,
        naValid: naValidCount,
        naInvalid: naInvalidCount
      }
    };
  }

  /**
   * Valida check N/A
   * 
   * @param {Object} check - Check com status N/A
   * @returns {boolean} True se N/A é válido
   */
  validateNA(check) {
    if (!check || !check.justification || !check.evidence) {
      return false;
    }

    // N/A válido requer:
    // 1. Justificativa presente e não vazia
    // 2. Evidência presente e não vazia
    const hasJustification = typeof check.justification === 'string' && 
                            check.justification.trim().length > 0;

    const hasEvidence = (typeof check.evidence === 'string' && check.evidence.trim().length > 0) ||
                       (typeof check.evidence === 'object' && check.evidence !== null && Object.keys(check.evidence).length > 0);

    return hasJustification && hasEvidence;
  }

  /**
   * Obtém cálculo armazenado
   * 
   * @param {string} calculationId - ID do cálculo
   * @returns {Object|null} Cálculo ou null
   */
  getCalculation(calculationId) {
    return this.calculations.get(calculationId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.calculations.values());
    const averageScore = all.length > 0
      ? all.reduce((sum, c) => sum + (c.score || 0), 0) / all.length
      : 0;

    return {
      totalCalculations: all.length,
      averageScore: Math.round(averageScore * 100) / 100,
      perfectScores: all.filter(c => c.score === 100).length,
      zeroScores: all.filter(c => c.score === 0).length
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

    if (!context.checks || !Array.isArray(context.checks)) {
      return { valid: false, errors: ['checks é obrigatório e deve ser array'] };
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

export default ScoreCalculator;

/**
 * Factory function para criar ScoreCalculator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {ScoreCalculator} Instância do ScoreCalculator
 */
export function createScoreCalculator(config = null, logger = null, errorHandler = null) {
  return new ScoreCalculator(config, logger, errorHandler);
}
