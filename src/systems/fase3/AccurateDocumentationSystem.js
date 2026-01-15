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
import { getCacheManager } from '../../utils/CacheManager.js';

class AccurateDocumentationSystem extends BaseSystem {
  constructor(config = null, logger = null, errorHandler = null, evidenceChainManager = null, astParser = null) {
    super(config, logger, errorHandler);
    this.evidenceChainManager = evidenceChainManager;
    this.astParser = astParser;
    this.useEvidenceChain = config?.features?.useEvidenceChain !== false && evidenceChainManager !== null;
    this.useASTAnalysis = config?.features?.useASTAnalysis !== false && astParser !== null;
    this.cacheManager = null;
    this.useCache = config?.features?.useCache !== false;
  }

  async onInitialize() {
    this.validations = new Map();
    this.documentationCache = new Map();
    this.traceabilityMap = new Map();
    
    // Inicializar cache LRU se habilitado
    if (this.useCache) {
      try {
        this.cacheManager = getCacheManager(this.config, this.logger);
        this.logger?.debug('CacheManager integrado no AccurateDocumentationSystem');
      } catch (e) {
        this.logger?.warn('Erro ao obter CacheManager, continuando sem cache', { error: e.message });
        this.useCache = false;
      }
    }
    
    this.logger?.info('AccurateDocumentationSystem inicializado', {
      useEvidenceChain: this.useEvidenceChain,
      useASTAnalysis: this.useASTAnalysis,
      useCache: this.useCache
    });
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
   * Coleta evidências diretas do codebase usando ASTParser quando disponível (com cache)
   * 
   * @param {Object} claim - Afirmação
   * @param {Object} codebase - Codebase
   * @returns {Promise<Object>} Evidências coletadas
   */
  async collectDirectEvidence(claim, codebase) {
    // Verificar cache se habilitado
    if (this.useCache && this.cacheManager) {
      const cacheKey = `evidence:${claim.type}:${claim.name}:${codebase.hash || 'default'}`;
      const cached = this.cacheManager.get(cacheKey);
      if (cached) {
        this.logger?.debug('Evidência retornada do cache', { claim: claim.name });
        return cached;
      }
    }

    const evidence = {
      found: false,
      location: null,
      code: null,
      matches: [],
      source: 'regex' // ou 'ast' se usar ASTParser
    };

    if (!codebase.files) {
      return evidence;
    }

    // Se ASTParser disponível, usar análise estrutural real
    if (this.useASTAnalysis && this.astParser) {
      for (const [fileName, fileData] of Object.entries(codebase.files)) {
        const fileContent = fileData.content || fileData.code || '';
        if (!fileContent) continue;

        try {
          const astResult = this.astParser.parse(fileContent);
          
          if (astResult.valid && astResult.ast) {
            // Buscar no AST
            const found = this.searchInAST(astResult.ast, claim);
            
            if (found) {
              evidence.found = true;
              evidence.location = fileName;
              evidence.source = 'ast';
              evidence.matches.push({
                type: claim.type,
                name: claim.name,
                file: fileName,
                line: found.line || null,
                column: found.column || null
              });
              
              // Extrair código relevante se possível
              if (found.node) {
                evidence.code = this.extractCodeFromAST(found.node, fileContent);
              }
            }
          }
        } catch (e) {
          this.logger?.warn('Erro ao analisar arquivo com ASTParser, usando regex', {
            file: fileName,
            error: e.message
          });
        }
      }
    }

    // Fallback: busca com regex se AST não encontrou ou não disponível
    if (!evidence.found) {
      for (const [fileName, fileData] of Object.entries(codebase.files)) {
        const fileContent = fileData.content || fileData.code || '';

        if (claim.type === 'function') {
          const functionRegex = new RegExp(`(?:function|const|let)\\s+${claim.name}\\s*[=\\(]`, 'g');
          if (functionRegex.test(fileContent)) {
            evidence.found = true;
            evidence.location = fileName;
            evidence.source = 'regex';
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
            evidence.source = 'regex';
            evidence.matches.push({
              type: 'class',
              name: claim.name,
              file: fileName
            });
          }
        }
      }
    }

    // Se EvidenceChainManager disponível, criar cadeia de evidência
    if (this.useEvidenceChain && this.evidenceChainManager && evidence.found) {
      try {
        const chainId = `doc-evidence-${Date.now()}`;
        await this.evidenceChainManager.execute({
          action: 'create',
          observation: {
            type: 'documentation_claim',
            target: claim.name,
            description: `Validação de afirmação sobre ${claim.name}`
          },
          chainId
        });

        await this.evidenceChainManager.execute({
          action: 'addRawEvidence',
          chainId,
          rawEvidence: evidence
        });

        evidence.chainId = chainId;
      } catch (e) {
        this.logger?.warn('Erro ao criar cadeia de evidência', { error: e.message });
      }
    }

    // Armazenar no cache se habilitado
    if (this.useCache && this.cacheManager) {
      const cacheKey = `evidence:${claim.type}:${claim.name}:${codebase.hash || 'default'}`;
      this.cacheManager.set(cacheKey, evidence, 7200000); // Cache por 2 horas
    }

    return evidence;
  }

  /**
   * Busca afirmação no AST
   * 
   * @param {Object} ast - Árvore AST
   * @param {Object} claim - Afirmação
   * @returns {Object|null} Nó encontrado ou null
   */
  searchInAST(ast, claim) {
    let found = null;

    const walk = (node) => {
      if (found || !node) return;

      if (claim.type === 'function') {
        if ((node.type === 'FunctionDeclaration' && node.id?.name === claim.name) ||
            (node.type === 'FunctionExpression' && node.id?.name === claim.name) ||
            (node.type === 'VariableDeclarator' && node.id?.name === claim.name && 
             (node.init?.type === 'FunctionExpression' || node.init?.type === 'ArrowFunctionExpression'))) {
          found = {
            node,
            line: node.loc?.start?.line,
            column: node.loc?.start?.column
          };
        }
      } else if (claim.type === 'class') {
        if (node.type === 'ClassDeclaration' && node.id?.name === claim.name) {
          found = {
            node,
            line: node.loc?.start?.line,
            column: node.loc?.start?.column
          };
        }
      }

      // Percorrer filhos
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(child => walk(child));
          } else if (node[key].type) {
            walk(node[key]);
          }
        }
      }
    };

    walk(ast);
    return found;
  }

  /**
   * Extrai código relevante do nó AST
   * 
   * @param {Object} node - Nó AST
   * @param {string} fileContent - Conteúdo do arquivo
   * @returns {string} Código extraído
   */
  extractCodeFromAST(node, fileContent) {
    if (node.loc && node.loc.start && node.loc.end) {
      const lines = fileContent.split('\n');
      const startLine = node.loc.start.line - 1;
      const endLine = node.loc.end.line;
      return lines.slice(startLine, endLine).join('\n');
    }
    return null;
  }

  /**
   * Valida afirmação contra evidências com validação cross-reference
   * 
   * @param {Object} claim - Afirmação
   * @param {Object} evidence - Evidências
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateClaim(claim, evidence) {
    const validation = {
      valid: evidence.found,
      claim,
      evidence,
      reason: evidence.found 
        ? 'Evidência encontrada no codebase'
        : 'Evidência não encontrada no codebase',
      crossReferences: []
    };

    // Se evidência encontrada e EvidenceChainManager disponível, validar cadeia
    if (evidence.found && evidence.chainId && this.useEvidenceChain && this.evidenceChainManager) {
      try {
        const chain = await this.evidenceChainManager.execute({
          action: 'get',
          chainId: evidence.chainId
        });

        if (chain) {
          validation.crossReferences.push({
            type: 'evidence_chain',
            chainId: evidence.chainId,
            validated: true
          });
        }
      } catch (e) {
        this.logger?.warn('Erro ao validar cadeia de evidência', { error: e.message });
      }
    }

    // Validar que evidência corresponde exatamente à afirmação
    if (evidence.found && evidence.matches.length > 0) {
      const exactMatch = evidence.matches.some(m => 
        m.name === claim.name && m.type === claim.type
      );
      
      if (!exactMatch) {
        validation.valid = false;
        validation.reason = 'Evidência encontrada mas não corresponde exatamente à afirmação';
      }
    }

    return validation;
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
    return ['logger', 'config', '?EvidenceChainManager', '?ASTParser'];
  }
}

export default AccurateDocumentationSystem;

/**
 * Factory function para criar AccurateDocumentationSystem
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @param {Object} evidenceChainManager - Evidence Chain Manager (opcional)
 * @param {Object} astParser - AST Parser (opcional)
 * @returns {AccurateDocumentationSystem} Instância do AccurateDocumentationSystem
 */
export function createAccurateDocumentationSystem(config = null, logger = null, errorHandler = null, evidenceChainManager = null, astParser = null) {
  return new AccurateDocumentationSystem(config, logger, errorHandler, evidenceChainManager, astParser);
}
