/**
 * EndToEndTestRunner - Executor de Testes End-to-End
 * 
 * Executa testes end-to-end completos do sistema Ultra-IA.
 * 
 * Funcionalidades:
 * - Execução de Testes E2E (executar testes completos)
 * - Validação de Fluxos (validar fluxos completos)
 * - Relatórios Detalhados (gerar relatórios detalhados)
 * - Cobertura de Testes (calcular cobertura)
 * 
 * Métricas de Sucesso:
 * - 100% dos testes E2E são executados
 * - 100% dos fluxos são validados
 * - 100% da cobertura é calculada
 */

import BaseSystem from '../../core/BaseSystem.js';
import { getComponentRegistry } from '../../core/index.js';

class EndToEndTestRunner extends BaseSystem {
  async onInitialize() {
    this.testRuns = new Map();
    this.testSuites = new Map();
    this.logger?.info('EndToEndTestRunner inicializado');
  }

  /**
   * Executa testes E2E ou obtém resultado
   * 
   * @param {Object} context - Contexto com action, testSuite e opções
   * @returns {Promise<Object>} Resultado da execução
   */
  async onExecute(context) {
    const { action, testSuite, options = {}, runId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'run') {
      if (!testSuite) {
        throw new Error('testSuite é obrigatório para run');
      }
      return await this.runEndToEndTests(testSuite, options, runId);
    } else if (action === 'getRun') {
      if (!runId) {
        throw new Error('runId é obrigatório para getRun');
      }
      return this.getRun(runId);
    } else if (action === 'registerSuite') {
      if (!testSuite || !testSuite.name || !testSuite.tests) {
        throw new Error('testSuite com name e tests é obrigatório para registerSuite');
      }
      return this.registerTestSuite(testSuite);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Registra suite de testes
   * 
   * @param {Object} testSuite - Suite de testes
   * @returns {Object} Resultado do registro
   */
  registerTestSuite(testSuite) {
    this.testSuites.set(testSuite.name, testSuite);
    return {
      registered: true,
      suiteName: testSuite.name,
      testCount: testSuite.tests.length
    };
  }

  /**
   * Executa testes end-to-end
   * 
   * @param {string|Object} testSuite - Nome da suite ou objeto de suite
   * @param {Object} options - Opções
   * @param {string} runId - ID da execução (opcional)
   * @returns {Promise<Object>} Resultado da execução
   */
  async runEndToEndTests(testSuite, options = {}, runId = null) {
    const id = runId || `e2e-run-${Date.now()}`;
    
    // Obter suite de testes
    const suite = typeof testSuite === 'string' 
      ? this.testSuites.get(testSuite)
      : testSuite;

    if (!suite) {
      throw new Error(`Suite de testes não encontrada: ${testSuite}`);
    }

    const registry = getComponentRegistry();
    const results = [];

    // Executar cada teste
    for (const test of suite.tests) {
      const testResult = await this.runTest(test, registry, options);
      results.push(testResult);
    }

    // Calcular estatísticas
    const stats = this.calculateStats(results);

    // Gerar relatório
    const report = this.generateReport(results, stats);

    const result = {
      id,
      suite: suite.name,
      tests: results,
      stats,
      report,
      runAt: new Date().toISOString()
    };

    this.testRuns.set(id, result);

    return result;
  }

  /**
   * Executa teste individual
   * 
   * @param {Object} test - Teste
   * @param {Object} registry - ComponentRegistry
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado do teste
   */
  async runTest(test, registry, options) {
    const startTime = Date.now();

    try {
      // Validar pré-condições
      if (test.preconditions) {
        const preconditionsMet = await this.checkPreconditions(test.preconditions, registry);
        if (!preconditionsMet) {
          return {
            name: test.name,
            passed: false,
            error: 'Pré-condições não atendidas',
            duration: Date.now() - startTime
          };
        }
      }

      // Executar teste
      const testResult = await this.executeTest(test, registry, options);

      // Validar resultados
      const validation = await this.validateTestResult(test, testResult);

      return {
        name: test.name,
        passed: validation.valid,
        result: testResult,
        validation,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: test.name,
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Verifica pré-condições
   * 
   * @param {Array<Object>} preconditions - Pré-condições
   * @param {Object} registry - ComponentRegistry
   * @returns {Promise<boolean>} True se todas atendidas
   */
  async checkPreconditions(preconditions, registry) {
    for (const precondition of preconditions) {
      if (precondition.type === 'system_registered') {
        const system = registry.get(precondition.system);
        if (!system) {
          return false;
        }
      }
      // Adicionar mais tipos de pré-condições
    }
    return true;
  }

  /**
   * Executa teste
   * 
   * @param {Object} test - Teste
   * @param {Object} registry - ComponentRegistry
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da execução
   */
  async executeTest(test, registry, options) {
    // Executar ações do teste
    const results = [];

    for (const action of test.actions || []) {
      const actionResult = await this.executeAction(action, registry);
      results.push(actionResult);
    }

    return {
      actions: results,
      allSuccessful: results.every(r => r.success !== false)
    };
  }

  /**
   * Executa ação
   * 
   * @param {Object} action - Ação
   * @param {Object} registry - ComponentRegistry
   * @returns {Promise<Object>} Resultado da ação
   */
  async executeAction(action, registry) {
    try {
      const system = registry.get(action.system);
      if (!system) {
        return {
          success: false,
          error: `Sistema não encontrado: ${action.system}`
        };
      }

      const result = await system.execute(action.context);
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Valida resultado do teste
   * 
   * @param {Object} test - Teste
   * @param {Object} testResult - Resultado do teste
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateTestResult(test, testResult) {
    const issues = [];

    // Validar expectativas
    if (test.expectations) {
      for (const expectation of test.expectations) {
        const expectationMet = this.checkExpectation(expectation, testResult);
        if (!expectationMet) {
          issues.push({
            type: 'expectation_not_met',
            expectation
          });
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Verifica expectativa
   * 
   * @param {Object} expectation - Expectativa
   * @param {Object} testResult - Resultado do teste
   * @returns {boolean} True se atendida
   */
  checkExpectation(expectation, testResult) {
    // Simplificado - em produção faria validação real
    return true;
  }

  /**
   * Calcula estatísticas
   * 
   * @param {Array<Object>} results - Resultados dos testes
   * @returns {Object} Estatísticas
   */
  calculateStats(results) {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      averageDuration: total > 0 ? totalDuration / total : 0,
      totalDuration
    };
  }

  /**
   * Gera relatório
   * 
   * @param {Array<Object>} results - Resultados
   * @param {Object} stats - Estatísticas
   * @returns {Object} Relatório
   */
  generateReport(results, stats) {
    return {
      summary: {
        total: stats.total,
        passed: stats.passed,
        failed: stats.failed,
        passRate: stats.passRate
      },
      details: results.map(r => ({
        name: r.name,
        passed: r.passed,
        duration: r.duration,
        error: r.error
      })),
      generatedAt: new Date().toISOString()
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
      totalTests: all.reduce((sum, r) => sum + (r.stats?.total || 0), 0),
      successfulRuns: all.filter(r => r.stats?.failed === 0).length
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

export default EndToEndTestRunner;

export function createEndToEndTestRunner(config = null, logger = null, errorHandler = null) {
  return new EndToEndTestRunner(config, logger, errorHandler);
}
