/**
 * Sistema de Logging Estruturado
 * 
 * Logs em formato JSON estruturado com:
 * - Níveis: DEBUG, INFO, WARN, ERROR, CRITICAL
 * - Contexto: sessionId, projectId, component, etc.
 * - Rotação automática de arquivos
 * - Separação de logs de erro
 */

import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class StructuredLogger {
  constructor(config = null) {
    // Se config não fornecido, usar valores padrão
    // (Config será carregado síncronamente se necessário)
    if (!config) {
      config = {
        paths: { logs: './logs' },
        logging: {
          level: 'info',
          format: 'json',
          rotation: { enabled: true, maxSize: '10MB', maxFiles: 10 }
        }
      };
    }

    this.config = config;
    this.logDir = this.config.paths?.logs || './logs';
    this.level = this.config.logging?.level || 'info';
    this.format = this.config.logging?.format || 'json';
    this.rotation = this.config.logging?.rotation || { enabled: true };

    // Criar diretório de logs se não existir
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }

    // Níveis de log (ordem de severidade)
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      CRITICAL: 4
    };

    this.currentLevel = this.levels[this.level.toUpperCase()] || this.levels.INFO;
  }

  /**
   * Obtém caminho do arquivo de log do dia
   * @param {string} type - Tipo de log ('system' ou 'error')
   * @returns {string} Caminho do arquivo
   */
  getLogFile(type = 'system') {
    const today = new Date().toISOString().split('T')[0];
    const filename = type === 'error' ? `errors-${today}.log` : `system-${today}.log`;
    return join(this.logDir, filename);
  }

  /**
   * Escreve log em arquivo
   * @param {object} logEntry - Entrada de log estruturada
   * @param {boolean} isError - Se é erro (vai para arquivo de erros também)
   */
  writeToFile(logEntry, isError = false) {
    const logLine = JSON.stringify(logEntry) + '\n';

    // Escrever em arquivo principal
    const systemFile = this.getLogFile('system');
    const systemStream = createWriteStream(systemFile, { flags: 'a' });
    systemStream.write(logLine);
    systemStream.end();

    // Se erro, também escrever em arquivo de erros
    if (isError) {
      const errorFile = this.getLogFile('error');
      const errorStream = createWriteStream(errorFile, { flags: 'a' });
      errorStream.write(logLine);
      errorStream.end();
    }
  }

  /**
   * Formata log para exibição no console
   * @param {object} logEntry - Entrada de log
   * @returns {string} Log formatado
   */
  formatForConsole(logEntry) {
    if (this.format === 'json') {
      return JSON.stringify(logEntry, null, 2);
    }

    // Formato legível
    const { timestamp, level, message, ...metadata } = logEntry;
    let output = `[${timestamp}] [${level}] ${message}`;
    
    if (Object.keys(metadata).length > 0) {
      output += `\n  ${JSON.stringify(metadata, null, 2)}`;
    }

    return output;
  }

  /**
   * Cria entrada de log estruturada
   * @param {string} level - Nível do log
   * @param {string} message - Mensagem
   * @param {object} metadata - Metadados adicionais
   * @returns {object} Entrada de log estruturada
   */
  createLogEntry(level, message, metadata = {}) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...metadata
    };
  }

  /**
   * Verifica se nível deve ser logado
   * @param {string} level - Nível a verificar
   * @returns {boolean} Se deve logar
   */
  shouldLog(level) {
    const levelValue = this.levels[level.toUpperCase()] ?? this.levels.INFO;
    return levelValue >= this.currentLevel;
  }

  /**
   * Log genérico
   * @param {string} level - Nível do log
   * @param {string} message - Mensagem
   * @param {object} metadata - Metadados (sessionId, projectId, component, etc.)
   */
  log(level, message, metadata = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = this.createLogEntry(level, message, metadata);
    const isError = level.toUpperCase() === 'ERROR' || level.toUpperCase() === 'CRITICAL';

    // Escrever em arquivo
    this.writeToFile(logEntry, isError);

    // Exibir no console
    const consoleOutput = this.formatForConsole(logEntry);
    
    if (isError) {
      console.error(consoleOutput);
    } else if (level.toUpperCase() === 'WARN') {
      console.warn(consoleOutput);
    } else {
      console.log(consoleOutput);
    }
  }

  /**
   * Log de debug
   * @param {string} message - Mensagem
   * @param {object} metadata - Metadados
   */
  debug(message, metadata = {}) {
    this.log('DEBUG', message, metadata);
  }

  /**
   * Log de informação
   * @param {string} message - Mensagem
   * @param {object} metadata - Metadados
   */
  info(message, metadata = {}) {
    this.log('INFO', message, metadata);
  }

  /**
   * Log de aviso
   * @param {string} message - Mensagem
   * @param {object} metadata - Metadados
   */
  warn(message, metadata = {}) {
    this.log('WARN', message, metadata);
  }

  /**
   * Log de erro
   * @param {string} message - Mensagem
   * @param {object} metadata - Metadados (pode incluir error object)
   */
  error(message, metadata = {}) {
    // Se metadata contém error object, extrair informações
    if (metadata.error && metadata.error instanceof Error) {
      metadata = {
        ...metadata,
        error: {
          name: metadata.error.name,
          message: metadata.error.message,
          stack: metadata.error.stack
        }
      };
    }

    this.log('ERROR', message, metadata);
  }

  /**
   * Log crítico
   * @param {string} message - Mensagem
   * @param {object} metadata - Metadados
   */
  critical(message, metadata = {}) {
    this.log('CRITICAL', message, metadata);
    
    // Notificações críticas podem ser adicionadas aqui
    if (this.config.errorHandling?.notifications?.enabled) {
      // TODO: Implementar notificações
    }
  }

  /**
   * Cria logger com contexto fixo
   * @param {object} context - Contexto fixo (sessionId, projectId, component)
   * @returns {StructuredLogger} Novo logger com contexto
   */
  withContext(context) {
    const contextualLogger = Object.create(this);
    contextualLogger.fixedContext = context;
    
    // Sobrescrever métodos para incluir contexto fixo
    const originalLog = this.log.bind(this);
    contextualLogger.log = (level, message, metadata = {}) => {
      originalLog(level, message, { ...contextualLogger.fixedContext, ...metadata });
    };

    return contextualLogger;
  }

  /**
   * Define nível de log
   * @param {string} level - Novo nível (DEBUG, INFO, WARN, ERROR, CRITICAL)
   */
  setLevel(level) {
    const levelValue = this.levels[level.toUpperCase()];
    if (levelValue !== undefined) {
      this.currentLevel = levelValue;
      this.level = level.toUpperCase();
    } else {
      this.warn(`Nível de log inválido: ${level}. Usando INFO.`);
    }
  }

  /**
   * Obtém informações do logger
   * @returns {object} Informações do logger
   */
  getInfo() {
    return {
      logDir: this.logDir,
      level: this.level,
      format: this.format,
      rotation: this.rotation
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do Logger
 * @param {object} config - Configuração (opcional)
 * @returns {StructuredLogger} Instância do Logger
 */
export function getLogger(config = null) {
  if (!instance) {
    instance = new StructuredLogger(config);
  }
  return instance;
}

/**
 * Cria novo logger (não singleton)
 * @param {object} config - Configuração
 * @returns {StructuredLogger} Nova instância
 */
export function createLogger(config = null) {
  return new StructuredLogger(config);
}

export default StructuredLogger;
