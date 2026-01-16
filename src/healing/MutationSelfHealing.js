/**
 * MutationSelfHealing
 *
 * Executa auto-correção através de mutações e sandbox.
 */

import { getLogger } from '../utils/Logger.js';
import { getMutationGenerator } from './MutationGenerator.js';
import { getSandboxExecutor } from './SandboxExecutor.js';

class MutationSelfHealing {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.generator = getMutationGenerator(config, this.logger);
    this.sandbox = getSandboxExecutor(config, this.logger);
    this.maxMutations = config?.proactive?.selfHealing?.maxMutations || 5;
  }

  async heal(code, errorMessage = '', options = {}) {
    const maxMutations = options.maxMutations || this.maxMutations;
    const mutations = this.generator.generate(code, errorMessage).slice(0, maxMutations);

    for (const candidate of mutations) {
      const result = await this.sandbox.execute(candidate, {
        language: options.language || 'javascript',
        timeout: options.timeout || 5000,
        expectedOutput: options.expectedOutput || null
      });
      if (result.success) {
        return {
          success: true,
          code: candidate,
          result
        };
      }
    }

    return {
      success: false,
      attempts: mutations.length
    };
  }
}

let instance = null;

/**
 * Obtém instância singleton do MutationSelfHealing.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {MutationSelfHealing} Instância
 */
export function getMutationSelfHealing(config = null, logger = null) {
  if (!instance) {
    instance = new MutationSelfHealing(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do MutationSelfHealing.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {MutationSelfHealing} Nova instância
 */
export function createMutationSelfHealing(config = null, logger = null) {
  return new MutationSelfHealing(config, logger);
}

export default MutationSelfHealing;
