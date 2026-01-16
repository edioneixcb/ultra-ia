/**
 * ProactiveContractNegotiator
 *
 * Negocia e valida contratos usando CompleteContractAnalyzer.
 */

import { getLogger } from '../utils/Logger.js';
import { getErrorHandler } from '../utils/ErrorHandler.js';
import CompleteContractAnalyzer from '../systems/fase0/CompleteContractAnalyzer.js';

class ProactiveContractNegotiator {
  constructor(config = null, logger = null, errorHandler = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.errorHandler = errorHandler || getErrorHandler(config, this.logger);
    this.analyzer = new CompleteContractAnalyzer(config, this.logger, this.errorHandler);
  }

  async verifyContract(methodCall, codebase = {}) {
    return await this.analyzer.execute({
      action: 'verifyContract',
      methodCall,
      codebase
    });
  }

  async analyzeDependencies(packageJson, codebase = {}) {
    return await this.analyzer.execute({
      action: 'analyzeDependencies',
      packageJson,
      codebase
    });
  }
}

let instance = null;

/**
 * Obtém instância singleton do ProactiveContractNegotiator.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @param {object} errorHandler - ErrorHandler (opcional)
 * @returns {ProactiveContractNegotiator} Instância
 */
export function getProactiveContractNegotiator(config = null, logger = null, errorHandler = null) {
  if (!instance) {
    instance = new ProactiveContractNegotiator(config, logger, errorHandler);
  }
  return instance;
}

/**
 * Cria nova instância do ProactiveContractNegotiator.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @param {object} errorHandler - ErrorHandler
 * @returns {ProactiveContractNegotiator} Nova instância
 */
export function createProactiveContractNegotiator(config = null, logger = null, errorHandler = null) {
  return new ProactiveContractNegotiator(config, logger, errorHandler);
}

export default ProactiveContractNegotiator;
