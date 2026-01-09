/**
 * Gerador de Código Estruturado
 * 
 * Gera código seguindo templates e padrões estruturais:
 * 
 * Funcionalidades:
 * - Templates para padrões comuns
 * - Geração baseada em AST (estrutura)
 * - Type-driven generation
 * - Validação de estrutura antes de gerar
 * - Geração incremental (função por função)
 * 
 * Padrões Suportados:
 * - Funções simples
 * - Classes
 * - Módulos/arquivos completos
 * - Testes unitários
 * - APIs REST
 */

import { getConfigLoader } from '../utils/ConfigLoader.js';
import { getLogger } from '../utils/Logger.js';
import { getErrorHandler } from '../utils/ErrorHandler.js';

class StructuredCodeGenerator {
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

    // Templates pré-definidos
    this.templates = this.initializeTemplates();
  }

  /**
   * Inicializa templates de código
   * @returns {object} Templates organizados por tipo
   */
  initializeTemplates() {
    return {
      function: {
        python: `def {name}({params}):
    """
    {description}
    
    Args:
{args_doc}
    
    Returns:
        {return_type}: {return_description}
    """
    {body}
    return {return_value}`,

        javascript: `/**
 * {description}
 * 
 * @param {params_jsdoc}
 * @returns {return_type} {return_description}
 */
function {name}({params}) {
    {body}
    return {return_value};
}`,

        typescript: `/**
 * {description}
 * 
 * @param {params_jsdoc}
 * @returns {return_type} {return_description}
 */
function {name}({params}): {return_type} {
    {body}
    return {return_value};
}`
      },

      class: {
        python: `class {name}:
    """
    {description}
    """
    
    def __init__(self{init_params}):
        """
        Inicializa {name}
        
        Args:
{init_args_doc}
        """
{init_body}
    
    {methods}`,

        javascript: `/**
 * {description}
 */
class {name} {
    constructor({init_params}) {
{init_body}
    }
    
    {methods}
}`,

        typescript: `/**
 * {description}
 */
class {name} {
    {properties}
    
    constructor({init_params}) {
{init_body}
    }
    
    {methods}
}`
      },

      test: {
        python: `import unittest
from {module} import {imports}

class Test{name}(unittest.TestCase):
    """
    Testes para {name}
    """
    
    def setUp(self):
        """Configuração antes de cada teste"""
        {setup}
    
    def test_{test_name}(self):
        """Testa {test_description}"""
        {test_body}
        self.assertEqual({expected}, {actual})
    
    def tearDown(self):
        """Limpeza após cada teste"""
        {teardown}`,

        javascript: `import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { {imports} } from '{module}';

describe('{name}', () => {
    let {instance};
    
    beforeEach(() => {
        {setup}
    });
    
    it('should {test_description}', () => {
        {test_body}
        expect({actual}).toBe({expected});
    });
    
    afterEach(() => {
        {teardown}
    });
});`
      }
    };
  }

  /**
   * Gera código estruturado baseado em especificação
   * @param {object} spec - Especificação do código a gerar
   * @returns {string} Código gerado
   */
  generate(spec) {
    const {
      type = 'function',
      language = 'javascript',
      name,
      description = '',
      params = [],
      returnType = 'void',
      body = '',
      properties = [],
      methods = []
    } = spec;

    this.logger?.info('Gerando código estruturado', {
      type,
      language,
      name
    });

    try {
      switch (type) {
        case 'function':
          return this.generateFunction({ name, description, params, returnType, body, language });
        
        case 'class':
          return this.generateClass({ name, description, params, properties, methods, language });
        
        case 'test':
          return this.generateTest({ name, description, language, ...spec });
        
        case 'module':
          return this.generateModule({ name, description, language, ...spec });
        
        default:
          throw new Error(`Tipo de código não suportado: ${type}`);
      }
    } catch (error) {
      this.errorHandler?.handleError(error, {
        component: 'StructuredCodeGenerator',
        operation: 'generate',
        type,
        language
      });
      throw error;
    }
  }

  /**
   * Gera função estruturada
   * @param {object} spec - Especificação da função
   * @returns {string} Código da função
   */
  generateFunction(spec) {
    const {
      name,
      description,
      params = [],
      returnType = 'void',
      body = '',
      language = 'javascript'
    } = spec;

    const template = this.templates.function[language];
    if (!template) {
      throw new Error(`Template não encontrado para função em ${language}`);
    }

    // Preparar parâmetros
    const paramsStr = params.map(p => {
      if (typeof p === 'string') return p;
      return p.name + (p.type ? `: ${p.type}` : '') + (p.default ? ` = ${p.default}` : '');
    }).join(', ');

    // Preparar documentação de parâmetros
    let argsDoc = '';
    let paramsJSDoc = '';
    
    if (language === 'python') {
      argsDoc = params.map(p => {
        const pName = typeof p === 'string' ? p : p.name;
        const pType = typeof p === 'object' && p.type ? p.type : 'any';
        const pDesc = typeof p === 'object' && p.description ? p.description : '';
        return `        ${pName} (${pType}): ${pDesc}`;
      }).join('\n');
    } else {
      paramsJSDoc = params.map(p => {
        const pName = typeof p === 'string' ? p : p.name;
        const pType = typeof p === 'object' && p.type ? p.type : 'any';
        return `{${pType}} ${pName}`;
      }).join(' ');
    }

    // Substituir placeholders
    let code = template
      .replace(/{name}/g, name)
      .replace(/{description}/g, description || `Função ${name}`)
      .replace(/{params}/g, paramsStr)
      .replace(/{args_doc}/g, argsDoc || '        None')
      .replace(/{params_jsdoc}/g, paramsJSDoc || '')
      .replace(/{return_type}/g, returnType)
      .replace(/{return_description}/g, returnType !== 'void' ? 'Resultado' : '')
      .replace(/{body}/g, body || '    pass')
      .replace(/{return_value}/g, returnType !== 'void' ? 'result' : '');

    return code;
  }

  /**
   * Gera classe estruturada
   * @param {object} spec - Especificação da classe
   * @returns {string} Código da classe
   */
  generateClass(spec) {
    const {
      name,
      description,
      params = [],
      properties = [],
      methods = [],
      language = 'javascript'
    } = spec;

    const template = this.templates.class[language];
    if (!template) {
      throw new Error(`Template não encontrado para classe em ${language}`);
    }

    // Preparar parâmetros do construtor
    const initParams = params.map(p => {
      if (typeof p === 'string') return p;
      return p.name + (p.type ? `: ${p.type}` : '') + (p.default ? ` = ${p.default}` : '');
    }).join(', ');

    // Preparar corpo do construtor
    let initBody = '';
    let initArgsDoc = '';
    
    if (language === 'python') {
      initBody = params.map(p => {
        const pName = typeof p === 'string' ? p : p.name;
        return `        self.${pName} = ${pName}`;
      }).join('\n');
      initArgsDoc = params.map(p => {
        const pName = typeof p === 'string' ? p : p.name;
        const pType = typeof p === 'object' && p.type ? p.type : 'any';
        return `            ${pName} (${pType}): ${pName}`;
      }).join('\n');
    } else {
      initBody = params.map(p => {
        const pName = typeof p === 'string' ? p : p.name;
        return `        this.${pName} = ${pName};`;
      }).join('\n');
    }

    // Preparar propriedades (TypeScript)
    let propertiesStr = '';
    if (language === 'typescript') {
      propertiesStr = properties.map(p => {
        const pName = typeof p === 'string' ? p : p.name;
        const pType = typeof p === 'object' && p.type ? p.type : 'any';
        return `    private ${pName}: ${pType};`;
      }).join('\n');
    }

    // Preparar métodos
    const methodsStr = methods.map(m => {
      if (typeof m === 'string') return m;
      return this.generateFunction({
        name: m.name,
        description: m.description || '',
        params: m.params || [],
        returnType: m.returnType || 'void',
        body: m.body || '',
        language
      });
    }).join('\n\n    ');

    // Substituir placeholders
    let code = template
      .replace(/{name}/g, name)
      .replace(/{description}/g, description || `Classe ${name}`)
      .replace(/{init_params}/g, initParams ? ', ' + initParams : '')
      .replace(/{init_args_doc}/g, initArgsDoc || '            None')
      .replace(/{init_body}/g, initBody || '        pass')
      .replace(/{properties}/g, propertiesStr)
      .replace(/{methods}/g, methodsStr || 'pass');

    return code;
  }

  /**
   * Gera teste estruturado
   * @param {object} spec - Especificação do teste
   * @returns {string} Código do teste
   */
  generateTest(spec) {
    const {
      name,
      description,
      language = 'javascript',
      module = './module',
      imports = [],
      setup = '',
      testName = 'basic',
      testDescription = 'work correctly',
      testBody = '',
      expected = 'result',
      actual = 'result',
      teardown = '',
      instance = 'instance'
    } = spec;

    const template = this.templates.test[language];
    if (!template) {
      throw new Error(`Template não encontrado para teste em ${language}`);
    }

    const importsStr = imports.join(', ');

    // Substituir placeholders
    let code = template
      .replace(/{name}/g, name)
      .replace(/{description}/g, description || `Testes para ${name}`)
      .replace(/{module}/g, module)
      .replace(/{imports}/g, importsStr || name)
      .replace(/{setup}/g, setup || 'pass')
      .replace(/{test_name}/g, testName)
      .replace(/{test_description}/g, testDescription)
      .replace(/{test_body}/g, testBody || `result = ${name}()`)
      .replace(/{expected}/g, expected)
      .replace(/{actual}/g, actual)
      .replace(/{teardown}/g, teardown || 'pass')
      .replace(/{instance}/g, instance);

    return code;
  }

  /**
   * Gera módulo completo
   * @param {object} spec - Especificação do módulo
   * @returns {string} Código do módulo
   */
  generateModule(spec) {
    const {
      name,
      description = '',
      language = 'javascript',
      imports = [],
      exports = [],
      functions = [],
      classes = []
    } = spec;

    let code = '';

    // Adicionar imports
    if (language === 'python') {
      imports.forEach(imp => {
        code += `import ${imp}\n`;
      });
    } else {
      imports.forEach(imp => {
        if (typeof imp === 'string') {
          code += `import ${imp};\n`;
        } else {
          code += `import { ${imp.items.join(', ')} } from '${imp.from}';\n`;
        }
      });
    }

    if (imports.length > 0) {
      code += '\n';
    }

    // Adicionar descrição/comentário do módulo
    if (description) {
      if (language === 'python') {
        code += `"""\n${description}\n"""\n\n`;
      } else {
        code += `/**\n * ${description}\n */\n\n`;
      }
    }

    // Adicionar funções
    functions.forEach(fn => {
      code += this.generateFunction({ ...fn, language }) + '\n\n';
    });

    // Adicionar classes
    classes.forEach(cls => {
      code += this.generateClass({ ...cls, language }) + '\n\n';
    });

    // Adicionar exports
    if (language === 'javascript' || language === 'typescript') {
      if (exports.length > 0) {
        code += `export { ${exports.join(', ')} };\n`;
      }
    }

    return code.trim();
  }

  /**
   * Valida estrutura antes de gerar
   * @param {object} spec - Especificação
   * @returns {object} Resultado da validação
   */
  validateSpec(spec) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!spec.type) {
      result.valid = false;
      result.errors.push('Tipo não especificado');
    }

    if (!spec.name) {
      result.valid = false;
      result.errors.push('Nome não especificado');
    }

    if (!spec.language) {
      result.warnings.push('Linguagem não especificada, usando padrão');
    }

    const supportedTypes = ['function', 'class', 'test', 'module'];
    if (spec.type && !supportedTypes.includes(spec.type)) {
      result.valid = false;
      result.errors.push(`Tipo não suportado: ${spec.type}`);
    }

    const supportedLanguages = ['python', 'javascript', 'typescript'];
    if (spec.language && !supportedLanguages.includes(spec.language)) {
      result.warnings.push(`Linguagem pode não ser totalmente suportada: ${spec.language}`);
    }

    return result;
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do StructuredCodeGenerator
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @param {object} errorHandler - ErrorHandler (opcional)
 * @returns {StructuredCodeGenerator} Instância
 */
export function getStructuredGenerator(config = null, logger = null, errorHandler = null) {
  if (!instance) {
    instance = new StructuredCodeGenerator(config, logger, errorHandler);
  }
  return instance;
}

/**
 * Cria nova instância do StructuredCodeGenerator
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @param {object} errorHandler - ErrorHandler
 * @returns {StructuredCodeGenerator} Nova instância
 */
export function createStructuredGenerator(config = null, logger = null, errorHandler = null) {
  return new StructuredCodeGenerator(config, logger, errorHandler);
}

export default StructuredCodeGenerator;
