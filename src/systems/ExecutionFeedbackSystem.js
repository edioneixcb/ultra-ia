/**
 * Sistema de Feedback de Execução
 * 
 * Executa código gerado em ambiente sandbox e coleta feedback:
 * 
 * Funcionalidades:
 * - Execução segura de código em sandbox
 * - Coleta de resultados (stdout, stderr, exit code)
 * - Análise de erros de execução
 * - Feedback estruturado para refinamento
 * - Histórico de execuções
 * - Aprendizado de padrões de erro
 * 
 * Suporta:
 * - Python (via subprocess)
 * - JavaScript/Node.js (via child_process)
 * - Execução isolada por sessão
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getConfigLoader } from '../utils/ConfigLoader.js';
import { getLogger } from '../utils/Logger.js';
import { getErrorHandler } from '../utils/ErrorHandler.js';
import { getDockerSandbox } from '../utils/DockerSandbox.js';
import { getSecurityValidator } from '../utils/SecurityValidator.js';

const execAsync = promisify(exec);

class ExecutionFeedbackSystem {
  constructor(config = null, logger = null, errorHandler = null) {
    // Carregar config se não fornecido
    if (!config) {
      const configLoader = getConfigLoader();
      if (configLoader.config) {
        config = configLoader.get();
      } else {
        configLoader.load();
        config = configLoader.get();
      }
    }

    // Criar logger se não fornecido
    if (!logger) {
      logger = getLogger(config);
    }

    // Criar error handler se não fornecido
    if (!errorHandler) {
      errorHandler = getErrorHandler(config, logger);
    }

    this.config = config;
    this.logger = logger;
    this.errorHandler = errorHandler;

    // Configurações de sandbox
    this.sandboxBasePath = config.paths?.sandbox || './sandbox_env';
    this.timeout = config.execution?.timeout || 10000; // 10 segundos
    this.maxMemory = config.execution?.maxMemory || '100MB';

    // Criar diretório de sandbox se não existir
    if (!existsSync(this.sandboxBasePath)) {
      mkdirSync(this.sandboxBasePath, { recursive: true });
    }

    // Inicializar Security Validator
    this.securityValidator = getSecurityValidator(config, logger);

    // Inicializar Docker Sandbox se habilitado
    const dockerConfig = config.execution?.docker || {};
    this.useDocker = dockerConfig.enabled !== false;
    if (this.useDocker) {
      try {
        this.dockerSandbox = getDockerSandbox(config, logger, errorHandler);
        this.logger?.info('Docker Sandbox habilitado');
      } catch (error) {
        this.logger?.warn('Docker não disponível, usando fallback', { error: error.message });
        this.useDocker = false;
      }
    }

    // Histórico de execuções
    this.executionHistory = [];
  }

  /**
   * Executa código e coleta feedback
   * @param {string} code - Código a executar
   * @param {object} options - Opções de execução
   * @returns {Promise<object>} Feedback da execução
   */
  async execute(code, options = {}) {
    const {
      language = 'javascript',
      sessionId = 'default',
      inputs = [],
      expectedOutput = null,
      timeout = this.timeout
    } = options;

    this.logger?.info('Iniciando execução de código', {
      language,
      sessionId,
      codeLength: code.length
    });

    const executionId = `${sessionId}-${Date.now()}`;
    const startTime = Date.now();

    try {
      // Validar segurança antes de executar
      const securityCheck = this.securityValidator.validate(code, language);
      if (!securityCheck.valid) {
        return {
          success: false,
          error: 'Código bloqueado por validação de segurança',
          errors: securityCheck.errors,
          blockedPatterns: securityCheck.blockedPatterns,
          executionId: `${sessionId}-${Date.now()}`,
          sessionId,
          language,
          duration: 0,
          timestamp: new Date().toISOString()
        };
      }

      let result;

      // Usar Docker se habilitado e disponível
      if (this.useDocker && this.dockerSandbox) {
        result = await this.dockerSandbox.execute(code, language, {
          timeout,
          inputs,
          expectedOutput
        });
      } else {
        // Fallback: execução direta no host
        const filePath = await this.createTempFile(code, language, executionId);
        result = await this.runCode(filePath, language, {
          inputs,
          timeout
        });
        await this.cleanupTempFile(filePath);
      }

      // Analisar resultado
      const feedback = this.analyzeExecution(result, {
        expectedOutput,
        language,
        code
      });

      // Adicionar metadados (se não já adicionados pelo DockerSandbox)
      if (!feedback.executionId) {
        feedback.executionId = executionId;
        feedback.sessionId = sessionId;
        feedback.language = language;
        feedback.duration = Date.now() - startTime;
        feedback.timestamp = new Date().toISOString();
      } else {
        feedback.sessionId = sessionId;
      }

      // Armazenar no histórico
      this.executionHistory.push(feedback);

      this.logger?.info('Execução concluída', {
        executionId,
        success: feedback.success,
        duration: feedback.duration
      });

      return feedback;

    } catch (error) {
      this.errorHandler?.handleError(error, {
        component: 'ExecutionFeedbackSystem',
        operation: 'execute',
        executionId,
        language
      });

      return {
        success: false,
        error: error.message,
        executionId,
        sessionId,
        language,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Cria arquivo temporário no sandbox
   * @param {string} code - Código
   * @param {string} language - Linguagem
   * @param {string} executionId - ID da execução
   * @returns {Promise<string>} Caminho do arquivo criado
   */
  async createTempFile(code, language, executionId) {
    const extension = this.getFileExtension(language);
    const fileName = `${executionId}.${extension}`;
    const filePath = join(this.sandboxBasePath, fileName);

    writeFileSync(filePath, code, 'utf-8');

    return filePath;
  }

  /**
   * Obtém extensão de arquivo para linguagem
   * @param {string} language - Linguagem
   * @returns {string} Extensão
   */
  getFileExtension(language) {
    const extensions = {
      'python': 'py',
      'py': 'py',
      'javascript': 'js',
      'js': 'js',
      'typescript': 'ts',
      'ts': 'ts',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c'
    };

    return extensions[language.toLowerCase()] || 'txt';
  }

  /**
   * Executa código
   * @param {string} filePath - Caminho do arquivo
   * @param {string} language - Linguagem
   * @param {object} options - Opções
   * @returns {Promise<object>} Resultado da execução
   */
  async runCode(filePath, language, options = {}) {
    const { inputs = [], timeout = this.timeout } = options;

    let command;
    let args = [];

    if (language === 'python' || language === 'py') {
      command = 'python3';
      args = [filePath];
    } else if (language === 'javascript' || language === 'js') {
      command = 'node';
      args = [filePath];
    } else if (language === 'typescript' || language === 'ts') {
      // TypeScript precisa ser compilado primeiro
      command = 'ts-node';
      args = [filePath];
    } else {
      throw new Error(`Linguagem não suportada para execução: ${language}`);
    }

    return new Promise((resolve, reject) => {
      const childProcess = spawn(command, args, {
        cwd: this.sandboxBasePath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'production' }
      });

      let stdout = '';
      let stderr = '';
      let timeoutId;

      // Configurar timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          childProcess.kill('SIGTERM');
          reject(new Error(`Timeout após ${timeout}ms`));
        }, timeout);
      }

      // Enviar inputs se houver
      if (inputs.length > 0) {
        childProcess.stdin.write(inputs.join('\n'));
        childProcess.stdin.end();
      }

      // Capturar stdout
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // Capturar stderr
      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Processo terminado
      childProcess.on('close', (code) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          success: code === 0
        });
      });

      // Erro no processo
      childProcess.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        reject(error);
      });
    });
  }

  /**
   * Analisa resultado da execução
   * @param {object} result - Resultado da execução
   * @param {object} context - Contexto adicional
   * @returns {object} Feedback estruturado
   */
  analyzeExecution(result, context = {}) {
    const { expectedOutput = null, language, code } = context;

    const feedback = {
      success: result.success,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      errors: [],
      warnings: [],
      suggestions: [],
      matchesExpected: null
    };

    // Verificar se houve erro
    if (!result.success) {
      feedback.errors.push(`Código falhou com exit code ${result.exitCode}`);
      
      // Analisar stderr para tipos de erro comuns
      if (result.stderr) {
        const errorAnalysis = this.analyzeError(result.stderr, language);
        feedback.errors.push(...errorAnalysis.errors);
        feedback.suggestions.push(...errorAnalysis.suggestions);
      }
    }

    // Verificar se output corresponde ao esperado
    if (expectedOutput !== null) {
      feedback.matchesExpected = result.stdout === expectedOutput || 
                                 result.stdout.includes(expectedOutput);
      
      if (!feedback.matchesExpected) {
        feedback.warnings.push('Output não corresponde ao esperado');
        feedback.suggestions.push(`Esperado: ${expectedOutput}, Obtido: ${result.stdout}`);
      }
    }

    // Verificar se há warnings no stderr (mesmo com exit code 0)
    if (result.success && result.stderr) {
      feedback.warnings.push('Avisos durante execução: ' + result.stderr);
    }

    // Análise de qualidade do código baseada no resultado
    if (result.success && !result.stdout && code.length > 100) {
      feedback.warnings.push('Código executou mas não produziu output');
      feedback.suggestions.push('Verificar se código está produzindo resultado esperado');
    }

    return feedback;
  }

  /**
   * Analisa mensagem de erro
   * @param {string} stderr - Mensagem de erro
   * @param {string} language - Linguagem
   * @returns {object} Análise do erro
   */
  analyzeError(stderr, language) {
    const analysis = {
      errors: [],
      suggestions: []
    };

    const errorLower = stderr.toLowerCase();

    // Erros comuns por linguagem
    if (language === 'python' || language === 'py') {
      if (errorLower.includes('syntaxerror') || errorLower.includes('syntax error')) {
        analysis.errors.push('Erro de sintaxe Python');
        analysis.suggestions.push('Verificar indentação e sintaxe Python');
      }
      if (errorLower.includes('nameerror') || errorLower.includes('name error')) {
        analysis.errors.push('Variável ou função não definida');
        analysis.suggestions.push('Verificar se todas as variáveis e funções estão definidas');
      }
      if (errorLower.includes('typeerror') || errorLower.includes('type error')) {
        analysis.errors.push('Erro de tipo');
        analysis.suggestions.push('Verificar tipos de dados e conversões');
      }
      if (errorLower.includes('indentationerror') || errorLower.includes('indentation error')) {
        analysis.errors.push('Erro de indentação');
        analysis.suggestions.push('Verificar indentação consistente (4 espaços)');
      }
    } else if (language === 'javascript' || language === 'js') {
      if (errorLower.includes('syntaxerror') || errorLower.includes('syntax error')) {
        analysis.errors.push('Erro de sintaxe JavaScript');
        analysis.suggestions.push('Verificar chaves, parênteses e colchetes balanceados');
      }
      if (errorLower.includes('referenceerror') || errorLower.includes('reference error')) {
        analysis.errors.push('Referência não definida');
        analysis.suggestions.push('Verificar se variáveis e funções estão definidas');
      }
      if (errorLower.includes('typeerror') || errorLower.includes('type error')) {
        analysis.errors.push('Erro de tipo');
        analysis.suggestions.push('Verificar tipos de dados e propriedades de objetos');
      }
    }

    return analysis;
  }

  /**
   * Limpa arquivo temporário
   * @param {string} filePath - Caminho do arquivo
   * @returns {Promise<void>}
   */
  async cleanupTempFile(filePath) {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      this.logger?.warn('Erro ao limpar arquivo temporário', {
        filePath,
        error: error.message
      });
    }
  }

  /**
   * Obtém histórico de execuções
   * @param {string} sessionId - ID da sessão (opcional)
   * @returns {Array<object>} Histórico
   */
  getHistory(sessionId = null) {
    if (sessionId) {
      return this.executionHistory.filter(e => e.sessionId === sessionId);
    }
    return this.executionHistory;
  }

  /**
   * Obtém estatísticas de execução
   * @param {string} sessionId - ID da sessão (opcional)
   * @returns {object} Estatísticas
   */
  getStats(sessionId = null) {
    const history = this.getHistory(sessionId);
    
    if (history.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        averageDuration: 0
      };
    }

    const successful = history.filter(e => e.success).length;
    const failed = history.length - successful;
    const totalDuration = history.reduce((sum, e) => sum + (e.duration || 0), 0);

    return {
      total: history.length,
      successful,
      failed,
      successRate: (successful / history.length) * 100,
      averageDuration: totalDuration / history.length
    };
  }

  /**
   * Limpa histórico de execuções
   * @param {string} sessionId - ID da sessão (opcional)
   */
  clearHistory(sessionId = null) {
    if (sessionId) {
      this.executionHistory = this.executionHistory.filter(e => e.sessionId !== sessionId);
    } else {
      this.executionHistory = [];
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do ExecutionFeedbackSystem
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @param {object} errorHandler - ErrorHandler (opcional)
 * @returns {ExecutionFeedbackSystem} Instância
 */
export function getExecutionFeedbackSystem(config = null, logger = null, errorHandler = null) {
  if (!instance) {
    instance = new ExecutionFeedbackSystem(config, logger, errorHandler);
  }
  return instance;
}

/**
 * Cria nova instância do ExecutionFeedbackSystem
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @param {object} errorHandler - ErrorHandler
 * @returns {ExecutionFeedbackSystem} Nova instância
 */
export function createExecutionFeedbackSystem(config = null, logger = null, errorHandler = null) {
  return new ExecutionFeedbackSystem(config, logger, errorHandler);
}

export default ExecutionFeedbackSystem;
