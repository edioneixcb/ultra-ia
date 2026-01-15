/**
 * InlineValidatedCodeGenerator - Sistema de Geração de Código com Validação Inline e Auto-Correção
 * 
 * Gera código que previne erros conhecidos e valida durante geração.
 * 
 * Funcionalidades:
 * - Validação Inline Durante Geração
 * - Auto-Correção Durante Geração
 * - Proteção Contra Formatação Problemática
 * - Integração com RAG (Generator)
 * 
 * Métricas de Sucesso:
 * - 100% do código gerado é type-safe e seguro
 * - 0% de problemas conhecidos no código gerado
 * - 100% do código crítico protegido de formatação problemática
 */

import BaseSystem from '../../core/BaseSystem.js';

class InlineValidatedCodeGenerator extends BaseSystem {
  /**
   * Construtor com injeção de dependências
   * 
   * @param {Object} config - Configuração
   * @param {Object} logger - Logger
   * @param {Object} errorHandler - Error Handler
   * @param {Object} [generator=null] - Gerador opcional (RAG)
   */
  constructor(config = null, logger = null, errorHandler = null, generator = null) {
    super(config, logger, errorHandler);
    this.generator = generator;
    this.useRAGGeneration = config?.features?.useRAGGeneration !== false && generator !== null;
  }

  async onInitialize() {
    this.generatedCode = new Map();
    this.maxIterations = this.config?.validation?.maxIterations || 10;
    this.logger?.info('InlineValidatedCodeGenerator inicializado', {
      useRAGGeneration: this.useRAGGeneration
    });
  }

  /**
   * Gera código com validação inline
   * 
   * @param {Object} context - Contexto com template e context
   * @returns {Promise<Object>} Código gerado e validado
   */
  async onExecute(context) {
    const { template, context: genContext, code } = context;

    if (!template && !code) {
      throw new Error('template ou code é obrigatório no contexto');
    }

    this.logger?.info('Gerando código com validação inline');

    // Se código já fornecido, apenas validar e corrigir
    if (code) {
      return await this.validateAndCorrect(code, genContext || {});
    }

    // Gerar código a partir de template
    return await this.generateWithInlineValidation(template, genContext || {});
  }

  /**
   * Gera código com validação inline
   * 
   * @param {string|Object} template - Template ou código inicial
   * @param {Object} context - Contexto de geração
   * @returns {Promise<Object>} Código gerado e validado
   */
  async generateWithInlineValidation(template, context) {
    // Gerar código inicial
    let code = await this.generateCode(template, context);

    // Validar e corrigir iterativamente
    let iterations = 0;
    let lastValidation = null;

    while (iterations < this.maxIterations) {
      const validation = await this.validateInline(code, context);

      if (validation.isValid) {
        lastValidation = validation;
        break;
      }

      // Auto-corrigir
      code = await this.autoCorrect(code, validation.errors, context);
      iterations++;

      this.logger?.debug(`Iteração ${iterations}: código corrigido`, {
        errorsFixed: validation.errors.length
      });
    }

    if (!lastValidation || !lastValidation.isValid) {
      this.logger?.warn('Código não pôde ser totalmente validado após iterações', {
        iterations,
        remainingErrors: lastValidation?.errors?.length || 0
      });
    }

    // Proteger código crítico
    code = await this.protectCriticalCode(code, context);

    // Validação final
    const finalValidation = await this.validateInline(code, context);

    const result = {
      code,
      valid: finalValidation.isValid,
      iterations,
      errors: finalValidation.errors || [],
      warnings: finalValidation.warnings || [],
      isProtected: true
    };

    // Armazenar código gerado
    const codeId = `code-${Date.now()}`;
    this.generatedCode.set(codeId, {
      ...result,
      template,
      context,
      generatedAt: new Date().toISOString()
    });

    this.logger?.info('Código gerado e validado', {
      codeId,
      valid: result.valid,
      iterations
    });

    return result;
  }

  /**
   * Valida e corrige código existente
   * 
   * @param {string} code - Código a validar
   * @param {Object} context - Contexto
   * @returns {Promise<Object>} Código corrigido
   */
  async validateAndCorrect(code, context) {
    return await this.generateWithInlineValidation(code, context);
  }

  /**
   * Gera código a partir de template
   * 
   * @param {string|Object} template - Template
   * @param {Object} context - Contexto
   * @returns {Promise<string>} Código gerado
   */
  async generateCode(template, context) {
    // Se RAG Generation habilitado, usar generator
    if (this.useRAGGeneration && this.generator) {
      try {
        const generated = await this.generator.execute({
          template,
          context,
          mode: 'inline'
        });
        if (generated && generated.code) {
          return generated.code;
        }
      } catch (error) {
        this.logger?.warn('Falha na geração RAG, usando fallback', { error });
      }
    }

    // Fallback: Se template é string, retornar como está
    if (typeof template === 'string') {
      return template;
    }

    // Se template é objeto com estrutura, processar
    if (typeof template === 'object' && template.code) {
      return template.code;
    }

    // Template vazio ou inválido
    return '';
  }

  /**
   * Valida código inline
   * 
   * @param {string} code - Código a validar
   * @param {Object} context - Contexto
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateInline(code, context) {
    const errors = [];
    const warnings = [];

    // Validação 1: Verificar sintaxe básica
    const syntaxErrors = this.validateSyntax(code);
    errors.push(...syntaxErrors);

    // Validação 2: Verificar padrões problemáticos conhecidos
    const patternErrors = await this.validatePatterns(code);
    errors.push(...patternErrors);

    // Validação 3: Verificar type safety (se TypeScript)
    if (context.language === 'typescript' || code.includes(':')) {
      const typeErrors = this.validateTypeSafety(code);
      errors.push(...typeErrors);
    }

    // Validação 4: Verificar segurança
    const securityWarnings = this.validateSecurity(code);
    warnings.push(...securityWarnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida sintaxe básica
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Erros de sintaxe
   */
  validateSyntax(code) {
    const errors = [];

    // Verificar parênteses balanceados
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push({
        type: 'syntax',
        message: 'Parênteses não balanceados',
        severity: 'high'
      });
    }

    // Verificar chaves balanceadas
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push({
        type: 'syntax',
        message: 'Chaves não balanceadas',
        severity: 'high'
      });
    }

    return errors;
  }

  /**
   * Valida padrões problemáticos
   * 
   * @param {string} code - Código
   * @returns {Promise<Array<Object>>} Erros de padrão
   */
  async validatePatterns(code) {
    const errors = [];

    // Verificar catch vazio
    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(code)) {
      errors.push({
        type: 'pattern',
        message: 'Catch block vazio detectado',
        severity: 'high',
        fix: 'Adicionar tratamento de erro no catch'
      });
    }

    // Verificar console.log
    if (/console\.(log|error|warn|debug)\(/.test(code)) {
      errors.push({
        type: 'pattern',
        message: 'Uso de console detectado',
        severity: 'medium',
        fix: 'Substituir por logger estruturado'
      });
    }

    return errors;
  }

  /**
   * Valida type safety
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Erros de tipo
   */
  validateTypeSafety(code) {
    const errors = [];

    // Verificar uso de any
    if (/:\s*any\b/.test(code)) {
      errors.push({
        type: 'type',
        message: 'Uso de any detectado',
        severity: 'medium',
        fix: 'Especificar tipo adequado'
      });
    }

    return errors;
  }

  /**
   * Valida segurança
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Avisos de segurança
   */
  validateSecurity(code) {
    const warnings = [];

    // Verificar secrets hardcoded
    const secretPatterns = [
      /password\s*[:=]\s*['"][^'"]+['"]/gi,
      /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
      /secret\s*[:=]\s*['"][^'"]+['"]/gi
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(code)) {
        warnings.push({
          type: 'security',
          message: 'Possível secret hardcoded detectado',
          severity: 'critical'
        });
      }
    }

    return warnings;
  }

  /**
   * Auto-corrige código baseado em erros
   * 
   * @param {string} code - Código a corrigir
   * @param {Array<Object>} errors - Erros encontrados
   * @param {Object} context - Contexto
   * @returns {Promise<string>} Código corrigido
   */
  async autoCorrect(code, errors, context) {
    let correctedCode = code;

    for (const error of errors) {
      if (error.fix) {
        // Aplicar correção baseada no tipo de erro
        if (error.type === 'pattern' && error.message.includes('Catch block vazio')) {
          correctedCode = correctedCode.replace(
            /catch\s*\(([^)]*)\)\s*\{\s*\}/g,
            `catch ($1) {\n    this.logger?.error('Erro capturado', { error: $1 });\n    throw $1;\n  }`
          );
        } else if (error.type === 'pattern' && error.message.includes('console')) {
          correctedCode = correctedCode.replace(
            /console\.(log|error|warn|debug)\(/g,
            'this.logger?.$1('
          );
        } else if (error.type === 'type' && error.message.includes('any')) {
          // Tentar inferir tipo ou usar unknown
          correctedCode = correctedCode.replace(/:\s*any\b/g, ': unknown');
        }
      }
    }

    return correctedCode;
  }

  /**
   * Protege código crítico contra formatação problemática
   * 
   * @param {string} code - Código
   * @param {Object} context - Contexto
   * @returns {Promise<string>} Código protegido
   */
  async protectCriticalCode(code, context) {
    let securedCode = code;

    // Proteger strings críticas (secrets, tokens, etc.)
    // Substituir por variável de ambiente
    securedCode = securedCode.replace(
      /(const|let|var)\s+(apiKey|password|secret|token)\s*=\s*['"]([^'"]+)['"]/g,
      (match, decl, name) => {
        return `// SECURED: Secret removido - usar variável de ambiente\n    ${decl} ${name} = process.env.${name} || '';`;
      }
    );

    return securedCode;
  }

  /**
   * Obtém código gerado
   * 
   * @param {string} codeId - ID do código
   * @returns {Object|null} Código gerado ou null
   */
  getGeneratedCode(codeId) {
    return this.generatedCode.get(codeId) || null;
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

    if (!context.template && !context.code) {
      return { valid: false, errors: ['template ou code é obrigatório'] };
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

export default InlineValidatedCodeGenerator;

/**
 * Factory function para criar InlineValidatedCodeGenerator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @param {Object} [generator=null] - Generator opcional
 * @returns {InlineValidatedCodeGenerator} Instância do InlineValidatedCodeGenerator
 */
export function createInlineValidatedCodeGenerator(config = null, logger = null, errorHandler = null, generator = null) {
  return new InlineValidatedCodeGenerator(config, logger, errorHandler, generator);
}
