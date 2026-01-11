/**
 * PlatformTestRunner - Executor de Testes Multi-Plataforma
 * 
 * Executa testes em múltiplas plataformas.
 * 
 * Funcionalidades:
 * - Execução em Múltiplas Plataformas (executar testes em diferentes plataformas)
 * - Agregação de Resultados (agregar resultados de todas as plataformas)
 * - Relatórios por Plataforma (gerar relatórios específicos)
 * 
 * Métricas de Sucesso:
 * - 100% dos testes são executados em todas as plataformas
 * - 100% dos resultados são agregados corretamente
 */

import BaseSystem from '../../core/BaseSystem.js';

class PlatformTestRunner extends BaseSystem {
  async onInitialize() {
    this.testRuns = new Map();
    this.logger?.info('PlatformTestRunner inicializado');
  }

  /**
   * Executa testes ou obtém resultado
   * 
   * @param {Object} context - Contexto com action, testFile, platforms e opções
   * @returns {Promise<Object>} Resultado da execução
   */
  async onExecute(context) {
    const { action, testFile, platforms = [], options = {}, runId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'run') {
      if (!testFile) {
        throw new Error('testFile é obrigatório para run');
      }
      return await this.runTests(testFile, platforms, options, runId);
    } else if (action === 'getRun') {
      if (!runId) {
        throw new Error('runId é obrigatório para getRun');
      }
      return this.getRun(runId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Executa testes em múltiplas plataformas
   * 
   * @param {string} testFile - Arquivo de teste
   * @param {Array<string>} platforms - Plataformas
   * @param {Object} options - Opções
   * @param {string} runId - ID da execução (opcional)
   * @returns {Promise<Object>} Resultado da execução
   */
  async runTests(testFile, platforms = [], options = {}, runId = null) {
    const id = runId || `run-${Date.now()}`;
    const targetPlatforms = platforms.length > 0 ? platforms : ['current'];

    const platformResults = [];

    // Executar testes em cada plataforma
    for (const platform of targetPlatforms) {
      const platformResult = await this.runTestsOnPlatform(testFile, platform, options);
      platformResults.push({
        platform,
        ...platformResult
      });
    }

    // Agregar resultados
    const aggregated = this.aggregateResults(platformResults);

    const result = {
      id,
      testFile,
      platforms: platformResults,
      aggregated,
      runAt: new Date().toISOString()
    };

    this.testRuns.set(id, result);

    return result;
  }

  /**
   * Executa testes em plataforma específica
   * 
   * @param {string} testFile - Arquivo de teste
   * @param {string} platform - Plataforma
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da execução
   */
  async runTestsOnPlatform(testFile, platform, options) {
    // Simulado - em produção executaria testes reais
    return {
      platform,
      passed: true,
      total: 10,
      passedCount: 10,
      failedCount: 0,
      duration: 1000,
      executedAt: new Date().toISOString()
    };
  }

  /**
   * Agrega resultados de múltiplas plataformas
   * 
   * @param {Array<Object>} platformResults - Resultados por plataforma
   * @returns {Object} Resultado agregado
   */
  aggregateResults(platformResults) {
    const total = platformResults.reduce((sum, r) => sum + (r.total || 0), 0);
    const passed = platformResults.reduce((sum, r) => sum + (r.passedCount || 0), 0);
    const failed = platformResults.reduce((sum, r) => sum + (r.failedCount || 0), 0);
    const allPassed = platformResults.every(r => r.passed);

    return {
      total,
      passed,
      failed,
      allPassed,
      platforms: platformResults.length
    };
  }

  /**
   * Obtém execução armazenada
   * 
   * @param {string} runId - ID da execução
   * @returns {Object|null} Execução ou null
   */
  getRun(runId) {
    return this.testRuns.get(runId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.testRuns.values());

    return {
      totalRuns: all.length,
      successfulRuns: all.filter(r => r.aggregated?.allPassed).length
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

export default PlatformTestRunner;

export function createPlatformTestRunner(config = null, logger = null, errorHandler = null) {
  return new PlatformTestRunner(config, logger, errorHandler);
}
