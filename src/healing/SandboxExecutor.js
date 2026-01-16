/**
 * SandboxExecutor
 *
 * Wrapper para execução em sandbox usando DockerSandbox.
 */

import { getLogger } from '../utils/Logger.js';
import { getErrorHandler } from '../utils/ErrorHandler.js';
import { getDockerSandbox } from '../utils/DockerSandbox.js';

class SandboxExecutor {
  constructor(config = null, logger = null, errorHandler = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.errorHandler = errorHandler || getErrorHandler(config, this.logger);
    this.sandbox = getDockerSandbox(config, this.logger, this.errorHandler);
  }

  async execute(code, options = {}) {
    const {
      language = 'javascript',
      timeout = 5000,
      expectedOutput = null
    } = options;

    const result = await this.sandbox.execute(code, language, {
      timeout,
      expectedOutput
    });

    return {
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      errors: result.errors || []
    };
  }
}

let instance = null;

/**
 * Obtém instância singleton do SandboxExecutor.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @param {object} errorHandler - ErrorHandler (opcional)
 * @returns {SandboxExecutor} Instância
 */
export function getSandboxExecutor(config = null, logger = null, errorHandler = null) {
  if (!instance) {
    instance = new SandboxExecutor(config, logger, errorHandler);
  }
  return instance;
}

/**
 * Cria nova instância do SandboxExecutor.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @param {object} errorHandler - ErrorHandler
 * @returns {SandboxExecutor} Nova instância
 */
export function createSandboxExecutor(config = null, logger = null, errorHandler = null) {
  return new SandboxExecutor(config, logger, errorHandler);
}

export default SandboxExecutor;
