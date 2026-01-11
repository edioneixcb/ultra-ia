/**
 * IncrementalCodeGenerator - Geração Incremental
 * 
 * Implementa geração incremental de código com validação contínua e refinamento inteligente.
 * 
 * Funcionalidades:
 * - Geração Incremental (gerar código em partes incrementais)
 * - Validação Contínua (validar cada parte gerada)
 * - Refinamento Inteligente (refinar código baseado em feedback)
 * - Combinação de Partes (combinar partes geradas em código completo)
 * 
 * Métricas de Sucesso:
 * - 100% do código gerado incrementalmente é válido
 * - 100% das partes são validadas antes de combinar
 * - 100% do refinamento melhora a qualidade do código
 */

import BaseSystem from '../../core/BaseSystem.js';

class IncrementalCodeGenerator extends BaseSystem {
  async onInitialize() {
    this.generations = new Map();
    this.parts = new Map();
    this.logger?.info('IncrementalCodeGenerator inicializado');
  }

  /**
   * Gera código incrementalmente
   * 
   * @param {Object} context - Contexto com action, template, parameters e opções
   * @returns {Promise<Object>} Resultado da geração
   */
  async onExecute(context) {
    const { action, template, parameters = {}, options = {}, generationId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'generate') {
      if (!template) {
        throw new Error('template é obrigatório para generate');
      }
      return await this.generateIncremental(template, parameters, options, generationId);
    } else if (action === 'refine') {
      if (!generationId) {
        throw new Error('generationId é obrigatório para refine');
      }
      return await this.refineCode(generationId, options);
    } else if (action === 'getGeneration') {
      if (!generationId) {
        throw new Error('generationId é obrigatório para getGeneration');
      }
      return this.getGeneration(generationId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Gera código incrementalmente
   * 
   * @param {string} template - Template ou tipo de código
   * @param {Object} parameters - Parâmetros
   * @param {Object} options - Opções
   * @param {string} generationId - ID da geração (opcional)
   * @returns {Promise<Object>} Resultado da geração
   */
  async generateIncremental(template, parameters, options = {}, generationId = null) {
    const id = generationId || `generation-${Date.now()}`;
    const parts = [];
    const validations = [];

    // Dividir template em partes lógicas
    const templateParts = this.splitTemplate(template, parameters);

    // Gerar cada parte incrementalmente
    for (let i = 0; i < templateParts.length; i++) {
      const part = templateParts[i];
      
      // Gerar parte
      const partCode = await this.generatePart(part, parameters, i);

      // Validar parte
      const partValidation = await this.validatePart(partCode, part.type);

      // Armazenar parte
      const partId = `${id}-part-${i}`;
      this.parts.set(partId, {
        id: partId,
        generationId: id,
        index: i,
        code: partCode,
        type: part.type,
        validation: partValidation
      });

      parts.push({
        id: partId,
        code: partCode,
        validation: partValidation
      });

      validations.push(partValidation);

      // Se parte inválida e não permitir continuar, parar
      if (!partValidation.valid && options.stopOnInvalid !== false) {
        return {
          id,
          complete: false,
          parts,
          validations,
          code: null,
          error: `Parte ${i} inválida: ${partValidation.issues?.[0]?.description || 'Erro desconhecido'}`
        };
      }
    }

    // Combinar partes
    const combinedCode = this.combineParts(parts);

    // Validar código completo
    const finalValidation = await this.validateComplete(combinedCode, validations);

    const result = {
      id,
      complete: true,
      parts,
      validations,
      code: combinedCode,
      finalValidation,
      generatedAt: new Date().toISOString()
    };

    this.generations.set(id, result);

    return result;
  }

  /**
   * Divide template em partes lógicas
   * 
   * @param {string} template - Template
   * @param {Object} parameters - Parâmetros
   * @returns {Array<Object>} Partes do template
   */
  splitTemplate(template, parameters) {
    // Simplificado - em produção analisaria estrutura real
    const parts = [];

    // Parte 1: Imports e declarações
    parts.push({
      type: 'imports',
      template: 'imports'
    });

    // Parte 2: Classe/estrutura principal
    parts.push({
      type: 'structure',
      template: 'class'
    });

    // Parte 3: Métodos
    parts.push({
      type: 'methods',
      template: 'methods'
    });

    return parts;
  }

  /**
   * Gera parte do código
   * 
   * @param {Object} part - Parte do template
   * @param {Object} parameters - Parâmetros
   * @param {number} index - Índice da parte
   * @returns {Promise<string>} Código da parte
   */
  async generatePart(part, parameters, index) {
    // Simplificado - em produção geraria código real baseado no tipo
    switch (part.type) {
      case 'imports':
        return `import BaseSystem from '../../core/BaseSystem.js';`;
      case 'structure':
        return `class ${parameters.className || 'GeneratedClass'} extends BaseSystem {
  constructor() {
    super();
  }`;
      case 'methods':
        return `  async execute(context) {
    // Implementação
  }
}`;
      default:
        return `// Parte ${index}`;
    }
  }

  /**
   * Valida parte do código
   * 
   * @param {string} code - Código da parte
   * @param {string} type - Tipo da parte
   * @returns {Promise<Object>} Resultado da validação
   */
  async validatePart(code, type) {
    const issues = [];

    if (!code || code.trim().length === 0) {
      issues.push({
        type: 'empty_code',
        severity: 'high',
        description: 'Código da parte está vazio'
      });
    }

    // Validações específicas por tipo
    if (type === 'imports' && !/import|require/i.test(code)) {
      issues.push({
        type: 'invalid_imports',
        severity: 'medium',
        description: 'Parte de imports não contém imports válidos'
      });
    }

    if (type === 'structure' && !/class|function/i.test(code)) {
      issues.push({
        type: 'invalid_structure',
        severity: 'high',
        description: 'Parte de estrutura não contém classe ou função'
      });
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Combina partes em código completo
   * 
   * @param {Array<Object>} parts - Partes geradas
   * @returns {string} Código combinado
   */
  combineParts(parts) {
    return parts.map(p => p.code).join('\n\n');
  }

  /**
   * Valida código completo
   * 
   * @param {string} code - Código completo
   * @param {Array<Object>} partValidations - Validações das partes
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateComplete(code, partValidations) {
    const issues = [];

    // Verificar se todas as partes são válidas
    const invalidParts = partValidations.filter(v => !v.valid);
    if (invalidParts.length > 0) {
      issues.push({
        type: 'invalid_parts',
        severity: 'high',
        description: `${invalidParts.length} partes inválidas encontradas`
      });
    }

    // Validação básica do código completo
    if (!code || code.trim().length === 0) {
      issues.push({
        type: 'empty_code',
        severity: 'high',
        description: 'Código completo está vazio'
      });
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Refina código gerado
   * 
   * @param {string} generationId - ID da geração
   * @param {Object} options - Opções de refinamento
   * @returns {Promise<Object>} Código refinado
   */
  async refineCode(generationId, options = {}) {
    const generation = this.generations.get(generationId);

    if (!generation) {
      throw new Error(`Geração não encontrada: ${generationId}`);
    }

    const { code, parts, validations } = generation;

    // Identificar partes que precisam refinamento
    const partsToRefine = parts.filter((p, i) => !validations[i]?.valid);

    if (partsToRefine.length === 0) {
      return {
        ...generation,
        refined: false,
        message: 'Nenhuma parte precisa de refinamento'
      };
    }

    // Refinar cada parte problemática
    const refinedParts = [];
    for (const part of partsToRefine) {
      const refinedCode = await this.refinePart(part.code, part.validation);
      refinedParts.push({
        ...part,
        refinedCode,
        originalCode: part.code
      });
    }

    // Revalidar código refinado
    const refinedCode = this.applyRefinements(code, refinedParts);
    const refinedValidation = await this.validateComplete(refinedCode, validations);

    const result = {
      ...generation,
      refined: true,
      refinedCode,
      refinedParts,
      refinedValidation,
      refinedAt: new Date().toISOString()
    };

    this.generations.set(generationId, result);

    return result;
  }

  /**
   * Refina parte específica
   * 
   * @param {string} code - Código da parte
   * @param {Object} validation - Validação da parte
   * @returns {Promise<string>} Código refinado
   */
  async refinePart(code, validation) {
    // Simplificado - em produção aplicaria correções baseadas nos issues
    let refined = code;

    for (const issue of validation.issues || []) {
      if (issue.type === 'empty_code') {
        refined = '// Código gerado\n' + refined;
      }
      // Adicionar mais refinamentos baseados em issues
    }

    return refined;
  }

  /**
   * Aplica refinamentos ao código completo
   * 
   * @param {string} code - Código original
   * @param {Array<Object>} refinedParts - Partes refinadas
   * @returns {string} Código com refinamentos aplicados
   */
  applyRefinements(code, refinedParts) {
    let refinedCode = code;

    for (const part of refinedParts) {
      // Substituir código original pelo refinado
      refinedCode = refinedCode.replace(part.originalCode, part.refinedCode);
    }

    return refinedCode;
  }

  /**
   * Obtém geração armazenada
   * 
   * @param {string} generationId - ID da geração
   * @returns {Object|null} Geração ou null
   */
  getGeneration(generationId) {
    return this.generations.get(generationId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.generations.values());

    return {
      totalGenerations: all.length,
      completeGenerations: all.filter(g => g.complete).length,
      refinedGenerations: all.filter(g => g.refined).length
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

export default IncrementalCodeGenerator;

/**
 * Factory function para criar IncrementalCodeGenerator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {IncrementalCodeGenerator} Instância do IncrementalCodeGenerator
 */
export function createIncrementalCodeGenerator(config = null, logger = null, errorHandler = null) {
  return new IncrementalCodeGenerator(config, logger, errorHandler);
}
