/**
 * Validador Multi-Camadas
 * 
 * Valida código em múltiplas camadas para garantir qualidade:
 * 
 * Camadas:
 * 1. SyntaxValidator - Validação de sintaxe
 * 2. StructureValidator - Validação de estrutura
 * 3. TypeValidator - Validação de tipos (quando aplicável)
 * 4. SecurityValidator - Validação de segurança
 * 5. BestPracticesValidator - Validação de boas práticas
 * 6. TestValidator - Validação de testes
 * 
 * Funcionalidades:
 * - Validação incremental por camada
 * - Relatórios detalhados por camada
 * - Agregação de resultados
 * - Sugestões de correção
 */

import { getConfigLoader } from '../utils/ConfigLoader.js';
import { getLogger } from '../utils/Logger.js';
import { getErrorHandler } from '../utils/ErrorHandler.js';

class MultiLayerValidator {
  constructor(config = null, logger = null, errorHandler = null) {
    // Carregar config se não fornecido
    if (!config) {
      const configLoader = getConfigLoader();
      if (configLoader.config) {
        config = configLoader.get();
      } else {
        configLoader.load();
        config = configLoader.get();
      }
    }

    // Criar logger se não fornecido
    if (!logger) {
      logger = getLogger(config);
    }

    // Criar error handler se não fornecido
    if (!errorHandler) {
      errorHandler = getErrorHandler(config, logger);
    }

    this.config = config;
    this.logger = logger;
    this.errorHandler = errorHandler;

    // Configurações de validação
    this.strictMode = config.validation?.strictMode !== false;
    this.stopOnFirstError = config.validation?.stopOnFirstError === true;
  }

  /**
   * Valida código em todas as camadas
   * @param {string} code - Código a validar
   * @param {object} options - Opções de validação
   * @returns {Promise<object>} Resultado completo da validação
   */
  validate(code, options = {}) {
    const {
      language = 'javascript',
      layers = ['syntax', 'structure', 'security', 'bestPractices'],
      context = null
    } = options;

    this.logger?.info('Iniciando validação multi-camadas', {
      language,
      layers: layers.length,
      codeLength: code.length
    });

    const results = {
      valid: true,
      layers: {},
      errors: [],
      warnings: [],
      suggestions: [],
      score: 0,
      metadata: {
        language,
        layersChecked: [],
        totalIssues: 0
      }
    };

    try {
      // Executar validações por camada
      for (const layer of layers) {
        if (this.stopOnFirstError && !results.valid) {
          break;
        }

        const layerResult = this.validateLayer(code, layer, { language, context });
        results.layers[layer] = layerResult;

        if (layerResult.valid) {
          results.metadata.layersChecked.push(layer);
        } else {
          results.valid = false;
          results.errors.push(...layerResult.errors);
        }

        results.warnings.push(...layerResult.warnings);
        results.suggestions.push(...layerResult.suggestions);
      }

      // Calcular score geral (0-100)
      results.score = this.calculateScore(results.layers);

      // Agregar estatísticas
      results.metadata.totalIssues = results.errors.length + results.warnings.length;

      this.logger?.info('Validação multi-camadas concluída', {
        valid: results.valid,
        score: results.score,
        totalIssues: results.metadata.totalIssues
      });

      return results;

    } catch (error) {
      this.errorHandler?.handleError(error, {
        component: 'MultiLayerValidator',
        operation: 'validate',
        language
      });

      results.valid = false;
      results.errors.push(`Erro durante validação: ${error.message}`);
      return results;
    }
  }

  /**
   * Valida código em uma camada específica
   * @param {string} code - Código a validar
   * @param {string} layer - Nome da camada
   * @param {object} options - Opções
   * @returns {Promise<object>} Resultado da camada
   */
  validateLayer(code, layer, options = {}) {
    const { language = 'javascript', context = null } = options;

    const result = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      score: 0
    };

    try {
      switch (layer) {
        case 'syntax':
          return this.validateSyntax(code, language);
        
        case 'structure':
          return this.validateStructure(code, language);
        
        case 'type':
          return this.validateTypes(code, language);
        
        case 'security':
          return this.validateSecurity(code, language);
        
        case 'bestPractices':
          return this.validateBestPractices(code, language);
        
        case 'test':
          return this.validateTests(code, language);
        
        default:
          result.warnings.push(`Camada de validação desconhecida: ${layer}`);
          return result;
      }
    } catch (error) {
      this.logger?.warn(`Erro na validação da camada ${layer}`, { error: error.message });
      result.valid = false;
      result.errors.push(`Erro na validação: ${error.message}`);
      return result;
    }
  }

  /**
   * Valida sintaxe do código
   * @param {string} code - Código a validar
   * @param {string} language - Linguagem
   * @returns {object} Resultado da validação
   */
  validateSyntax(code, language) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      score: 100
    };

    // Validações básicas de sintaxe por linguagem
    if (language === 'python' || language === 'py') {
      // Verificar indentação consistente
      const lines = code.split('\n');
      const indentations = lines
        .filter(l => l.trim().length > 0)
        .map(l => l.match(/^(\s*)/)?.[1].length || 0);
      
      if (indentations.length > 0) {
        const firstIndent = indentations[0];
        const inconsistent = indentations.some(ind => ind % 4 !== 0 && ind !== 0);
        if (inconsistent) {
          result.warnings.push('Indentação inconsistente detectada');
          result.score -= 10;
        }
      }

      // Verificar parênteses balanceados
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        result.valid = false;
        result.errors.push('Parênteses não balanceados');
        result.score = 0;
      }

    } else if (language === 'javascript' || language === 'typescript') {
      // Verificar chaves balanceadas
      const openBraces = (code.match(/{/g) || []).length;
      const closeBraces = (code.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        result.valid = false;
        result.errors.push('Chaves não balanceadas');
        result.score = 0;
      }

      // Verificar parênteses balanceados
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        result.valid = false;
        result.errors.push('Parênteses não balanceados');
        result.score = 0;
      }

      // Verificar colchetes balanceados
      const openBrackets = (code.match(/\[/g) || []).length;
      const closeBrackets = (code.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        result.valid = false;
        result.errors.push('Colchetes não balanceados');
        result.score = 0;
      }
    }

    return result;
  }

  /**
   * Valida estrutura do código
   * @param {string} code - Código a validar
   * @param {string} language - Linguagem
   * @returns {object} Resultado da validação
   */
  validateStructure(code, language) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      score: 100
    };

    if (language === 'python' || language === 'py') {
      // Verificar se tem pelo menos uma função ou classe
      const hasFunction = /def\s+\w+/.test(code);
      const hasClass = /class\s+\w+/.test(code);

      if (!hasFunction && !hasClass) {
        result.warnings.push('Código não contém funções ou classes definidas');
        result.score -= 20;
      }

      // Verificar docstrings em funções principais
      const functions = code.match(/def\s+(\w+)/g) || [];
      const functionsWithDocstrings = functions.filter(fn => {
        const fnName = fn.match(/def\s+(\w+)/)?.[1];
        const fnIndex = code.indexOf(fn);
        const nextLines = code.substring(fnIndex).split('\n').slice(1, 3);
        return nextLines.some(line => line.trim().startsWith('"""') || line.trim().startsWith("'''"));
      });

      if (functions.length > 0 && functionsWithDocstrings.length < functions.length * 0.5) {
        result.warnings.push('Algumas funções não têm docstrings');
        result.suggestions.push('Adicionar docstrings a todas as funções públicas');
        result.score -= 10;
      }

    } else if (language === 'javascript' || language === 'typescript') {
      // Verificar se tem pelo menos uma função ou classe
      const hasFunction = /function\s+\w+|const\s+\w+\s*=|=>/.test(code);
      const hasClass = /class\s+\w+/.test(code);

      if (!hasFunction && !hasClass) {
        result.warnings.push('Código não contém funções ou classes definidas');
        result.score -= 20;
      }

      // Verificar JSDoc em funções principais
      const functions = code.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=|(\w+)\s*:)/g) || [];
      const functionsWithJSDoc = functions.filter(fn => {
        const fnIndex = code.indexOf(fn);
        const beforeLines = code.substring(0, fnIndex).split('\n').slice(-3);
        return beforeLines.some(line => line.trim().startsWith('/**'));
      });

      if (functions.length > 0 && functionsWithJSDoc.length < functions.length * 0.5) {
        result.warnings.push('Algumas funções não têm JSDoc');
        result.suggestions.push('Adicionar JSDoc a todas as funções públicas');
        result.score -= 10;
      }
    }

    return result;
  }

  /**
   * Valida tipos (quando aplicável)
   * @param {string} code - Código a validar
   * @param {string} language - Linguagem
   * @returns {object} Resultado da validação
   */
  validateTypes(code, language) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      score: 100
    };

    if (language === 'typescript') {
      // Verificar uso de tipos explícitos
      const functions = code.match(/function\s+\w+|const\s+\w+\s*=/g) || [];
      const functionsWithTypes = functions.filter(fn => {
        const fnIndex = code.indexOf(fn);
        const fnCode = code.substring(fnIndex, fnIndex + 200);
        return /:\s*\w+/.test(fnCode);
      });

      if (functions.length > 0 && functionsWithTypes.length < functions.length * 0.7) {
        result.warnings.push('Algumas funções não têm tipos explícitos');
        result.suggestions.push('Adicionar tipos explícitos para melhor type safety');
        result.score -= 15;
      }
    }

    return result;
  }

  /**
   * Valida segurança do código
   * @param {string} code - Código a validar
   * @param {string} language - Linguagem
   * @returns {object} Resultado da validação
   */
  validateSecurity(code, language) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      score: 100
    };

    // Padrões de segurança comuns a evitar
    const securityPatterns = [
      {
        pattern: /eval\s*\(/i,
        severity: 'error',
        message: 'Uso de eval() detectado - risco de segurança',
        suggestion: 'Evitar eval(), usar alternativas seguras'
      },
      {
        pattern: /innerHTML\s*=/i,
        severity: 'warning',
        message: 'Uso de innerHTML detectado - risco de XSS',
        suggestion: 'Considerar usar textContent ou sanitização'
      },
      {
        pattern: /password\s*=\s*['"]\w+['"]/i,
        severity: 'error',
        message: 'Senha hardcoded detectada',
        suggestion: 'Usar variáveis de ambiente ou sistema de configuração seguro'
      },
      {
        pattern: /sql\s*=\s*['"].*\+.*['"]/i,
        severity: 'error',
        message: 'Possível SQL injection detectado',
        suggestion: 'Usar prepared statements ou query builders'
      },
      {
        pattern: /process\.env\.\w+\s*\|\|/i,
        severity: 'warning',
        message: 'Variável de ambiente pode não estar definida',
        suggestion: 'Validar variáveis de ambiente antes de usar'
      }
    ];

    for (const pattern of securityPatterns) {
      if (pattern.pattern.test(code)) {
        if (pattern.severity === 'error') {
          result.valid = false;
          result.errors.push(pattern.message);
          result.score -= 30;
        } else {
          result.warnings.push(pattern.message);
          result.score -= 10;
        }
        result.suggestions.push(pattern.suggestion);
      }
    }

    return result;
  }

  /**
   * Valida boas práticas
   * @param {string} code - Código a validar
   * @param {string} language - Linguagem
   * @returns {object} Resultado da validação
   */
  validateBestPractices(code, language) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      score: 100
    };

    // Verificar tratamento de erros
    const hasErrorHandling = /try\s*\{|catch\s*\(|\.catch\s*\(|if\s*\(.*error/i.test(code);
    if (!hasErrorHandling && code.length > 200) {
      result.warnings.push('Código não parece ter tratamento de erros');
      result.suggestions.push('Adicionar tratamento de erros apropriado');
      result.score -= 15;
    }

    // Verificar nomes descritivos
    const shortNames = code.match(/\b[a-z]{1,2}\b/g) || [];
    const longCode = code.length > 500;
    if (longCode && shortNames.length > 10) {
      result.warnings.push('Muitos nomes de variáveis muito curtos');
      result.suggestions.push('Usar nomes mais descritivos');
      result.score -= 10;
    }

    // Verificar comentários (código complexo deve ter comentários)
    const commentRatio = (code.match(/\/\/|\/\*|#/g) || []).length / code.split('\n').length;
    if (code.length > 300 && commentRatio < 0.05) {
      result.warnings.push('Código complexo sem comentários suficientes');
      result.suggestions.push('Adicionar comentários explicativos');
      result.score -= 10;
    }

    return result;
  }

  /**
   * Valida testes (se presentes)
   * @param {string} code - Código a validar
   * @param {string} language - Linguagem
   * @returns {object} Resultado da validação
   */
  validateTests(code, language) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      score: 100
    };

    // Verificar se há testes
    const hasTests = /test|spec|describe|it\(|assert|expect/.test(code.toLowerCase());
    
    if (!hasTests && code.length > 200) {
      result.warnings.push('Código não parece ter testes');
      result.suggestions.push('Adicionar testes unitários');
      result.score -= 20;
    }

    return result;
  }

  /**
   * Calcula score geral baseado nos resultados das camadas
   * @param {object} layers - Resultados por camada
   * @returns {number} Score geral (0-100)
   */
  calculateScore(layers) {
    const layerNames = Object.keys(layers);
    if (layerNames.length === 0) {
      return 0;
    }

    const totalScore = layerNames.reduce((sum, layer) => {
      return sum + (layers[layer].score || 0);
    }, 0);

    return Math.round(totalScore / layerNames.length);
  }

  /**
   * Gera relatório de validação formatado
   * @param {object} validationResult - Resultado da validação
   * @returns {string} Relatório formatado
   */
  generateReport(validationResult) {
    let report = `\n=== RELATÓRIO DE VALIDAÇÃO ===\n\n`;
    report += `Status: ${validationResult.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n`;
    report += `Score: ${validationResult.score}/100\n`;
    report += `Linguagem: ${validationResult.metadata.language}\n`;
    report += `Camadas verificadas: ${validationResult.metadata.layersChecked.join(', ')}\n`;
    report += `Total de problemas: ${validationResult.metadata.totalIssues}\n\n`;

    if (validationResult.errors.length > 0) {
      report += `ERROS (${validationResult.errors.length}):\n`;
      validationResult.errors.forEach((error, idx) => {
        report += `  ${idx + 1}. ${error}\n`;
      });
      report += `\n`;
    }

    if (validationResult.warnings.length > 0) {
      report += `AVISOS (${validationResult.warnings.length}):\n`;
      validationResult.warnings.forEach((warning, idx) => {
        report += `  ${idx + 1}. ${warning}\n`;
      });
      report += `\n`;
    }

    if (validationResult.suggestions.length > 0) {
      report += `SUGESTÕES (${validationResult.suggestions.length}):\n`;
      validationResult.suggestions.forEach((suggestion, idx) => {
        report += `  ${idx + 1}. ${suggestion}\n`;
      });
      report += `\n`;
    }

    return report;
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do MultiLayerValidator
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @param {object} errorHandler - ErrorHandler (opcional)
 * @returns {MultiLayerValidator} Instância
 */
export function getValidator(config = null, logger = null, errorHandler = null) {
  if (!instance) {
    instance = new MultiLayerValidator(config, logger, errorHandler);
  }
  return instance;
}

/**
 * Cria nova instância do MultiLayerValidator
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @param {object} errorHandler - ErrorHandler
 * @returns {MultiLayerValidator} Nova instância
 */
export function createValidator(config = null, logger = null, errorHandler = null) {
  return new MultiLayerValidator(config, logger, errorHandler);
}

export default MultiLayerValidator;
