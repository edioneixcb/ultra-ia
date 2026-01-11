/**
 * LoggingValidator - Sistema de Logging Obrigatório
 * 
 * Valida uso de logger estruturado em vez de console.
 * 
 * Funcionalidades:
 * - Detector de console.log/error/warn
 * - Sugestão de substituição por logger
 * - Validação em código gerado
 * 
 * Métricas de Sucesso:
 * - 0% de console.log/error/warn em código gerado
 * - 100% do código usando logger estruturado
 * - 100% das sugestões aplicadas automaticamente
 */

import BaseSystem from '../../core/BaseSystem.js';

class LoggingValidator extends BaseSystem {
  async onInitialize() {
    this.validations = new Map();
    this.logger?.info('LoggingValidator inicializado');
  }

  /**
   * Valida uso de logging
   * 
   * @param {Object} context - Contexto com code a validar
   * @returns {Promise<Object>} Resultado da validação
   */
  async onExecute(context) {
    const { code, codeId } = context;

    if (!code) {
      throw new Error('code é obrigatório no contexto');
    }

    this.logger?.info('Validando uso de logging', {
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
    const consoleUsage = this.detectConsoleUsage(code);
    const loggerUsage = this.detectLoggerUsage(code);

    return {
      valid: consoleUsage.length === 0,
      consoleUsage,
      loggerUsage,
      suggestions: consoleUsage.map(usage => ({
        line: usage.line,
        replacement: this.suggestLoggerReplacement(usage)
      }))
    };
  }

  /**
   * Detecta uso de console
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Usos de console encontrados
   */
  detectConsoleUsage(code) {
    const usage = [];
    const consoleRegex = /console\.(log|error|warn|debug|info|trace)\(/g;
    let match;

    while ((match = consoleRegex.exec(code)) !== null) {
      const line = code.substring(0, match.index).split('\n').length;
      const method = match[1];
      
      // Extrair argumentos se possível
      const argsMatch = code.substring(match.index).match(/console\.\w+\(([^)]*)\)/);
      const args = argsMatch ? argsMatch[1] : '';

      usage.push({
        method,
        line,
        code: match[0],
        args,
        severity: method === 'error' ? 'high' : 'medium'
      });
    }

    return usage;
  }

  /**
   * Detecta uso de logger
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Usos de logger encontrados
   */
  detectLoggerUsage(code) {
    const usage = [];
    const loggerRegex = /(?:this\.)?logger\?\.(log|error|warn|debug|info|trace)\(/g;
    let match;

    while ((match = loggerRegex.exec(code)) !== null) {
      const line = code.substring(0, match.index).split('\n').length;
      usage.push({
        method: match[1],
        line,
        code: match[0]
      });
    }

    return usage;
  }

  /**
   * Sugere substituição por logger
   * 
   * @param {Object} usage - Uso de console detectado
   * @returns {string} Sugestão de substituição
   */
  suggestLoggerReplacement(usage) {
    const { method, args } = usage;
    
    // Mapear métodos do console para logger
    const methodMap = {
      log: 'info',
      error: 'error',
      warn: 'warn',
      debug: 'debug',
      info: 'info',
      trace: 'debug'
    };

    const loggerMethod = methodMap[method] || 'info';
    
    // Se args contém apenas string simples, manter formato simples
    if (args.match(/^['"][^'"]*['"]$/)) {
      return `this.logger?.${loggerMethod}(${args});`;
    }

    // Se args contém múltiplos argumentos, converter para objeto estruturado
    if (args.includes(',')) {
      const parts = args.split(',').map(p => p.trim());
      const message = parts[0];
      const data = parts.slice(1).join(', ');
      return `this.logger?.${loggerMethod}(${message}, { data: ${data} });`;
    }

    // Formato padrão
    return `this.logger?.${loggerMethod}(${args});`;
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
    const totalConsoleUsage = all.reduce((sum, v) => sum + (v.consoleUsage?.length || 0), 0);
    const totalLoggerUsage = all.reduce((sum, v) => sum + (v.loggerUsage?.length || 0), 0);

    return {
      totalValidations: all.length,
      totalConsoleUsage,
      totalLoggerUsage,
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
    return ['logger', 'config'];
  }
}

export default LoggingValidator;

/**
 * Factory function para criar LoggingValidator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {LoggingValidator} Instância do LoggingValidator
 */
export function createLoggingValidator(config = null, logger = null, errorHandler = null) {
  return new LoggingValidator(config, logger, errorHandler);
}
