/**
 * ErrorHandlingValidator - Sistema de Validação de Error Handling
 * 
 * Valida tratamento de erros em código gerado.
 * 
 * Funcionalidades:
 * - Detector de catch blocks vazios
 * - Validação de tratamento de erros
 * - Sugestões automáticas de melhorias
 * 
 * Métricas de Sucesso:
 * - 0% de catch blocks vazios em código gerado
 * - 0% de console.log em código de produção
 * - 100% do código gerado com tratamento de erros adequado
 */

import BaseSystem from '../../core/BaseSystem.js';

class ErrorHandlingValidator extends BaseSystem {
  async onInitialize() {
    this.validations = new Map();
    this.useGlobalErrorHandler = this.config?.features?.useGlobalErrorHandler === true;
    this.logger?.info('ErrorHandlingValidator inicializado', {
      useGlobalErrorHandler: this.useGlobalErrorHandler
    });
  }

  /**
   * Valida tratamento de erros
   * 
   * @param {Object} context - Contexto com code a validar
   * @returns {Promise<Object>} Resultado da validação
   */
  async onExecute(context) {
    const { code, codeId } = context;

    if (!code) {
      throw new Error('code é obrigatório no contexto');
    }

    this.logger?.info('Validando tratamento de erros', {
      codeId: codeId || 'desconhecido'
    });

    const validation = this.validate(code);

    // Armazenar validação
    const id = codeId || `validation-${Date.now()}`;
    this.validations.set(id, {
      ...validation,
      code,
      validatedAt: new Date().toISOString()
    });

    return validation;
  }

  /**
   * Valida código
   * 
   * @param {string} code - Código a validar
   * @returns {Object} Resultado da validação
   */
  validate(code) {
    const emptyCatches = this.detectEmptyCatches(code);
    const consoleLogs = this.detectConsoleLogs(code);
    const missingErrorHandling = this.detectMissingErrorHandling(code);

    const allIssues = [...emptyCatches, ...consoleLogs, ...missingErrorHandling];

    return {
      valid: allIssues.length === 0,
      issues: allIssues,
      suggestions: this.generateSuggestions(allIssues),
      stats: {
        emptyCatches: emptyCatches.length,
        consoleLogs: consoleLogs.length,
        missingErrorHandling: missingErrorHandling.length
      }
    };
  }

  /**
   * Detecta catch blocks vazios
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Catch blocks vazios encontrados
   */
  detectEmptyCatches(code) {
    const issues = [];
    const emptyCatchRegex = /catch\s*\(([^)]*)\)\s*\{\s*\}/g;
    let match;

    while ((match = emptyCatchRegex.exec(code)) !== null) {
      const line = code.substring(0, match.index).split('\n').length;
      issues.push({
        type: 'empty_catch',
        severity: 'high',
        line,
        code: match[0],
        suggestion: 'Adicionar tratamento de erro adequado no catch block'
      });
    }

    return issues;
  }

  /**
   * Detecta uso de console.log
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Console.log encontrados
   */
  detectConsoleLogs(code) {
    const issues = [];
    const consoleRegex = /console\.(log|error|warn|debug|info)\(/g;
    let match;

    while ((match = consoleRegex.exec(code)) !== null) {
      const line = code.substring(0, match.index).split('\n').length;
      const method = match[1];
      issues.push({
        type: 'console_usage',
        severity: 'medium',
        line,
        method,
        code: match[0],
        suggestion: `Substituir console.${method} por logger estruturado (this.logger?.${method})`
      });
    }

    return issues;
  }

  /**
   * Detecta falta de tratamento de erro
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Falta de tratamento encontrada
   */
  detectMissingErrorHandling(code) {
    const issues = [];

    // Verificar operações assíncronas sem try-catch
    const asyncFunctions = code.match(/async\s+function|\s+async\s+\(/g) || [];
    const awaitCalls = code.match(/await\s+\w+\(/g) || [];
    
    if (asyncFunctions.length > 0 && awaitCalls.length > 0) {
      // Verificar se há try-catch envolvendo os awaits
      const hasTryCatch = /try\s*\{[\s\S]*await/.test(code);
      
      if (!hasTryCatch) {
        issues.push({
          type: 'missing_error_handling',
          severity: 'high',
          line: null,
          suggestion: 'Adicionar try-catch para operações assíncronas'
        });
      }
    }

    // Verificar chamadas de função que podem lançar erro sem tratamento
    const functionCalls = code.match(/\w+\([^)]*\)/g) || [];
    const riskyCalls = functionCalls.filter(call => 
      /\.(get|post|put|delete|fetch|readFile|writeFile)/.test(call)
    );

    if (riskyCalls.length > 0) {
      const hasErrorHandling = /try\s*\{[\s\S]*\}/.test(code);
      if (!hasErrorHandling) {
        issues.push({
          type: 'missing_error_handling',
          severity: 'medium',
          line: null,
          suggestion: 'Adicionar tratamento de erro para chamadas de API/IO'
        });
      }
    }

    return issues;
  }

  /**
   * Gera sugestões de melhoria
   * 
   * @param {Array<Object>} issues - Problemas encontrados
   * @returns {Array<Object>} Sugestões
   */
  generateSuggestions(issues) {
    return issues.map(issue => ({
      type: issue.type,
      severity: issue.severity,
      line: issue.line,
      suggestion: issue.suggestion,
      example: this.getExampleFix(issue.type)
    }));
  }

  /**
   * Obtém exemplo de correção
   * 
   * @param {string} issueType - Tipo de problema
   * @returns {string} Exemplo de correção
   */
  getExampleFix(issueType) {
    // Se a feature flag de integração com ErrorHandler global estiver ativa, sugerir uso dele
    const errorHandlingCode = this.useGlobalErrorHandler && this.errorHandler
      ? `this.errorHandler?.handleError(error, { context: 'Operation' });\n  throw error;`
      : `this.logger?.error('Erro capturado', { error });\n  throw error;`;

    const examples = {
      empty_catch: `
// Antes:
catch (e) {}

// Depois:
catch (error) {
  ${errorHandlingCode}
}`,
      console_usage: `
// Antes:
console.log('Debug message');

// Depois:
this.logger?.info('Debug message');`,
      missing_error_handling: `
// Antes:
const result = await fetchData();

// Depois:
try {
  const result = await fetchData();
} catch (error) {
  ${errorHandlingCode}
}`
    };

    return examples[issueType] || '';
  }

  /**
   * Obtém validação armazenada
   * 
   * @param {string} codeId - ID do código
   * @returns {Object|null} Validação ou null
   */
  getValidation(codeId) {
    return this.validations.get(codeId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.validations.values());
    const totalIssues = all.reduce((sum, v) => sum + (v.issues?.length || 0), 0);

    return {
      totalValidations: all.length,
      totalIssues,
      valid: all.filter(v => v.valid).length,
      invalid: all.filter(v => !v.valid).length
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

    if (!context.code || typeof context.code !== 'string') {
      return { valid: false, errors: ['code é obrigatório e deve ser string'] };
    }

    return { valid: true };
  }

  /**
   * Retorna dependências do sistema
   * 
   * @returns {Array<string>} Dependências
   */
  onGetDependencies() {
    return ['logger', 'config', 'errorHandler'];
  }
}

export default ErrorHandlingValidator;

/**
 * Factory function para criar ErrorHandlingValidator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {ErrorHandlingValidator} Instância do ErrorHandlingValidator
 */
export function createErrorHandlingValidator(config = null, logger = null, errorHandler = null) {
  return new ErrorHandlingValidator(config, logger, errorHandler);
}
