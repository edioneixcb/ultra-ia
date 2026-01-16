/**
 * AdversarialSimulationEngine
 *
 * Simula cenários de falha para avaliar resiliência do código.
 */

import { getLogger } from '../utils/Logger.js';
import { getSandboxExecutor } from '../healing/SandboxExecutor.js';

class AdversarialSimulationEngine {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.sandbox = getSandboxExecutor(config, this.logger);
    this.defaultScenarios = ['timeout', 'oom', 'network', 'invalid_input'];
  }

  async simulate(code, options = {}) {
    const scenarios = options.scenarios || this.defaultScenarios;
    const results = [];

    for (const scenario of scenarios) {
      const timeout = scenario === 'timeout' ? 1 : (options.timeout || 5000);
      const result = await this.sandbox.execute(code, {
        language: options.language || 'javascript',
        timeout
      });
      results.push({
        scenario,
        success: result.success,
        exitCode: result.exitCode,
        stderr: result.stderr
      });
    }

    return {
      scenarios: results,
      simulatedAt: new Date().toISOString()
    };
  }
}

let instance = null;

/**
 * Obtém instância singleton do AdversarialSimulationEngine.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {AdversarialSimulationEngine} Instância
 */
export function getAdversarialSimulationEngine(config = null, logger = null) {
  if (!instance) {
    instance = new AdversarialSimulationEngine(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do AdversarialSimulationEngine.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {AdversarialSimulationEngine} Nova instância
 */
export function createAdversarialSimulationEngine(config = null, logger = null) {
  return new AdversarialSimulationEngine(config, logger);
}

export default AdversarialSimulationEngine;
