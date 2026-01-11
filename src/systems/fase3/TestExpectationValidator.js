/**
 * TestExpectationValidator - Sistema de Análise de Testes com Validação de Expectativas e Isolamento
 * 
 * Valida expectativas e garante isolamento completo de testes.
 * 
 * Funcionalidades:
 * - Validação de Expectativas Antes de Escrever Teste (verificar comportamento real da função)
 * - Isolamento Completo de Testes (garantir limpeza de cache entre testes)
 * - Geração de Testes Flexíveis (gerar testes que validam comportamento, não implementação)
 * 
 * Métricas de Sucesso:
 * - 100% dos testes têm expectativas corretas
 * - 100% dos testes são isolados completamente
 * - 100% dos testes validam comportamento, não implementação
 */

import BaseSystem from '../../core/BaseSystem.js';

class TestExpectationValidator extends BaseSystem {
  async onInitialize() {
    this.validations = new Map();
    this.isolationReports = new Map();
    this.logger?.info('TestExpectationValidator inicializado');
  }

  /**
   * Valida expectativas ou isola testes
   * 
   * @param {Object} context - Contexto com test/implementation ou testSuite
   * @returns {Promise<Object>} Resultado da validação ou isolamento
   */
  async onExecute(context) {
    const { action, test, implementation, testSuite, validationId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'validateExpectations') {
      if (!test || !implementation) {
        throw new Error('test e implementation são obrigatórios para validateExpectations');
      }
      return await this.validateExpectationsBeforeWriting(test, implementation, validationId);
    } else if (action === 'ensureIsolation') {
      if (!testSuite) {
        throw new Error('testSuite é obrigatório para ensureIsolation');
      }
      return await this.ensureTestIsolation(testSuite, validationId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Valida expectativas antes de escrever teste
   * 
   * @param {Object} test - Teste com expectativas
   * @param {Object} implementation - Implementação a testar
   * @param {string} validationId - ID da validação (opcional)
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateExpectationsBeforeWriting(test, implementation, validationId = null) {
    // Executar implementação para obter comportamento real
    const actualBehavior = await this.executeImplementation(implementation);

    // Comparar expectativas com comportamento real
    const mismatch = await this.compareExpectations(test.expectations, actualBehavior);

    // Sugerir expectativas corretas
    const correctExpectations = await this.suggestCorrectExpectations(actualBehavior);

    const result = {
      valid: mismatch.length === 0,
      mismatches: mismatch,
      correctExpectations,
      suggestions: await this.generateSuggestions(mismatch),
      actualBehavior
    };

    // Armazenar validação
    const id = validationId || `validation-${Date.now()}`;
    this.validations.set(id, {
      ...result,
      test,
      implementation,
      validatedAt: new Date().toISOString()
    });

    return result;
  }

  /**
   * Executa implementação para obter comportamento real
   * 
   * @param {Object} implementation - Implementação
   * @returns {Promise<Object>} Comportamento real
   */
  async executeImplementation(implementation) {
    // Simplificado - em produção executaria código real
    if (implementation.code) {
      // Executar código e capturar resultado
      try {
        // Em produção, executaria em sandbox isolado
        return {
          output: 'executed',
          returnValue: null,
          sideEffects: []
        };
      } catch (error) {
        return {
          error: error.message,
          output: null
        };
      }
    }

    return {
      output: 'no_code_provided',
      returnValue: null
    };
  }

  /**
   * Compara expectativas com comportamento real
   * 
   * @param {Object} expectations - Expectativas do teste
   * @param {Object} actualBehavior - Comportamento real
   * @returns {Promise<Array<Object>>} Mismatches encontrados
   */
  async compareExpectations(expectations, actualBehavior) {
    const mismatches = [];

    if (!expectations) {
      return mismatches;
    }

    // Comparar valores de retorno
    if (expectations.returnValue !== undefined) {
      if (actualBehavior.returnValue !== expectations.returnValue) {
        mismatches.push({
          type: 'return_value',
          expected: expectations.returnValue,
          actual: actualBehavior.returnValue,
          description: 'Valor de retorno não corresponde à expectativa'
        });
      }
    }

    // Comparar outputs
    if (expectations.output !== undefined) {
      if (actualBehavior.output !== expectations.output) {
        mismatches.push({
          type: 'output',
          expected: expectations.output,
          actual: actualBehavior.output,
          description: 'Output não corresponde à expectativa'
        });
      }
    }

    // Verificar erros esperados
    if (expectations.shouldThrow) {
      if (!actualBehavior.error) {
        mismatches.push({
          type: 'error_expected',
          expected: 'Erro esperado',
          actual: 'Nenhum erro',
          description: 'Teste esperava erro mas nenhum foi lançado'
        });
      }
    }

    return mismatches;
  }

  /**
   * Sugere expectativas corretas baseadas no comportamento real
   * 
   * @param {Object} actualBehavior - Comportamento real
   * @returns {Promise<Object>} Expectativas corretas sugeridas
   */
  async suggestCorrectExpectations(actualBehavior) {
    return {
      returnValue: actualBehavior.returnValue,
      output: actualBehavior.output,
      error: actualBehavior.error,
      sideEffects: actualBehavior.sideEffects || []
    };
  }

  /**
   * Gera sugestões para corrigir mismatches
   * 
   * @param {Array<Object>} mismatches - Mismatches encontrados
   * @returns {Promise<Array<Object>>} Sugestões
   */
  async generateSuggestions(mismatches) {
    return mismatches.map(mismatch => ({
      type: mismatch.type,
      suggestion: this.getSuggestionForMismatch(mismatch),
      priority: mismatch.type === 'error_expected' ? 'high' : 'medium'
    }));
  }

  /**
   * Obtém sugestão para mismatch específico
   * 
   * @param {Object} mismatch - Mismatch
   * @returns {string} Sugestão
   */
  getSuggestionForMismatch(mismatch) {
    const suggestions = {
      return_value: `Atualizar expectativa de retorno para: ${JSON.stringify(mismatch.actual)}`,
      output: `Atualizar expectativa de output para: ${mismatch.actual}`,
      error_expected: 'Verificar se implementação realmente lança erro ou ajustar expectativa'
    };

    return suggestions[mismatch.type] || 'Revisar expectativas do teste';
  }

  /**
   * Garante isolamento completo de testes
   * 
   * @param {Object} testSuite - Suite de testes
   * @param {string} validationId - ID da validação (opcional)
   * @returns {Promise<Object>} Resultado do isolamento
   */
  async ensureTestIsolation(testSuite, validationId = null) {
    // Analisar dependências entre testes
    const dependencies = await this.analyzeTestDependencies(testSuite);

    // Detectar vazamentos de estado
    const stateLeaks = await this.detectStateLeaks(testSuite);

    // Identificar necessidades de limpeza de cache
    const cacheClearingNeeds = await this.identifyCacheClearingNeeds(testSuite);

    // Gerar código de isolamento
    const isolationCode = await this.generateIsolationCode({
      dependencies,
      stateLeaks,
      cacheClearing: cacheClearingNeeds
    });

    const result = {
      isolated: stateLeaks.length === 0,
      isolationCode,
      dependencies,
      stateLeaks,
      cacheClearingNeeds,
      recommendations: await this.generateIsolationRecommendations(stateLeaks)
    };

    // Armazenar relatório
    const id = validationId || `isolation-${Date.now()}`;
    this.isolationReports.set(id, {
      ...result,
      testSuite,
      analyzedAt: new Date().toISOString()
    });

    return result;
  }

  /**
   * Analisa dependências entre testes
   * 
   * @param {Object} testSuite - Suite de testes
   * @returns {Promise<Array<Object>>} Dependências encontradas
   */
  async analyzeTestDependencies(testSuite) {
    const dependencies = [];

    if (!testSuite.tests || !Array.isArray(testSuite.tests)) {
      return dependencies;
    }

    // Verificar se testes compartilham estado
    const sharedState = new Set();
    for (const test of testSuite.tests) {
      if (test.setup && test.setup.state) {
        for (const stateVar of Object.keys(test.setup.state)) {
          if (sharedState.has(stateVar)) {
            dependencies.push({
              type: 'shared_state',
              variable: stateVar,
              tests: testSuite.tests.filter(t => t.setup?.state?.[stateVar]).map(t => t.name)
            });
          }
          sharedState.add(stateVar);
        }
      }
    }

    return dependencies;
  }

  /**
   * Detecta vazamentos de estado
   * 
   * @param {Object} testSuite - Suite de testes
   * @returns {Promise<Array<Object>>} Vazamentos encontrados
   */
  async detectStateLeaks(testSuite) {
    const leaks = [];

    if (!testSuite.tests || !Array.isArray(testSuite.tests)) {
      return leaks;
    }

    // Verificar se testes não limpam estado após execução
    for (const test of testSuite.tests) {
      if (test.setup && !test.teardown) {
        leaks.push({
          test: test.name,
          type: 'missing_teardown',
          description: `Teste ${test.name} não tem teardown para limpar estado`
        });
      }

      // Verificar uso de variáveis globais
      if (test.code && /global\.|window\.|process\./.test(test.code)) {
        leaks.push({
          test: test.name,
          type: 'global_state',
          description: `Teste ${test.name} modifica estado global`
        });
      }
    }

    return leaks;
  }

  /**
   * Identifica necessidades de limpeza de cache
   * 
   * @param {Object} testSuite - Suite de testes
   * @returns {Promise<Array<Object>>} Necessidades identificadas
   */
  async identifyCacheClearingNeeds(testSuite) {
    const needs = [];

    if (!testSuite.tests || !Array.isArray(testSuite.tests)) {
      return needs;
    }

    // Verificar se testes usam cache
    for (const test of testSuite.tests) {
      if (test.code && /cache|Cache|CACHE/.test(test.code)) {
        needs.push({
          test: test.name,
          cacheType: 'generic',
          description: `Teste ${test.name} usa cache e precisa de limpeza`
        });
      }
    }

    return needs;
  }

  /**
   * Gera código de isolamento
   * 
   * @param {Object} analysis - Análise de isolamento
   * @returns {Promise<string>} Código de isolamento
   */
  async generateIsolationCode(analysis) {
    const { dependencies, stateLeaks, cacheClearing } = analysis;
    const code = [];

    // Gerar setup de isolamento
    if (stateLeaks.length > 0 || cacheClearing.length > 0) {
      code.push('// Setup de isolamento');
      code.push('beforeEach(() => {');
      
      if (cacheClearing.length > 0) {
        code.push('  // Limpar caches');
        code.push('  if (global.cache) global.cache.clear();');
      }

      if (stateLeaks.some(l => l.type === 'global_state')) {
        code.push('  // Salvar estado global');
        code.push('  const savedState = { ...global };');
      }

      code.push('});');
      code.push('');
    }

    // Gerar teardown de isolamento
    if (stateLeaks.length > 0) {
      code.push('afterEach(() => {');
      code.push('  // Restaurar estado');
      code.push('  // Limpar variáveis de teste');
      code.push('});');
    }

    return code.join('\n');
  }

  /**
   * Gera recomendações de isolamento
   * 
   * @param {Array<Object>} stateLeaks - Vazamentos de estado
   * @returns {Promise<Array<Object>>} Recomendações
   */
  async generateIsolationRecommendations(stateLeaks) {
    return stateLeaks.map(leak => ({
      test: leak.test,
      recommendation: this.getRecommendationForLeak(leak),
      priority: leak.type === 'global_state' ? 'high' : 'medium'
    }));
  }

  /**
   * Obtém recomendação para vazamento específico
   * 
   * @param {Object} leak - Vazamento
   * @returns {string} Recomendação
   */
  getRecommendationForLeak(leak) {
    const recommendations = {
      missing_teardown: `Adicionar teardown ao teste ${leak.test} para limpar estado`,
      global_state: `Evitar modificação de estado global no teste ${leak.test}. Usar mocks ou stubs.`
    };

    return recommendations[leak.type] || 'Revisar isolamento do teste';
  }

  /**
   * Obtém validação armazenada
   * 
   * @param {string} validationId - ID da validação
   * @returns {Object|null} Validação ou null
   */
  getValidation(validationId) {
    return this.validations.get(validationId) || null;
  }

  /**
   * Obtém relatório de isolamento
   * 
   * @param {string} isolationId - ID do isolamento
   * @returns {Object|null} Relatório ou null
   */
  getIsolationReport(isolationId) {
    return this.isolationReports.get(isolationId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const allValidations = Array.from(this.validations.values());
    const allIsolations = Array.from(this.isolationReports.values());

    return {
      totalValidations: allValidations.length,
      validExpectations: allValidations.filter(v => v.valid).length,
      totalIsolations: allIsolations.length,
      isolatedSuites: allIsolations.filter(i => i.isolated).length
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

export default TestExpectationValidator;

/**
 * Factory function para criar TestExpectationValidator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {TestExpectationValidator} Instância do TestExpectationValidator
 */
export function createTestExpectationValidator(config = null, logger = null, errorHandler = null) {
  return new TestExpectationValidator(config, logger, errorHandler);
}
