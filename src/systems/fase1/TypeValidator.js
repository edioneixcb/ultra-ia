/**
 * TypeValidator - Sistema de Validação de Tipos
 * 
 * Detecta uso de any e infere tipos do contexto.
 * 
 * Funcionalidades:
 * - Detector de uso de any
 * - Inferência de tipos do contexto
 * - Sugestão de tipos específicos
 * 
 * Métricas de Sucesso:
 * - 0% de uso de any em código gerado
 * - 100% dos tipos inferidos corretamente
 * - 100% das sugestões aplicadas automaticamente
 */

import BaseSystem from '../../core/BaseSystem.js';

class TypeValidator extends BaseSystem {
  async onInitialize() {
    this.validations = new Map();
    this.logger?.info('TypeValidator inicializado');
  }

  /**
   * Valida tipos
   * 
   * @param {Object} context - Contexto com code a validar
   * @returns {Promise<Object>} Resultado da validação
   */
  async onExecute(context) {
    const { code, codeId } = context;

    if (!code) {
      throw new Error('code é obrigatório no contexto');
    }

    this.logger?.info('Validando tipos', {
      codeId: codeId || 'desconhecido'
    });

    const anyUsage = this.detectAnyUsage(code);
    const inferredTypes = await this.inferTypes(code);

    const validation = {
      valid: anyUsage.length === 0,
      anyUsage,
      inferredTypes,
      suggestions: anyUsage.map(usage => ({
        line: usage.line,
        suggestedType: inferredTypes[usage.variable] || 'unknown',
        replacement: this.suggestTypeReplacement(usage, inferredTypes[usage.variable])
      }))
    };

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
   * Detecta uso de any
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Usos de any encontrados
   */
  detectAnyUsage(code) {
    const usage = [];
    
    // Padrão 1: parâmetros de função
    const paramRegex = /(\w+)\s*:\s*any\b/g;
    let match;
    while ((match = paramRegex.exec(code)) !== null) {
      // Verificar se está dentro de parênteses de função
      const beforeMatch = code.substring(0, match.index);
      const lastOpenParen = beforeMatch.lastIndexOf('(');
      const lastCloseParen = beforeMatch.lastIndexOf(')');
      
      if (lastOpenParen > lastCloseParen) {
        const line = beforeMatch.split('\n').length;
        usage.push({
          variable: match[1],
          line,
          context: 'parameter',
          code: match[0]
        });
      }
    }

    // Padrão 2: variáveis
    const varRegex = /(?:const|let|var)\s+(\w+)\s*:\s*any\b/g;
    while ((match = varRegex.exec(code)) !== null) {
      const line = code.substring(0, match.index).split('\n').length;
      usage.push({
        variable: match[1],
        line,
        context: 'variable',
        code: match[0]
      });
    }

    // Padrão 3: retorno de função
    const returnRegex = /:\s*any\s*=>/g;
    while ((match = returnRegex.exec(code)) !== null) {
      const line = code.substring(0, match.index).split('\n').length;
      usage.push({
        variable: 'return',
        line,
        context: 'return',
        code: match[0]
      });
    }

    return usage;
  }

  /**
   * Infere tipos do contexto
   * 
   * @param {string} code - Código
   * @returns {Promise<Object>} Tipos inferidos
   */
  async inferTypes(code) {
    const inferred = {};

    // Inferir tipos básicos de uso
    const stringPattern = /(\w+)\s*[:=]\s*['"][^'"]*['"]/g;
    let match;
    while ((match = stringPattern.exec(code)) !== null) {
      inferred[match[1]] = 'string';
    }

    const numberPattern = /(\w+)\s*[:=]\s*\d+/g;
    while ((match = numberPattern.exec(code)) !== null) {
      inferred[match[1]] = 'number';
    }

    const booleanPattern = /(\w+)\s*[:=]\s*(true|false)/g;
    while ((match = booleanPattern.exec(code)) !== null) {
      inferred[match[1]] = 'boolean';
    }

    const arrayPattern = /(\w+)\s*[:=]\s*\[/g;
    while ((match = arrayPattern.exec(code)) !== null) {
      inferred[match[1]] = 'Array<unknown>';
    }

    const objectPattern = /(\w+)\s*[:=]\s*\{/g;
    while ((match = objectPattern.exec(code)) !== null) {
      inferred[match[1]] = 'Record<string, unknown>';
    }

    // Inferir tipos de função
    const functionPattern = /(\w+)\s*[:=]\s*(?:async\s+)?\(/g;
    while ((match = functionPattern.exec(code)) !== null) {
      inferred[match[1]] = 'Function';
    }

    return inferred;
  }

  /**
   * Sugere substituição de tipo
   * 
   * @param {Object} usage - Uso de any detectado
   * @param {string} inferredType - Tipo inferido
   * @returns {string} Sugestão de substituição
   */
  suggestTypeReplacement(usage, inferredType) {
    const { variable, context, code: originalCode } = usage;
    const type = inferredType || 'unknown';

    if (context === 'parameter') {
      return originalCode.replace(/: any\b/, `: ${type}`);
    } else if (context === 'variable') {
      return originalCode.replace(/: any\b/, `: ${type}`);
    } else if (context === 'return') {
      return originalCode.replace(/: any/, `: ${type}`);
    }

    return originalCode.replace(/: any\b/, `: ${type}`);
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
    const totalAnyUsage = all.reduce((sum, v) => sum + (v.anyUsage?.length || 0), 0);

    return {
      totalValidations: all.length,
      totalAnyUsage,
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

export default TypeValidator;

/**
 * Factory function para criar TypeValidator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {TypeValidator} Instância do TypeValidator
 */
export function createTypeValidator(config = null, logger = null, errorHandler = null) {
  return new TypeValidator(config, logger, errorHandler);
}
