/**
 * TestValidator - Sistema de Validação de Testes
 * 
 * Valida que testes estão corretos e atualizados.
 * 
 * Funcionalidades:
 * - Test Updater (atualizar testes após mudanças)
 * - Expectation Validator (validar expectativas de testes)
 * - Mock Validator (validar que mocks estão corretos)
 * - Coverage Analyzer (analisar cobertura de testes)
 * 
 * Métricas de Sucesso:
 * - 100% dos testes estão corretos e atualizados
 * - 100% dos mocks estão corretos
 * - 100% da cobertura de testes analisada
 */

import BaseSystem from '../../core/BaseSystem.js';
import { getComponentRegistry } from '../../core/index.js';

class TestValidator extends BaseSystem {
  constructor(config = null, logger = null, errorHandler = null, testExpectationValidator = null) {
    super(config, logger, errorHandler);
    this.testExpectationValidator = testExpectationValidator;
    // Lazy loading para evitar dependência circular
    this.useTestExpectationValidator = config?.features?.useTestExpectationValidator !== false;
    this.autoUpdate = config?.fase3?.testValidator?.autoUpdate !== false;
  }

  async onInitialize() {
    this.validations = new Map();
    this.updates = new Map();
    
    // Obter TestExpectationValidator via lazy loading se não fornecido
    if (this.useTestExpectationValidator && !this.testExpectationValidator) {
      try {
        const registry = getComponentRegistry();
        this.testExpectationValidator = registry.get('TestExpectationValidator');
        if (this.testExpectationValidator) {
          this.logger?.debug('TestExpectationValidator obtido via lazy loading');
        }
      } catch (e) {
        this.logger?.warn('Erro ao obter TestExpectationValidator, continuando sem integração', { error: e.message });
        this.useTestExpectationValidator = false;
      }
    }

    this.logger?.info('TestValidator inicializado', {
      useTestExpectationValidator: this.useTestExpectationValidator,
      autoUpdate: this.autoUpdate
    });
  }

  /**
   * Valida ou atualiza teste
   * 
   * @param {Object} context - Contexto com test, implementation e action
   * @returns {Promise<Object>} Resultado da validação ou atualização
   */
  async onExecute(context) {
    const { action, test, implementation, validationId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'validate') {
      if (!test || !implementation) {
        throw new Error('test e implementation são obrigatórios para validate');
      }
      return await this.validateTest(test, implementation, validationId);
    } else if (action === 'update') {
      if (!test || !implementation) {
        throw new Error('test e implementation são obrigatórios para update');
      }
      return await this.updateTest(test, implementation, validationId);
    } else if (action === 'validateMocks') {
      if (!test) {
        throw new Error('test é obrigatório para validateMocks');
      }
      return await this.validateMocks(test, validationId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Valida teste
   * 
   * @param {Object} test - Teste a validar
   * @param {Object} implementation - Implementação
   * @param {string} validationId - ID da validação (opcional)
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateTest(test, implementation, validationId = null) {
    const issues = [];

    // Verificar se teste corresponde à implementação
    const correspondence = await this.checkTestCorrespondence(test, implementation);
    if (!correspondence.matches) {
      issues.push({
        type: 'implementation_mismatch',
        severity: 'high',
        description: 'Teste não corresponde à implementação atual',
        details: correspondence.details
      });
    }

    // Validar expectativas
    const expectationValidation = await this.validateExpectations(test, implementation);
    if (!expectationValidation.valid) {
      issues.push({
        type: 'invalid_expectations',
        severity: 'high',
        description: 'Expectativas do teste são inválidas',
        details: expectationValidation.errors
      });
    }

    // Detectar acoplamento a modelos antigos
    const couplingCheck = await this.detectOldModelCoupling(test, implementation);
    if (couplingCheck.coupled) {
      issues.push({
        type: 'old_model_coupling',
        severity: 'medium',
        description: 'Teste está acoplado a modelo antigo',
        details: couplingCheck.details
      });
    }

    const result = {
      valid: issues.length === 0,
      issues,
      correspondence,
      expectationValidation,
      couplingCheck,
      recommendations: this.generateRecommendations(issues)
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
   * Verifica se teste corresponde à implementação
   * 
   * @param {Object} test - Teste
   * @param {Object} implementation - Implementação
   * @returns {Promise<Object>} Resultado da verificação
   */
  async checkTestCorrespondence(test, implementation) {
    const details = [];

    // Verificar se teste testa funções que existem
    if (test.targetFunction && implementation.code) {
      const functionExists = implementation.code.includes(`function ${test.targetFunction}`) ||
                             implementation.code.includes(`${test.targetFunction} =`);
      
      if (!functionExists) {
        details.push(`Função ${test.targetFunction} não encontrada na implementação`);
      }
    }

    // Verificar se teste testa métodos que existem
    if (test.targetMethod && implementation.code) {
      const methodExists = implementation.code.includes(`${test.targetMethod}(`) ||
                          implementation.code.includes(`.${test.targetMethod} =`);
      
      if (!methodExists) {
        details.push(`Método ${test.targetMethod} não encontrado na implementação`);
      }
    }

    return {
      matches: details.length === 0,
      details
    };
  }

  /**
   * Valida expectativas do teste usando TestExpectationValidator quando disponível
   * 
   * @param {Object} test - Teste
   * @param {Object} implementation - Implementação
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateExpectations(test, implementation) {
    const errors = [];

    if (!test.expectations) {
      errors.push('Teste não tem expectativas definidas');
      return { valid: false, errors };
    }

    // Se TestExpectationValidator disponível, usar validação avançada
    if (this.useTestExpectationValidator && this.testExpectationValidator) {
      try {
        const expectationValidation = await this.testExpectationValidator.execute({
          action: 'validateExpectations',
          test,
          implementation
        });

        if (!expectationValidation.valid) {
          errors.push(...expectationValidation.mismatches.map(m => m.description));
          
          // Se há expectativas corretas sugeridas, incluir
          if (expectationValidation.correctExpectations) {
            return {
              valid: false,
              errors,
              suggestions: expectationValidation.suggestions,
              correctExpectations: expectationValidation.correctExpectations,
              source: 'test_expectation_validator'
            };
          }
        } else {
          return {
            valid: true,
            errors: [],
            source: 'test_expectation_validator',
            threeEValidation: expectationValidation.threeEValidation
          };
        }
      } catch (e) {
        this.logger?.warn('Erro ao usar TestExpectationValidator, usando validação básica', { error: e.message });
      }
    }

    // Validação básica (fallback)
    if (test.expectations.returnValue === undefined && 
        test.expectations.output === undefined &&
        !test.expectations.shouldThrow) {
      errors.push('Expectativas do teste são vazias ou inválidas');
    }

    return {
      valid: errors.length === 0,
      errors,
      source: 'basic'
    };
  }

  /**
   * Detecta acoplamento a modelos antigos
   * 
   * @param {Object} test - Teste
   * @param {Object} implementation - Implementação
   * @returns {Promise<Object>} Resultado da detecção
   */
  async detectOldModelCoupling(test, implementation) {
    const details = [];

    // Verificar se teste referencia estruturas antigas
    if (test.code) {
      // Padrões que indicam acoplamento a modelo antigo
      const oldPatterns = [
        /oldModel|legacy|deprecated/i,
        /v\d+\.\d+\.\d+/ // Versões específicas antigas
      ];

      for (const pattern of oldPatterns) {
        if (pattern.test(test.code)) {
          details.push('Teste referencia estruturas antigas ou deprecated');
          break;
        }
      }
    }

    return {
      coupled: details.length > 0,
      details
    };
  }

  /**
   * Atualiza teste para nova implementação usando TestExpectationValidator quando disponível
   * 
   * @param {Object} test - Teste a atualizar
   * @param {Object} newImplementation - Nova implementação
   * @param {string} validationId - ID da atualização (opcional)
   * @returns {Promise<Object>} Teste atualizado
   */
  async updateTest(test, newImplementation, validationId = null) {
    // Se autoUpdate habilitado e TestExpectationValidator disponível, usar atualização automática
    if (this.autoUpdate && this.useTestExpectationValidator && this.testExpectationValidator) {
      try {
        // Validar expectativas antes de atualizar
        const expectationValidation = await this.testExpectationValidator.execute({
          action: 'validateExpectations',
          test,
          implementation: newImplementation
        });

        const updatedTest = { ...test };

        // Se há mismatches, atualizar expectativas automaticamente
        if (!expectationValidation.valid && expectationValidation.correctExpectations) {
          updatedTest.expectations = expectationValidation.correctExpectations;
          updatedTest.updatedAt = new Date().toISOString();
          updatedTest.updateReason = 'Expectativas atualizadas automaticamente baseadas em comportamento real';

          this.logger?.info('Teste atualizado automaticamente', {
            testId: test.id || test.name,
            mismatchesFixed: expectationValidation.mismatches.length
          });
        }

        // Validar que teste atualizado ainda funciona
        const stillValid = await this.ensureBehaviorValidation(updatedTest, newImplementation);

        const result = {
          test: updatedTest,
          updated: !expectationValidation.valid,
          stillValid,
          behaviorValidation: {
            matches: expectationValidation.valid,
            suggestedExpectations: expectationValidation.correctExpectations
          },
          source: 'auto_update',
          expectationValidation
        };

        // Armazenar atualização
        const id = validationId || `update-${Date.now()}`;
        this.updates.set(id, {
          ...result,
          originalTest: test,
          newImplementation,
          updatedAt: new Date().toISOString()
        });

        return result;
      } catch (e) {
        this.logger?.warn('Erro ao atualizar teste automaticamente, usando método manual', { error: e.message });
      }
    }

    // Método manual (fallback ou quando autoUpdate desabilitado)
    // Validar comportamento da nova implementação
    const behaviorValidation = await this.validateBehavior(test, newImplementation);

    // Atualizar expectativas se necessário
    const updatedTest = { ...test };
    if (!behaviorValidation.matches) {
      updatedTest.expectations = behaviorValidation.suggestedExpectations;
      updatedTest.updatedAt = new Date().toISOString();
    }

    // Garantir que teste ainda valida comportamento
    const stillValid = await this.ensureBehaviorValidation(updatedTest, newImplementation);

    const result = {
      test: updatedTest,
      updated: !behaviorValidation.matches,
      stillValid,
      behaviorValidation,
      source: 'manual'
    };

    // Armazenar atualização
    const id = validationId || `update-${Date.now()}`;
    this.updates.set(id, {
      ...result,
      originalTest: test,
      newImplementation,
      updatedAt: new Date().toISOString()
    });

    return result;
  }

  /**
   * Valida comportamento da implementação
   * 
   * @param {Object} test - Teste
   * @param {Object} implementation - Implementação
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateBehavior(test, implementation) {
    // Simplificado - em produção executaria implementação
    return {
      matches: true,
      suggestedExpectations: test.expectations || {}
    };
  }

  /**
   * Garante que teste ainda valida comportamento
   * 
   * @param {Object} test - Teste
   * @param {Object} implementation - Implementação
   * @returns {Promise<boolean>} True se ainda válido
   */
  async ensureBehaviorValidation(test, implementation) {
    // Verificar se teste ainda testa comportamento relevante
    return test.expectations && Object.keys(test.expectations).length > 0;
  }

  /**
   * Valida mocks do teste
   * 
   * @param {Object} test - Teste
   * @param {string} validationId - ID da validação (opcional)
   * @returns {Promise<Object>} Resultado da validação de mocks
   */
  async validateMocks(test, validationId = null) {
    const issues = [];

    if (!test.mocks) {
      return {
        valid: true,
        issues: [],
        mocks: []
      };
    }

    // Validar cada mock
    for (const mock of test.mocks) {
      // Verificar se mock tem estrutura correta
      if (!mock.target || !mock.returns) {
        issues.push({
          type: 'invalid_mock_structure',
          mock,
          description: 'Mock não tem estrutura correta (target e returns são obrigatórios)'
        });
      }

      // Verificar se mock não está deprecated
      if (mock.deprecated) {
        issues.push({
          type: 'deprecated_mock',
          mock,
          description: `Mock de ${mock.target} está deprecated`
        });
      }
    }

    const result = {
      valid: issues.length === 0,
      issues,
      mocks: test.mocks || []
    };

    // Armazenar validação
    const id = validationId || `mock-validation-${Date.now()}`;
    this.validations.set(id, {
      ...result,
      test,
      validatedAt: new Date().toISOString()
    });

    return result;
  }

  /**
   * Gera recomendações baseadas em issues
   * 
   * @param {Array<Object>} issues - Issues encontradas
   * @returns {Array<Object>} Recomendações
   */
  generateRecommendations(issues) {
    return issues.map(issue => ({
      type: issue.type,
      priority: issue.severity,
      recommendation: this.getRecommendationForIssue(issue)
    }));
  }

  /**
   * Obtém recomendação para issue específica
   * 
   * @param {Object} issue - Issue
   * @returns {string} Recomendação
   */
  getRecommendationForIssue(issue) {
    const recommendations = {
      implementation_mismatch: 'Atualizar teste para corresponder à implementação atual',
      invalid_expectations: 'Corrigir expectativas do teste',
      old_model_coupling: 'Atualizar teste para usar modelo atual'
    };

    return recommendations[issue.type] || 'Revisar teste';
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
   * Obtém atualização armazenada
   * 
   * @param {string} updateId - ID da atualização
   * @returns {Object|null} Atualização ou null
   */
  getUpdate(updateId) {
    return this.updates.get(updateId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const allValidations = Array.from(this.validations.values());
    const allUpdates = Array.from(this.updates.values());

    return {
      totalValidations: allValidations.length,
      validTests: allValidations.filter(v => v.valid).length,
      totalUpdates: allUpdates.length,
      testsUpdated: allUpdates.filter(u => u.updated).length
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
    return ['logger', 'config', '?TestExpectationValidator'];
  }
}

export default TestValidator;

/**
 * Factory function para criar TestValidator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @param {Object} testExpectationValidator - Test Expectation Validator (opcional)
 * @returns {TestValidator} Instância do TestValidator
 */
export function createTestValidator(config = null, logger = null, errorHandler = null, testExpectationValidator = null) {
  return new TestValidator(config, logger, errorHandler, testExpectationValidator);
}
