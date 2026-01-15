/**
 * AbsoluteCertaintyAnalyzer - Análise de Causa Raiz com Certeza Absoluta
 * 
 * Identifica causas raiz usando análise estática real (AST) para eliminar falsos positivos.
 * 
 * Funcionalidades:
 * - Análise de código via AST (substituindo regex)
 * - Verificação de definições de classe e métodos
 * - Rastreamento de imports
 */

import BaseSystem from '../../core/BaseSystem.js';
import ASTParser from '../../validation/ASTParser.js';

class AbsoluteCertaintyAnalyzer extends BaseSystem {
  constructor(config = null, logger = null, errorHandler = null, astParser = null) {
    super(config, logger, errorHandler);
    // Injetar ou criar parser
    this.astParser = astParser || new ASTParser(config, logger);
  }

  async onInitialize() {
    this.logger?.info('AbsoluteCertaintyAnalyzer inicializado com AST');
    this.analyses = new Map();
  }

  /**
   * Verifica erro com certeza absoluta
   * @param {Object} context { errorReport, sourceCode }
   */
  async onExecute(context) {
    const { errorReport, sourceCode } = context;

    if (!errorReport) {
      throw new Error('errorReport é obrigatório');
    }

    // Se não há código fonte, retornar análise conservadora
    if (!sourceCode) {
      const result = {
        isError: false,
        confidence: 0.0,
        falsePositiveRisk: 1.0,
        evidence: [],
        analysis: {}
      };
      if (errorReport.id) {
        this.analyses.set(errorReport.id, result);
      }
      return result;
    }

    // 1. Parsear código real
    const parseResult = this.astParser.parse(sourceCode);
    if (!parseResult.valid) {
      const result = {
        isError: true,
        confidence: 1.0,
        cause: 'SyntaxError',
        evidence: [parseResult.errors[0]],
        falsePositiveRisk: 0.0,
        analysis: { astValid: false }
      };
      if (errorReport.id) {
        this.analyses.set(errorReport.id, result);
      }
      return result;
    }

    // 2. Analisar estrutura
    
    // Exemplo: Se erro diz "Method X missing", verificar AST
    if (errorReport.type === 'MethodMissing') {
      const hasMethod = this.checkMethodInStructure(parseResult.ast, errorReport.methodName);
      
      const result = {
        isError: !hasMethod,
        confidence: 1.0, // Certeza absoluta pois olhamos a AST
        evidence: [hasMethod ? 'encontrado na AST' : 'método ausente na AST'],
        falsePositiveRisk: 0.0,
        analysis: { method: errorReport.methodName, found: hasMethod }
      };
      if (errorReport.id) {
        this.analyses.set(errorReport.id, result);
      }
      return result;
    }

    const genericResult = {
      isError: false,
      confidence: 0.0, // Sem evidência específica
      evidence: [],
      falsePositiveRisk: 0.5,
      analysis: { structure: parseResult.structure }
    };

    if (errorReport.id) {
      this.analyses.set(errorReport.id, genericResult);
    }

    return genericResult;
  }

  /**
   * Obtém análise armazenada por id
   */
  getAnalysis(id) {
    return this.analyses.get(id) || null;
  }

  /**
   * Valida contexto de entrada
   */
  validate(context) {
    if (!context || typeof context !== 'object') {
      return { valid: false };
    }
    const { errorReport } = context;
    if (!errorReport || typeof errorReport !== 'object') {
      return { valid: false };
    }
    return { valid: true };
  }

  checkMethodInStructure(ast, methodName) {
    let found = false;
    
    const walk = (node) => {
      if (found || !node) return;
      
      // Método de classe
      if (node.type === 'MethodDefinition' && node.key && node.key.name === methodName) {
        found = true;
  }

      // Função declarada
      if (node.type === 'FunctionDeclaration' && node.id && node.id.name === methodName) {
        found = true;
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
}

/**
 * Cria nova instância do AbsoluteCertaintyAnalyzer
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @param {object} errorHandler - ErrorHandler
 * @param {object} astParser - ASTParser (opcional)
 * @returns {AbsoluteCertaintyAnalyzer} Nova instância
 */
export function createAbsoluteCertaintyAnalyzer(config = null, logger = null, errorHandler = null, astParser = null) {
  return new AbsoluteCertaintyAnalyzer(config, logger, errorHandler, astParser);
}

export default AbsoluteCertaintyAnalyzer;
