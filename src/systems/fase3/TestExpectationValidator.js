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
import { getDockerSandbox } from '../../utils/DockerSandbox.js';
import { getCacheManager } from '../../utils/CacheManager.js';

class TestExpectationValidator extends BaseSystem {
  constructor(config = null, logger = null, errorHandler = null, threeERuleValidator = null) {
    super(config, logger, errorHandler);
    this.threeERuleValidator = threeERuleValidator;
    this.dockerSandbox = null; // Lazy loading para evitar dependência circular
    this.useDockerSandbox = config?.features?.useDockerSandbox !== false;
    this.useThreeERule = config?.features?.useThreeERule !== false && threeERuleValidator !== null;
    this.cacheManager = null;
    this.useCache = config?.features?.useCache !== false;
  }

  async onInitialize() {
    this.validations = new Map();
    this.isolationReports = new Map();
    
    // Inicializar DockerSandbox se habilitado (lazy loading)
    if (this.useDockerSandbox) {
      try {
        this.dockerSandbox = getDockerSandbox(this.config, this.logger, this.errorHandler);
        this.logger?.debug('DockerSandbox obtido para TestExpectationValidator');
      } catch (e) {
        this.logger?.warn('DockerSandbox não disponível, usando fallback', { error: e.message });
        this.useDockerSandbox = false;
      }
    }

    // Inicializar cache LRU se habilitado
    if (this.useCache) {
      try {
        this.cacheManager = getCacheManager(this.config, this.logger);
        this.logger?.debug('CacheManager integrado no TestExpectationValidator');
      } catch (e) {
        this.logger?.warn('Erro ao obter CacheManager, continuando sem cache', { error: e.message });
        this.useCache = false;
      }
    }

    this.logger?.info('TestExpectationValidator inicializado', {
      useDockerSandbox: this.useDockerSandbox,
      useThreeERule: this.useThreeERule,
      useCache: this.useCache
    });
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
   * Valida expectativas antes de escrever teste usando DockerSandbox e ThreeERuleValidator quando disponível (com cache)
   * 
   * @param {Object} test - Teste com expectativas
   * @param {Object} implementation - Implementação a testar
   * @param {string} validationId - ID da validação (opcional)
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateExpectationsBeforeWriting(test, implementation, validationId = null) {
    // Verificar cache se habilitado
    if (this.useCache && this.cacheManager) {
      const cacheKey = `testexp:${test.id || test.name || 'default'}:${implementation.code?.substring(0, 50) || 'default'}`;
      const cached = this.cacheManager.get(cacheKey);
      if (cached) {
        this.logger?.debug('Validação de expectativas retornada do cache');
        return cached;
      }
    }

    // Validar regra dos 3E se ThreeERuleValidator disponível
    let threeEValidation = null;
    if (this.useThreeERule && this.threeERuleValidator) {
      try {
        // Criar check temporário para validação 3E
        const check = {
          especificacao: test.description || test.specification || 'Teste de expectativa',
          execucao: test.code || implementation.code || 'Código de teste',
          evidencia: test.expectedOutput || test.evidence || 'Resultado esperado'
        };

        threeEValidation = this.threeERuleValidator.validate(check);
        if (!threeEValidation.valid) {
          this.logger?.warn('Teste não passa na regra dos 3E', {
            missing: threeEValidation.missing
          });
        }
      } catch (e) {
        this.logger?.warn('Erro ao validar regra dos 3E', { error: e.message });
      }
    }

    // Executar implementação para obter comportamento real (usar DockerSandbox se disponível)
    const actualBehavior = await this.executeImplementation(implementation);

    // Comparar expectativas com comportamento real
    const mismatch = await this.compareExpectations(test.expectations, actualBehavior);

    // Sugerir expectativas corretas
    const correctExpectations = await this.suggestCorrectExpectations(actualBehavior);

    const result = {
      valid: mismatch.length === 0 && (threeEValidation === null || threeEValidation.valid),
      mismatches: mismatch,
      correctExpectations,
      suggestions: await this.generateSuggestions(mismatch),
      actualBehavior,
      threeEValidation
    };

    // Adicionar avisos se 3E não válido
    if (threeEValidation && !threeEValidation.valid) {
      result.warnings = result.warnings || [];
      result.warnings.push({
        type: 'three_e_validation_failed',
        message: `Teste não passa na regra dos 3E: faltam ${threeEValidation.missing.join(', ')}`,
        missing: threeEValidation.missing
      });
    }

    // Armazenar validação
    const id = validationId || `validation-${Date.now()}`;
    this.validations.set(id, {
      ...result,
      test,
      implementation,
      validatedAt: new Date().toISOString()
    });

    // Armazenar no cache se habilitado
    if (this.useCache && this.cacheManager) {
      const cacheKey = `testexp:${test.id || test.name || 'default'}:${implementation.code?.substring(0, 50) || 'default'}`;
      this.cacheManager.set(cacheKey, result, 3600000); // Cache por 1 hora
    }

    return result;
  }

  /**
   * Executa implementação para obter comportamento real usando DockerSandbox quando disponível
   * 
   * @param {Object} implementation - Implementação
   * @returns {Promise<Object>} Comportamento real
   */
  async executeImplementation(implementation) {
    if (!implementation || !implementation.code) {
      return {
        output: 'no_code_provided',
        returnValue: null,
        source: 'fallback'
      };
    }

    // Se DockerSandbox disponível, executar em sandbox isolado
    if (this.useDockerSandbox && this.dockerSandbox) {
      try {
        const language = implementation.language || 'javascript';
        const executionResult = await this.dockerSandbox.execute(
          implementation.code,
          language,
          {
            timeout: 5000, // Timeout curto para validação rápida
            expectedOutput: implementation.expectedOutput || null
          }
        );

        const execResult = {
          output: executionResult.stdout || '',
          error: executionResult.stderr || null,
          returnValue: executionResult.exitCode === 0 ? executionResult.stdout : null,
          sideEffects: [],
          success: executionResult.success,
          exitCode: executionResult.exitCode,
          matchesExpected: executionResult.matchesExpected,
          source: 'docker_sandbox',
          executionId: executionResult.executionId
        };

        // Armazenar no cache se habilitado
        if (this.useCache && this.cacheManager) {
          const cacheKey = `exec:${implementation.code.substring(0, 100).replace(/\s+/g, '')}:${implementation.language || 'js'}`;
          this.cacheManager.set(cacheKey, execResult, 1800000); // Cache por 30 minutos
        }

        return execResult;
      } catch (error) {
        this.logger?.warn('Erro ao executar em DockerSandbox, usando fallback', {
          error: error.message
        });
        // Continuar com fallback
      }
    }

    // Fallback: execução simplificada (não executa código real por segurança)
    const fallbackResult = {
      output: 'executed_fallback',
      returnValue: null,
      sideEffects: [],
      source: 'fallback',
      warning: 'Código não executado em sandbox isolado. Use DockerSandbox para execução real.'
    };

    // Armazenar no cache se habilitado
    if (this.useCache && this.cacheManager) {
      const cacheKey = `exec:${implementation.code.substring(0, 100).replace(/\s+/g, '')}:${implementation.language || 'js'}`;
      this.cacheManager.set(cacheKey, fallbackResult, 1800000); // Cache por 30 minutos
    }

    return fallbackResult;
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
   * Garante isolamento completo de testes usando DockerSandbox quando disponível
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

    // Se DockerSandbox disponível, validar isolamento real executando testes em containers separados
    let realIsolationValidation = null;
    if (this.useDockerSandbox && this.dockerSandbox && testSuite.tests) {
      try {
        realIsolationValidation = await this.validateRealIsolation(testSuite);
      } catch (e) {
        this.logger?.warn('Erro ao validar isolamento real com DockerSandbox', { error: e.message });
      }
    }

    // Gerar código de isolamento
    const isolationCode = await this.generateIsolationCode({
      dependencies,
      stateLeaks,
      cacheClearing: cacheClearingNeeds,
      realIsolation: realIsolationValidation
    });

    const result = {
      isolated: stateLeaks.length === 0 && (!realIsolationValidation || realIsolationValidation.isolated),
      isolationCode,
      dependencies,
      stateLeaks,
      cacheClearingNeeds,
      recommendations: await this.generateIsolationRecommendations(stateLeaks),
      realIsolationValidation
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
   * Valida isolamento real executando testes em containers Docker separados
   * 
   * @param {Object} testSuite - Suite de testes
   * @returns {Promise<Object>} Resultado da validação de isolamento real
   */
  async validateRealIsolation(testSuite) {
    if (!testSuite.tests || testSuite.tests.length === 0) {
      return { isolated: true, reason: 'Nenhum teste para validar' };
    }

    const isolationResults = [];
    const sharedState = new Set();

    for (const test of testSuite.tests) {
      if (!test.code) continue;

      try {
        // Executar teste em sandbox isolado
        const result = await this.dockerSandbox.execute(
          test.code,
          'javascript',
          { timeout: 3000 }
        );

        // Verificar se teste modifica estado global (simplificado)
        if (test.code.includes('global.') || test.code.includes('process.env')) {
          sharedState.add(test.name || 'unknown');
        }

        isolationResults.push({
          test: test.name || 'unknown',
          isolated: result.success !== false,
          executionId: result.executionId
        });
      } catch (e) {
        isolationResults.push({
          test: test.name || 'unknown',
          isolated: false,
          error: e.message
        });
      }
    }

    const allIsolated = isolationResults.every(r => r.isolated);
    
    return {
      isolated: allIsolated,
      results: isolationResults,
      sharedState: Array.from(sharedState),
      method: 'docker_sandbox'
    };
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
    return ['logger', 'config', '?ThreeERuleValidator'];
  }
}

export default TestExpectationValidator;

/**
 * Factory function para criar TestExpectationValidator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @param {Object} threeERuleValidator - ThreeE Rule Validator (opcional)
 * @returns {TestExpectationValidator} Instância do TestExpectationValidator
 */
export function createTestExpectationValidator(config = null, logger = null, errorHandler = null, threeERuleValidator = null) {
  return new TestExpectationValidator(config, logger, errorHandler, threeERuleValidator);
}
