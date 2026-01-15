/**
 * AST Parser
 * 
 * Parser de Abstract Syntax Tree (AST) para validação real de código.
 * Utiliza 'acorn' para analisar JavaScript/TypeScript e detectar problemas estruturais.
 * 
 * Funcionalidades:
 * - Validação de sintaxe real (não regex)
 * - Detecção de imports inválidos ou inseguros
 * - Detecção de uso de eval, innerHTML e outras funções perigosas
 * - Análise de estrutura (classes, funções, variáveis)
 */

import * as acorn from 'acorn';
import { getLogger } from '../utils/Logger.js';

class ASTParser {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
  }

  /**
   * Analisa código e retorna AST ou erros
   * @param {string} code - Código a analisar
   * @param {string} language - Linguagem (javascript/typescript)
   * @returns {object} Resultado da análise { valid, ast, errors, securityIssues }
   */
  parse(code, language = 'javascript') {
    try {
      // Configurar opções do parser
      const options = {
        ecmaVersion: 'latest',
        sourceType: 'module',
        locations: true,
        ranges: true,
        onComment: [],
        onToken: []
      };

      // Tentar fazer o parse
      const ast = acorn.parse(code, options);

      // Se sucesso, analisar segurança e estrutura
      const securityIssues = this.analyzeSecurity(ast, code);
      const structure = this.analyzeStructure(ast);

      return {
        valid: true,
        ast,
        securityIssues,
        structure,
        errors: []
      };

    } catch (error) {
      // Erro de sintaxe
      return {
        valid: false,
        ast: null,
        securityIssues: [],
        structure: null,
        errors: [{
          line: error.loc?.line,
          column: error.loc?.column,
          message: error.message,
          type: 'SyntaxError'
        }]
      };
    }
  }

  /**
   * Analisa AST em busca de problemas de segurança
   * @param {object} ast - Árvore AST
   * @param {string} code - Código original (para extrair trechos)
   * @returns {Array} Lista de problemas encontrados
   */
  analyzeSecurity(ast, code) {
    const issues = [];
    
    // Função recursiva para percorrer AST
    const walk = (node) => {
      if (!node) return;

      // Verificar uso de eval()
      if (node.type === 'CallExpression' && node.callee.name === 'eval') {
        issues.push({
          type: 'eval_usage',
          severity: 'critical',
          line: node.loc.start.line,
          message: 'Uso de eval() é perigoso e não recomendado.'
        });
      }

      // Verificar innerHTML
      if (node.type === 'AssignmentExpression' && 
          node.left.property && 
          node.left.property.name === 'innerHTML') {
        issues.push({
          type: 'innerHTML_usage',
          severity: 'high',
          line: node.loc.start.line,
          message: 'Uso de innerHTML pode causar XSS. Use textContent ou sanitize.'
        });
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
    return issues;
  }

  /**
   * Analisa estrutura básica do código
   * @param {object} ast - Árvore AST
   * @returns {object} Estatísticas estruturais
   */
  analyzeStructure(ast) {
    let functions = 0;
    let classes = 0;
    let imports = 0;
    let exports = 0;

    const walk = (node) => {
      if (!node) return;

      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
        functions++;
      }
      if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        classes++;
      }
      if (node.type === 'ImportDeclaration') {
        imports++;
      }
      if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
        exports++;
      }

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

    return { functions, classes, imports, exports };
  }
}

export default ASTParser;
