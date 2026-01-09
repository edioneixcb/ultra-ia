/**
 * Security Validator
 * 
 * Valida código antes de executar para prevenir:
 * - Acesso a sistema de arquivos sensível
 * - Chamadas de rede perigosas
 * - Operações de sistema perigosas
 * - Injeção de código
 */

import { getLogger } from './Logger.js';

class SecurityValidator {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger;

    // Padrões perigosos por linguagem
    this.dangerousPatterns = {
      javascript: [
        /require\s*\(\s*['"]fs['"]/,
        /require\s*\(\s*['"]child_process['"]/,
        /require\s*\(\s*['"]os['"]/,
        /eval\s*\(/,
        /Function\s*\(/,
        /process\.(exit|kill)/,
        /exec\s*\(/,
        /spawn\s*\(/,
        /__dirname/,
        /__filename/,
        /import\s+.*\s+from\s+['"]fs['"]/,
        /import\s+.*\s+from\s+['"]child_process['"]/
      ],
      python: [
        /import\s+os/,
        /import\s+subprocess/,
        /import\s+sys/,
        /eval\s*\(/,
        /exec\s*\(/,
        /compile\s*\(/,
        /__import__\s*\(/,
        /open\s*\(/,
        /file\s*\(/,
        /os\.(system|popen|exec)/,
        /subprocess\.(call|Popen|run)/
      ]
    };

    // Operações permitidas (whitelist)
    this.allowedOperations = {
      javascript: ['console.log', 'console.error', 'Math.', 'Array.', 'String.', 'Object.', 'JSON.'],
      python: ['print', 'len', 'str', 'int', 'float', 'list', 'dict', 'tuple']
    };
  }

  /**
   * Valida código antes de executar
   * @param {string} code - Código a validar
   * @param {string} language - Linguagem
   * @returns {object} Resultado da validação
   */
  validate(code, language) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      blockedPatterns: []
    };

    if (!code || typeof code !== 'string') {
      result.valid = false;
      result.errors.push('Código inválido ou vazio');
      return result;
    }

    const patterns = this.dangerousPatterns[language.toLowerCase()] || [];
    
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        result.valid = false;
        result.errors.push(`Padrão perigoso detectado: ${pattern.source}`);
        result.blockedPatterns.push(pattern.source);
      }
    }

    // Verificar tamanho do código
    if (code.length > 100000) {
      result.valid = false;
      result.errors.push('Código excede tamanho máximo permitido (100KB)');
    }

    if (!result.valid) {
      this.logger?.warn('Código bloqueado por validação de segurança', {
        language,
        errors: result.errors,
        codeLength: code.length
      });
    }

    return result;
  }
}

let instance = null;

export function getSecurityValidator(config = null, logger = null) {
  if (!instance) {
    instance = new SecurityValidator(config, logger);
  }
  return instance;
}

export default SecurityValidator;
