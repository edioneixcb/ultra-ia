/**
 * TemporalRegressionDetector
 *
 * Detecta regressões usando anti-padrões históricos.
 */

import { getLogger } from '../utils/Logger.js';
import { getKnowledgeBase } from '../components/DynamicKnowledgeBase.js';

class TemporalRegressionDetector {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.knowledgeBase = getKnowledgeBase(config, this.logger);
  }

  detect(code) {
    const issues = [];
    const rows = this.knowledgeBase.db.prepare(`
      SELECT code, reason FROM anti_patterns
      ORDER BY created_at DESC
      LIMIT 50
    `).all();

    for (const row of rows) {
      if (row.code && code.includes(row.code)) {
        issues.push({
          type: 'regression',
          reason: row.reason,
          snippet: row.code.substring(0, 120)
        });
      }
    }

    return {
      detected: issues.length > 0,
      issues
    };
  }
}

let instance = null;

/**
 * Obtém instância singleton do TemporalRegressionDetector.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {TemporalRegressionDetector} Instância
 */
export function getTemporalRegressionDetector(config = null, logger = null) {
  if (!instance) {
    instance = new TemporalRegressionDetector(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do TemporalRegressionDetector.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {TemporalRegressionDetector} Nova instância
 */
export function createTemporalRegressionDetector(config = null, logger = null) {
  return new TemporalRegressionDetector(config, logger);
}

export default TemporalRegressionDetector;
