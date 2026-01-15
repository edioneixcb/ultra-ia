/**
 * ESLint Validator
 * 
 * Validador programático usando ESLint para análise estática profunda.
 * Detecta problemas de qualidade, segurança e estilo que o parser AST puro pode perder.
 * 
 * NOTA: Atualizado para ESLint v9+ (formato flat config)
 */

import { ESLint } from 'eslint';
import { getLogger } from '../utils/Logger.js';
import globals from 'globals';

class ESLintValidator {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    
    // Inicializar ESLint com configuração flat (ESLint v9+)
    // ESLint v9 removeu useEslintrc e baseConfig, usar overrideConfigFile e overrideConfig
    this.eslint = new ESLint({
      overrideConfigFile: true, // Ignora arquivos de config no diretório
      overrideConfig: [
        {
          languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
              ...globals.node,
              ...globals.es2021
            }
          },
          rules: {
            // Regras de segurança e qualidade
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-unused-vars': 'warn',
            'no-undef': 'error',
            'no-console': 'warn',
            'no-debugger': 'error',
            'no-alert': 'error',
            'eqeqeq': 'error',
            'curly': 'error'
          }
        }
      ]
    });
  }

  /**
   * Valida código usando ESLint
   * @param {string} code - Código a validar
   * @returns {Promise<object>} Resultado da validação { valid, issues, errorCount }
   */
  async validate(code) {
    try {
      const results = await this.eslint.lintText(code);
      const result = results[0]; // lintText retorna array, pegamos o primeiro (único arquivo virtual)

      if (!result) {
        return { valid: true, issues: [], errorCount: 0 };
      }

      const issues = result.messages.map(msg => ({
        line: msg.line,
        column: msg.column,
        message: msg.message,
        ruleId: msg.ruleId,
        severity: msg.severity === 2 ? 'error' : 'warning'
      }));

      const errorCount = result.errorCount;
      
      return {
        valid: errorCount === 0,
        issues,
        errorCount,
        warningCount: result.warningCount
      };

    } catch (error) {
      this.logger?.error('Erro ao executar ESLint', { error: error.message });
      // Em caso de erro do linter, falhamos seguro (assumimos erro no validador, não no código, mas reportamos)
      return {
        valid: false,
        issues: [{
          line: 0,
          column: 0,
          message: `Falha no validador ESLint: ${error.message}`,
          severity: 'error'
        }],
        errorCount: 1
      };
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do ESLintValidator
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {ESLintValidator} Instância do ESLintValidator
 */
export function getESLintValidator(config = null, logger = null) {
  if (!instance) {
    instance = new ESLintValidator(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do ESLintValidator (não singleton)
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {ESLintValidator} Nova instância do ESLintValidator
 */
export function createESLintValidator(config = null, logger = null) {
  return new ESLintValidator(config, logger);
}

export default ESLintValidator;
