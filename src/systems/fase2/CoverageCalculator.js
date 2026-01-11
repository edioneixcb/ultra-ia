/**
 * CoverageCalculator - Sistema de Cálculo de Cobertura Matemática
 * 
 * Calcula cobertura formal de classes de falha.
 * 
 * Funcionalidades:
 * - Universo de Falhas (definir conjunto U de todas as classes de falha possíveis)
 * - Cálculo de Cobertura (calcular D(C, Tk) para cada alvo, D_total como união)
 * - Validação de Cobertura (verificar critérios de aceite: 95% mínimo, 90% por alvo)
 * 
 * Métricas de Sucesso:
 * - 100% das coberturas calculadas corretamente
 * - 100% das validações de critérios executadas
 * - 100% dos alvos com cobertura mínima validada
 */

import BaseSystem from '../../core/BaseSystem.js';

class CoverageCalculator extends BaseSystem {
  async onInitialize() {
    this.calculations = new Map();
    this.universeOfFailures = new Set(); // U = {F₁, F₂, ..., Fₙ}
    this.checkToFailures = new Map(); // Cⱼ → {Fᵢ, Fⱼ, ...}
    this.logger?.info('CoverageCalculator inicializado');
  }

  /**
   * Calcula cobertura
   * 
   * @param {Object} context - Contexto com targets e checks
   * @returns {Promise<Object>} Cobertura calculada
   */
  async onExecute(context) {
    const { targets, checks, calculationId } = context;

    if (!targets || !Array.isArray(targets)) {
      throw new Error('targets é obrigatório e deve ser um array');
    }

    if (!checks || !Array.isArray(checks)) {
      throw new Error('checks é obrigatório e deve ser um array');
    }

    this.logger?.info('Calculando cobertura', {
      targetCount: targets.length,
      checkCount: checks.length,
      calculationId: calculationId || 'desconhecido'
    });

    // Definir universo de falhas se não definido
    if (this.universeOfFailures.size === 0) {
      await this.defineUniverseOfFailures(checks);
    }

    // Mapear checks para falhas se não mapeado
    if (this.checkToFailures.size === 0) {
      await this.mapChecksToFailures(checks);
    }

    // Calcular cobertura para cada alvo
    const targetCoverages = [];
    for (const target of targets) {
      const applicableChecks = checks.filter(c => 
        !c.target || c.target === target || (Array.isArray(c.target) && c.target.includes(target))
      );

      const coverage = await this.calculateCoverageForTarget(target, applicableChecks);
      targetCoverages.push(coverage);
    }

    // Calcular cobertura total
    const totalCoverage = await this.calculateTotalCoverage(targetCoverages);

    // Validar cobertura
    const validation = await this.validateCoverage(targetCoverages, totalCoverage);

    const result = {
      targets: targetCoverages,
      total: totalCoverage,
      validation
    };

    // Armazenar cálculo
    const id = calculationId || `calculation-${Date.now()}`;
    this.calculations.set(id, {
      ...result,
      targets,
      checks,
      calculatedAt: new Date().toISOString()
    });

    return result;
  }

  /**
   * Define universo de falhas
   * 
   * @param {Array<Object>} checks - Lista de checks
   * @returns {Promise<void>}
   */
  async defineUniverseOfFailures(checks) {
    // Extrair classes de falha dos checks
    const failures = new Set();

    for (const check of checks) {
      if (check.failures && Array.isArray(check.failures)) {
        check.failures.forEach(f => failures.add(f));
      } else if (check.failureClass) {
        failures.add(check.failureClass);
      } else {
        // Inferir classe de falha do tipo de check
        const inferred = this.inferFailureClass(check);
        if (inferred) {
          failures.add(inferred);
        }
      }
    }

    this.universeOfFailures = failures;
    this.logger?.info('Universo de falhas definido', {
      size: failures.size
    });
  }

  /**
   * Infere classe de falha do check
   * 
   * @param {Object} check - Check
   * @returns {string|null} Classe de falha inferida
   */
  inferFailureClass(check) {
    if (check.type) {
      return `failure_${check.type}`;
    }

    if (check.name) {
      return `failure_${check.name.toLowerCase().replace(/\s+/g, '_')}`;
    }

    return null;
  }

  /**
   * Mapeia checks para falhas
   * 
   * @param {Array<Object>} checks - Lista de checks
   * @returns {Promise<void>}
   */
  async mapChecksToFailures(checks) {
    for (const check of checks) {
      const failures = [];

      if (check.failures && Array.isArray(check.failures)) {
        failures.push(...check.failures);
      } else if (check.failureClass) {
        failures.push(check.failureClass);
      } else {
        const inferred = this.inferFailureClass(check);
        if (inferred) {
          failures.push(inferred);
        }
      }

      if (failures.length > 0) {
        this.checkToFailures.set(check.id || check.name, failures);
      }
    }
  }

  /**
   * Calcula cobertura para um alvo
   * 
   * @param {string} target - Alvo
   * @param {Array<Object>} applicableChecks - Checks aplicáveis
   * @returns {Promise<Object>} Cobertura do alvo
   */
  async calculateCoverageForTarget(target, applicableChecks) {
    const coveredFailures = new Set();

    for (const check of applicableChecks) {
      const failures = this.checkToFailures.get(check.id || check.name) || [];
      failures.forEach(f => coveredFailures.add(f));
    }

    const totalFailures = this.universeOfFailures.size;
    const percentage = totalFailures > 0
      ? (coveredFailures.size / totalFailures) * 100
      : 0;

    return {
      target,
      coverage: coveredFailures.size,
      totalFailures,
      percentage: Math.round(percentage * 100) / 100,
      coveredFailures: Array.from(coveredFailures),
      applicableChecks: applicableChecks.length
    };
  }

  /**
   * Calcula cobertura total (união de todos os alvos)
   * 
   * @param {Array<Object>} targetCoverages - Coberturas por alvo
   * @returns {Promise<Object>} Cobertura total
   */
  async calculateTotalCoverage(targetCoverages) {
    const totalCovered = new Set();

    for (const targetCoverage of targetCoverages) {
      targetCoverage.coveredFailures.forEach(f => totalCovered.add(f));
    }

    const totalFailures = this.universeOfFailures.size;
    const percentage = totalFailures > 0
      ? (totalCovered.size / totalFailures) * 100
      : 0;

    return {
      totalCovered: totalCovered.size,
      totalFailures,
      percentage: Math.round(percentage * 100) / 100,
      meetsMinimum: percentage >= 95
    };
  }

  /**
   * Valida cobertura
   * 
   * @param {Array<Object>} targetCoverages - Coberturas por alvo
   * @param {Object} totalCoverage - Cobertura total
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateCoverage(targetCoverages, totalCoverage) {
    const errors = [];
    const warnings = [];

    // Validar cobertura total mínima (95%)
    if (!totalCoverage.meetsMinimum) {
      errors.push({
        type: 'total_coverage_below_minimum',
        message: `Cobertura total ${totalCoverage.percentage.toFixed(2)}% está abaixo do mínimo de 95%`,
        actual: totalCoverage.percentage,
        required: 95
      });
    }

    // Validar cobertura por alvo (90% mínimo)
    const targetsBelow90 = targetCoverages.filter(t => t.percentage < 90);
    if (targetsBelow90.length > 0) {
      errors.push({
        type: 'target_coverage_below_minimum',
        message: `Alvos com cobertura abaixo de 90%: ${targetsBelow90.map(t => t.target).join(', ')}`,
        targets: targetsBelow90.map(t => ({
          target: t.target,
          percentage: t.percentage
        }))
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      totalCoverage: totalCoverage.percentage,
      meetsMinimum: totalCoverage.meetsMinimum,
      allTargetsMeetMinimum: targetsBelow90.length === 0
    };
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
    const averageCoverage = all.length > 0
      ? all.reduce((sum, c) => sum + (c.total?.percentage || 0), 0) / all.length
      : 0;

    return {
      totalCalculations: all.length,
      averageCoverage: Math.round(averageCoverage * 100) / 100,
      universeSize: this.universeOfFailures.size,
      checksMapped: this.checkToFailures.size
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

    if (!context.targets || !Array.isArray(context.targets)) {
      return { valid: false, errors: ['targets é obrigatório e deve ser array'] };
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

export default CoverageCalculator;

/**
 * Factory function para criar CoverageCalculator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {CoverageCalculator} Instância do CoverageCalculator
 */
export function createCoverageCalculator(config = null, logger = null, errorHandler = null) {
  return new CoverageCalculator(config, logger, errorHandler);
}
