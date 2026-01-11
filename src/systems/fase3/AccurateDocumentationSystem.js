/**
 * AccurateDocumentationSystem - Sistema de Documentação Precisa com Validação Cross-Reference
 * 
 * Mantém documentação atualizada e precisa com validação de evidências diretas.
 * 
 * Funcionalidades:
 * - Validação de Documentação com Evidências Diretas (verificar código-fonte diretamente antes de documentar)
 * - Atualização Automática de Documentação (detectar quando documentação está desatualizada)
 * - Rastreabilidade Entre Documentos (rastrear origem de informações em documentos)
 * 
 * Métricas de Sucesso:
 * - 100% da documentação é precisa e atualizada
 * - 0% de falsos positivos em documentação
 * - 100% da documentação validada com evidências diretas
 */

import BaseSystem from '../../core/BaseSystem.js';

class AccurateDocumentationSystem extends BaseSystem {
  async onInitialize() {
    this.validations = new Map();
    this.documentationCache = new Map();
    this.traceabilityMap = new Map();
    this.logger?.info('AccurateDocumentationSystem inicializado');
  }

  /**
   * Valida ou atualiza documentação
   * 
   * @param {Object} context - Contexto com documentation, codebase e action
   * @returns {Promise<Object>} Resultado da validação ou atualização
   */
  async onExecute(context) {
    const { action, documentation, codebase, validationId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'validate') {
      if (!documentation || !codebase) {
        throw new Error('documentation e codebase são obrigatórios para validate');
      }
      return await this.validateDocumentationWithEvidence(documentation, codebase, validationId);
    } else if (action === 'detectOutdated') {
      if (!documentation || !codebase) {
        throw new Error('documentation e codebase são obrigatórios para detectOutdated');
      }
      return await this.detectOutdatedDocumentation(documentation, codebase, validationId);
    } else if (action === 'traceOrigin') {
      if (!documentation) {
        throw new Error('documentation é obrigatório para traceOrigin');
      }
      return await this.traceDocumentationOrigin(documentation, validationId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Valida documentação com evidências diretas
   * 
   * @param {Object} documentation - Documentação
   * @param {Object} codebase - Codebase
   * @param {string} validationId - ID da validação (opcional)
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateDocumentationWithEvidence(documentation, codebase, validationId = null) {
    // Extrair afirmações da documentação
    const claims = await this.extractClaims(documentation);

    const validations = [];

    // Validar cada afirmação com evidências diretas
    for (const claim of claims) {
      const evidence = await this.collectDirectEvidence(claim, codebase);
      const validation = await this.validateClaim(claim, evidence);
      validations.push({ claim, evidence, validation });
    }

    // Calcular taxa de precisão
    const accuracyRate = await this.calculateAccuracyRate(validations);

    // Identificar falsos positivos
    const falsePositives = await this.identifyFalsePositives(validations);

    const result = {
      accurate: accuracyRate === 1.0,
      accuracyRate,
      validations,
      falsePositives,
      recommendations: await this.generateCorrectionRecommendations(validations),
      totalClaims: claims.length,
      validatedClaims: validations.filter(v => v.validation.valid).length
    };

    // Armazenar validação
    const id = validationId || `validation-${Date.now()}`;
    this.validations.set(id, {
      ...result,
      documentation,
      codebase,
      validatedAt: new Date().toISOString()
    });

    return result;
  }

  /**
   * Extrai afirmações da documentação
   * 
   * @param {Object} documentation - Documentação
   * @returns {Promise<Array<Object>>} Afirmações extraídas
   */
  async extractClaims(documentation) {
    const claims = [];

    if (!documentation.content) {
      return claims;
    }

    // Extrair afirmações sobre funções, classes, APIs
    const functionClaims = this.extractFunctionClaims(documentation.content);
    const classClaims = this.extractClassClaims(documentation.content);
    const apiClaims = this.extractAPIClaims(documentation.content);

    claims.push(...functionClaims, ...classClaims, ...apiClaims);

    return claims;
  }

  /**
   * Extrai afirmações sobre funções
   * 
   * @param {string} content - Conteúdo da documentação
   * @returns {Array<Object>} Afirmações sobre funções
   */
  extractFunctionClaims(content) {
    const claims = [];
    const functionRegex = /(?:function|const|let)\s+(\w+)\s*[=\(]/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      claims.push({
        type: 'function',
        name: match[1],
        description: `Função ${match[1]} mencionada na documentação`
      });
    }

    return claims;
  }

  /**
   * Extrai afirmações sobre classes
   * 
   * @param {string} content - Conteúdo da documentação
   * @returns {Array<Object>} Afirmações sobre classes
   */
  extractClassClaims(content) {
    const claims = [];
    const classRegex = /class\s+(\w+)/g;
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      claims.push({
        type: 'class',
        name: match[1],
        description: `Classe ${match[1]} mencionada na documentação`
      });
    }

    return claims;
  }

  /**
   * Extrai afirmações sobre APIs
   * 
   * @param {string} content - Conteúdo da documentação
   * @returns {Array<Object>} Afirmações sobre APIs
   */
  extractAPIClaims(content) {
    const claims = [];
    const apiRegex = /(?:API|endpoint|route)\s+['"]?([\/\w-]+)['"]?/gi;
    let match;

    while ((match = apiRegex.exec(content)) !== null) {
      claims.push({
        type: 'api',
        name: match[1],
        description: `API ${match[1]} mencionada na documentação`
      });
    }

    return claims;
  }

  /**
   * Coleta evidências diretas do codebase
   * 
   * @param {Object} claim - Afirmação
   * @param {Object} codebase - Codebase
   * @returns {Promise<Object>} Evidências coletadas
   */
  async collectDirectEvidence(claim, codebase) {
    const evidence = {
      found: false,
      location: null,
      code: null,
      matches: []
    };

    if (!codebase.files) {
      return evidence;
    }

    // Buscar no codebase
    for (const [fileName, fileData] of Object.entries(codebase.files)) {
      const fileContent = fileData.content || fileData.code || '';

      if (claim.type === 'function') {
        const functionRegex = new RegExp(`(?:function|const|let)\\s+${claim.name}\\s*[=\\(]`, 'g');
        if (functionRegex.test(fileContent)) {
          evidence.found = true;
          evidence.location = fileName;
          evidence.matches.push({
            type: 'function',
            name: claim.name,
            file: fileName
          });
        }
      } else if (claim.type === 'class') {
        const classRegex = new RegExp(`class\\s+${claim.name}`, 'g');
        if (classRegex.test(fileContent)) {
          evidence.found = true;
          evidence.location = fileName;
          evidence.matches.push({
            type: 'class',
            name: claim.name,
            file: fileName
          });
        }
      }
    }

    return evidence;
  }

  /**
   * Valida afirmação contra evidências
   * 
   * @param {Object} claim - Afirmação
   * @param {Object} evidence - Evidências
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateClaim(claim, evidence) {
    return {
      valid: evidence.found,
      claim,
      evidence,
      reason: evidence.found 
        ? 'Evidência encontrada no codebase'
        : 'Evidência não encontrada no codebase'
    };
  }

  /**
   * Calcula taxa de precisão
   * 
   * @param {Array<Object>} validations - Validações
   * @returns {Promise<number>} Taxa de precisão (0-1)
   */
  async calculateAccuracyRate(validations) {
    if (validations.length === 0) {
      return 1.0;
    }

    const validCount = validations.filter(v => v.validation.valid).length;
    return validCount / validations.length;
  }

  /**
   * Identifica falsos positivos
   * 
   * @param {Array<Object>} validations - Validações
   * @returns {Promise<Array<Object>>} Falsos positivos encontrados
   */
  async identifyFalsePositives(validations) {
    return validations
      .filter(v => v.validation.valid && !v.evidence.found)
      .map(v => ({
        claim: v.claim,
        reason: 'Marcado como válido mas evidência não encontrada'
      }));
  }

  /**
   * Gera recomendações de correção
   * 
   * @param {Array<Object>} validations - Validações
   * @returns {Promise<Array<Object>>} Recomendações
   */
  async generateCorrectionRecommendations(validations) {
    const recommendations = [];

    for (const validation of validations) {
      if (!validation.validation.valid) {
        recommendations.push({
          claim: validation.claim,
          recommendation: `Remover ou corrigir afirmação sobre ${validation.claim.name} - não encontrada no codebase`,
          priority: 'high'
        });
      }
    }

    return recommendations;
  }

  /**
   * Detecta documentação desatualizada
   * 
   * @param {Object} documentation - Documentação
   * @param {Object} codebase - Codebase
   * @param {string} validationId - ID da validação (opcional)
   * @returns {Promise<Object>} Documentação desatualizada detectada
   */
  async detectOutdatedDocumentation(documentation, codebase, validationId = null) {
    // Validar documentação primeiro
    const validation = await this.validateDocumentationWithEvidence(documentation, codebase);

    const outdated = {
      isOutdated: !validation.accurate,
      outdatedClaims: validation.validations
        .filter(v => !v.validation.valid)
        .map(v => v.claim),
      accuracyRate: validation.accuracyRate,
      recommendations: validation.recommendations
    };

    return outdated;
  }

  /**
   * Rastreia origem da documentação
   * 
   * @param {Object} documentation - Documentação
   * @param {string} validationId - ID da validação (opcional)
   * @returns {Promise<Object>} Rastreabilidade
   */
  async traceDocumentationOrigin(documentation, validationId = null) {
    const traceability = {
      sources: [],
      references: [],
      lastUpdated: documentation.lastUpdated || documentation.updatedAt || null
    };

    // Extrair referências
    if (documentation.content) {
      const referenceRegex = /(?:see|refer|source|from):\s*([^\n]+)/gi;
      let match;

      while ((match = referenceRegex.exec(documentation.content)) !== null) {
        traceability.references.push({
          type: 'reference',
          source: match[1].trim()
        });
      }
    }

    // Verificar cache de rastreabilidade
    const docId = documentation.id || documentation.name;
    if (this.traceabilityMap.has(docId)) {
      traceability.sources = this.traceabilityMap.get(docId);
    }

    return traceability;
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
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.validations.values());
    const averageAccuracy = all.length > 0
      ? all.reduce((sum, v) => sum + (v.accuracyRate || 0), 0) / all.length
      : 0;

    return {
      totalValidations: all.length,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      accurateDocs: all.filter(v => v.accurate).length
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

export default AccurateDocumentationSystem;

/**
 * Factory function para criar AccurateDocumentationSystem
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {AccurateDocumentationSystem} Instância do AccurateDocumentationSystem
 */
export function createAccurateDocumentationSystem(config = null, logger = null, errorHandler = null) {
  return new AccurateDocumentationSystem(config, logger, errorHandler);
}
