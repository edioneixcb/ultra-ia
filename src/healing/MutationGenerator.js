/**
 * MutationGenerator
 *
 * Gera variações simples de código para auto-correção.
 */

import { getLogger } from '../utils/Logger.js';

class MutationGenerator {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
  }

  generate(code, errorMessage = '') {
    const mutations = [];

    if (!code || typeof code !== 'string') {
      return mutations;
    }

    if (errorMessage.includes('is not defined')) {
      const match = errorMessage.match(/(\w+) is not defined/);
      if (match) {
        const name = match[1];
        mutations.push(`const ${name} = null;\n${code}`);
      }
    }

    if (errorMessage.includes('cannot read') || errorMessage.includes('undefined')) {
      mutations.push(code.replace(/\.(\w+)/g, '?.$1'));
    }

    if (!/try\s*\{/.test(code)) {
      mutations.push(`try {\n${code}\n} catch (error) {\n  console.error(error);\n}`);
    }

    if (!code.includes('use strict')) {
      mutations.push(`'use strict';\n${code}`);
    }

    return mutations;
  }
}

let instance = null;

/**
 * Obtém instância singleton do MutationGenerator.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {MutationGenerator} Instância
 */
export function getMutationGenerator(config = null, logger = null) {
  if (!instance) {
    instance = new MutationGenerator(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do MutationGenerator.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {MutationGenerator} Nova instância
 */
export function createMutationGenerator(config = null, logger = null) {
  return new MutationGenerator(config, logger);
}

export default MutationGenerator;
