/**
 * SemanticDriftDetector
 *
 * Detecta mudanças de comportamento entre versões de código.
 */

import { getLogger } from '../utils/Logger.js';

class SemanticDriftDetector {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
  }

  detect(beforeCode, afterCode) {
    const changes = [];

    const beforeReturns = this.extractReturns(beforeCode);
    const afterReturns = this.extractReturns(afterCode);

    for (const [fn, value] of Object.entries(beforeReturns)) {
      if (afterReturns[fn] && afterReturns[fn] !== value) {
        changes.push({
          type: 'return_change',
          functionName: fn,
          before: value,
          after: afterReturns[fn]
        });
      }
    }

    const beforeDefaults = this.extractDefaults(beforeCode);
    const afterDefaults = this.extractDefaults(afterCode);

    for (const [param, value] of Object.entries(beforeDefaults)) {
      if (afterDefaults[param] && afterDefaults[param] !== value) {
        changes.push({
          type: 'default_change',
          param,
          before: value,
          after: afterDefaults[param]
        });
      }
    }

    return {
      detected: changes.length > 0,
      changes
    };
  }

  extractReturns(code) {
    const map = {};
    const regex = /function\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]*?return\s+([^;]+);/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      map[match[1]] = match[2].trim();
    }
    return map;
  }

  extractDefaults(code) {
    const map = {};
    const regex = /(\w+)\s*=\s*([^,\)\n]+)/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      map[match[1]] = match[2].trim();
    }
    return map;
  }
}

let instance = null;

/**
 * Obtém instância singleton do SemanticDriftDetector.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {SemanticDriftDetector} Instância
 */
export function getSemanticDriftDetector(config = null, logger = null) {
  if (!instance) {
    instance = new SemanticDriftDetector(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do SemanticDriftDetector.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {SemanticDriftDetector} Nova instância
 */
export function createSemanticDriftDetector(config = null, logger = null) {
  return new SemanticDriftDetector(config, logger);
}

export default SemanticDriftDetector;
