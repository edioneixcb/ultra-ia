/**
 * StylePatternExtractor
 *
 * Extrai padrões de estilo do código para manter consistência.
 */

import { readFileSync } from 'fs';
import { getLogger } from '../utils/Logger.js';

class StylePatternExtractor {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
  }

  extractFromFile(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    return this.extractFromContent(content);
  }

  extractFromContent(content) {
    const lines = content.split('\n');
    const semicolonLines = lines.filter(line => line.trim().endsWith(';')).length;
    const tabLines = lines.filter(line => line.includes('\t')).length;
    const singleQuotes = (content.match(/'/g) || []).length;
    const doubleQuotes = (content.match(/"/g) || []).length;

    const importCount = (content.match(/import\s+.*\s+from\s+['"].+['"]/g) || []).length;
    const requireCount = (content.match(/require\(['"].+['"]\)/g) || []).length;

    return {
      usesSemicolons: semicolonLines >= Math.max(1, Math.floor(lines.length * 0.4)),
      indentation: tabLines > 0 ? 'tabs' : 'spaces',
      quoteStyle: singleQuotes >= doubleQuotes ? 'single' : 'double',
      moduleStyle: importCount >= requireCount ? 'esm' : 'cjs'
    };
  }
}

let instance = null;

/**
 * Obtém instância singleton do StylePatternExtractor.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {StylePatternExtractor} Instância
 */
export function getStylePatternExtractor(config = null, logger = null) {
  if (!instance) {
    instance = new StylePatternExtractor(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do StylePatternExtractor.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {StylePatternExtractor} Nova instância
 */
export function createStylePatternExtractor(config = null, logger = null) {
  return new StylePatternExtractor(config, logger);
}

export default StylePatternExtractor;
