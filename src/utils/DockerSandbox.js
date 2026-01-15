/**
 * Docker Sandbox Manager
 * 
 * Gerencia execução de código em containers Docker isolados com:
 * - Limites de recursos (CPU, memória, I/O)
 * - Restrições de acesso ao sistema de arquivos
 * - Bloqueio de chamadas de rede
 * - Isolamento de usuário/grupo
 * - Monitoramento de recursos em tempo real
 */

import Docker from 'dockerode';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { getConfigLoader } from './ConfigLoader.js';
import { getLogger } from './Logger.js';
import { getErrorHandler } from './ErrorHandler.js';

class DockerSandbox {
  constructor(config = null, logger = null, errorHandler = null) {
    // Carregar config se não fornecido
    if (!config) {
      const configLoader = getConfigLoader();
      if (!configLoader.config) {
        configLoader.load();
      }
      config = configLoader.get();
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

    // Configurações Docker
    const dockerConfig = config.execution?.docker || {};
    this.dockerEnabled = dockerConfig.enabled !== false;
    this.dockerImage = dockerConfig.image || 'node:18-alpine';
    this.memoryLimit = dockerConfig.memoryLimit || '512m';
    this.cpuLimit = dockerConfig.cpuLimit || '0.5';
    this.networkDisabled = dockerConfig.networkDisabled !== false;
    this.readOnlyRootfs = dockerConfig.readOnlyRootfs !== false;

    // Inicializar cliente Docker
    try {
      this.docker = new Docker();
      this.logger?.info('Cliente Docker inicializado');
    } catch (error) {
      this.logger?.warn('Erro ao inicializar Docker, usando fallback', { error: error.message });
      this.dockerEnabled = false;
    }

    // Diretório temporário para volumes
    this.tempDir = config.paths?.sandbox || './sandbox_env';
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }

    // Containers ativos (para cleanup)
    this.activeContainers = new Map();
  }

  /**
   * Executa código em container Docker isolado
   * @param {string} code - Código a executar
   * @param {string} language - Linguagem do código
   * @param {object} options - Opções de execução
   * @returns {Promise<object>} Resultado da execução
   */
  async execute(code, language, options = {}) {
    const {
      timeout = 10000,
      inputs = [],
      expectedOutput = null
    } = options;

    // Se Docker não está habilitado ou não disponível, usar fallback
    if (!this.dockerEnabled || !this.docker) {
      return this.executeFallback(code, language, options);
    }

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const containerName = `ultra-sandbox-${executionId}`;
    const startTime = Date.now();

    try {
      // 1. Criar arquivo temporário com código
      const filePath = await this.createTempFile(code, language, executionId);

      // 2. Criar container
      const container = await this.createContainer(containerName, language, filePath);

      // 3. Executar código no container
      const result = await this.runInContainer(container, {
        timeout,
        inputs
      });

      // 4. Limpar recursos
      await this.cleanup(container, filePath);

      // 5. Adicionar metadados
      result.executionId = executionId;
      result.duration = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      result.matchesExpected = expectedOutput !== null 
        ? (result.stdout === expectedOutput || result.stdout.includes(expectedOutput))
        : null;

      return result;

    } catch (error) {
      this.errorHandler?.handleError(error, {
        component: 'DockerSandbox',
        operation: 'execute',
        executionId,
        language
      });

      // Tentar cleanup mesmo em caso de erro
      try {
        const container = this.docker.getContainer(containerName);
        await this.cleanup(container, null);
      } catch (cleanupError) {
        this.logger?.warn('Erro no cleanup após falha', { error: cleanupError.message });
      }

      // Retornar erro estruturado
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error.message,
        errors: [`Erro na execução Docker: ${error.message}`],
        executionId,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Cria container Docker com configurações de segurança
   * @param {string} containerName - Nome do container
   * @param {string} language - Linguagem
   * @param {string} filePath - Caminho do arquivo no host
   * @returns {Promise<object>} Container criado
   */
  async createContainer(containerName, language, filePath) {
    // Determinar comando baseado na linguagem
    const { command, workDir } = this.getCommandForLanguage(language, filePath);

    // Criar volume temporário
    const volumeName = `ultra-volume-${Date.now()}`;
    const volumePath = `/tmp/${volumeName}`;

    // Configurações do container
    const containerConfig = {
      Image: this.dockerImage,
      name: containerName,
      Cmd: command,
      WorkingDir: workDir,
      HostConfig: {
        Memory: this.parseMemoryLimit(this.memoryLimit),
        CpuQuota: Math.floor(this.parseCpuLimit(this.cpuLimit) * 100000),
        CpuPeriod: 100000,
        NetworkMode: this.networkDisabled ? 'none' : 'bridge',
        ReadonlyRootfs: this.readOnlyRootfs,
        Binds: [`${filePath}:${workDir}/${this.getFileName(filePath)}:ro`],
        AutoRemove: true,
        CapDrop: ['ALL'],
        CapAdd: [],
        SecurityOpt: ['no-new-privileges:true'],
        Ulimits: [
          { Name: 'nofile', Soft: 64, Hard: 64 },
          { Name: 'nproc', Soft: 32, Hard: 32 }
        ]
      },
      Env: [
        'NODE_ENV=production',
        'PYTHONUNBUFFERED=1'
      ],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      OpenStdin: true
    };

    // Criar container
    const container = await this.docker.createContainer(containerConfig);
    this.activeContainers.set(containerName, container);

    this.logger?.info('Container Docker criado', {
      containerName,
      language,
      memoryLimit: this.memoryLimit,
      cpuLimit: this.cpuLimit
    });

    return container;
  }

  /**
   * Executa código no container
   * @param {object} container - Container Docker
   * @param {object} options - Opções
   * @returns {Promise<object>} Resultado da execução
   */
  async runInContainer(container, options = {}) {
    const { timeout = 10000, inputs = [] } = options;

    return new Promise(async (resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let timeoutId;

      try {
        // Iniciar container primeiro
        await container.start();

        // Configurar timeout
        if (timeout > 0) {
          timeoutId = setTimeout(async () => {
            try {
              await container.stop({ t: 0 });
              reject(new Error(`Timeout após ${timeout}ms`));
            } catch (error) {
              reject(error);
            }
          }, timeout);
        }

        // Inputs serão enviados via stdin se necessário (implementação futura)

        // Aguardar execução
        const result = await container.wait();
        const exitCode = result.StatusCode;

        // Capturar logs após execução
        try {
          const logs = await container.logs({
            stdout: true,
            stderr: true,
            timestamps: false
          });
          const logOutput = logs.toString('utf-8');
          stdout += logOutput;
        } catch (logError) {
          // Ignorar erro de logs
        }

        // Limpar timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        resolve({
          success: exitCode === 0,
          exitCode,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });

      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        reject(error);
      }
    });
  }

  /**
   * Obtém comando para linguagem
   * @param {string} language - Linguagem
   * @param {string} filePath - Caminho do arquivo
   * @returns {object} Comando e diretório de trabalho
   */
  getCommandForLanguage(language, filePath) {
    const fileName = this.getFileName(filePath);
    const workDir = '/tmp';

    const commands = {
      'python': ['python3', `${workDir}/${fileName}`],
      'py': ['python3', `${workDir}/${fileName}`],
      'javascript': ['node', `${workDir}/${fileName}`],
      'js': ['node', `${workDir}/${fileName}`],
      'typescript': ['ts-node', `${workDir}/${fileName}`],
      'ts': ['ts-node', `${workDir}/${fileName}`]
    };

    const command = commands[language.toLowerCase()] || ['sh', '-c', `cat ${workDir}/${fileName}`];

    return {
      command,
      workDir
    };
  }

  /**
   * Cria arquivo temporário
   * @param {string} code - Código
   * @param {string} language - Linguagem
   * @param {string} executionId - ID da execução
   * @returns {Promise<string>} Caminho do arquivo
   */
  async createTempFile(code, language, executionId) {
    const extension = this.getFileExtension(language);
    const fileName = `${executionId}.${extension}`;
    const filePath = join(this.tempDir, fileName);

    writeFileSync(filePath, code, 'utf-8');
    return filePath;
  }

  /**
   * Obtém extensão de arquivo
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
      'ts': 'ts'
    };
    return extensions[language.toLowerCase()] || 'txt';
  }

  /**
   * Obtém nome do arquivo do caminho
   * @param {string} filePath - Caminho completo
   * @returns {string} Nome do arquivo
   */
  getFileName(filePath) {
    return filePath.split('/').pop() || filePath.split('\\').pop();
  }

  /**
   * Limpa recursos (container e arquivo)
   * @param {object} container - Container Docker
   * @param {string} filePath - Caminho do arquivo
   */
  async cleanup(container, filePath) {
    try {
      const containerName = container?.Name || container?.id;
      if (container) {
        try {
          await container.stop({ t: 0 });
        } catch (error) {
          // Container pode já estar parado
        }
        try {
          await container.remove({ force: true });
        } catch (error) {
          this.logger?.warn('Erro ao remover container', { error: error.message });
        }
        // Corrigir: deletar por containerName, não container.id
        for (const [name, c] of this.activeContainers) {
          if (c.id === container.id) {
            this.activeContainers.delete(name);
            break;
          }
        }
      }

      // Remover arquivo temporário
      if (filePath && existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      this.logger?.warn('Erro no cleanup', { error: error.message });
    }
  }

  /**
   * Fallback quando Docker não está disponível
   * @param {string} code - Código
   * @param {string} language - Linguagem
   * @param {object} options - Opções
   * @returns {Promise<object>} Resultado
   */
  async executeFallback(code, language, options) {
    this.logger?.warn('Fallback de execução desabilitado por segurança', { language });
    
    return {
      success: false,
      exitCode: -1,
      stdout: '',
      stderr: 'Execução requer Docker. Fallback desabilitado por segurança.',
      errors: ['Docker não disponível e fallback desabilitado']
    };
  }

  /**
   * Converte limite de memória para bytes
   * @param {string} memoryLimit - Limite (ex: "512m", "1g")
   * @returns {number} Bytes
   */
  parseMemoryLimit(memoryLimit) {
    const match = memoryLimit.match(/^(\d+)([kmg]?)$/i);
    if (!match) return 512 * 1024 * 1024; // Default 512MB

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    const multipliers = {
      '': 1,
      'k': 1024,
      'm': 1024 * 1024,
      'g': 1024 * 1024 * 1024
    };

    return value * (multipliers[unit] || 1);
  }

  /**
   * Converte limite de CPU
   * @param {string|number} cpuLimit - Limite (ex: "0.5", 0.5)
   * @returns {number} Valor numérico
   */
  parseCpuLimit(cpuLimit) {
    if (typeof cpuLimit === 'number') return cpuLimit;
    return parseFloat(cpuLimit) || 0.5;
  }

  /**
   * Limpa todos os containers ativos
   */
  async cleanupAll() {
    const cleanupPromises = Array.from(this.activeContainers.values()).map(container =>
      this.cleanup(container, null)
    );
    await Promise.allSettled(cleanupPromises);
    this.activeContainers.clear();
  }

  /**
   * Remove containers órfãos do ultra-sandbox
   * @returns {Promise<object>} { removed, errors }
   */
  async cleanupOrphanedContainers() {
    if (!this.docker) {
      return { removed: [], errors: [] };
    }

    const removed = [];
    const errors = [];

    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: { name: ['ultra-sandbox-'] }
      });

      for (const containerInfo of containers) {
        try {
          const container = this.docker.getContainer(containerInfo.Id);
          
          // Verificar se container está rodando há mais de 5 minutos
          const createdAt = new Date(containerInfo.Created * 1000);
          const ageMinutes = (Date.now() - createdAt.getTime()) / 60000;
          
          if (ageMinutes > 5) {
            this.logger?.warn('Removendo container órfão', {
              containerId: containerInfo.Id.substring(0, 12),
              name: containerInfo.Names[0],
              ageMinutes: Math.round(ageMinutes)
            });

            // Forçar remoção
            if (containerInfo.State === 'running') {
              await container.stop({ t: 5 });
            }
            await container.remove({ force: true });
            removed.push(containerInfo.Id.substring(0, 12));
          }
        } catch (error) {
          errors.push({ containerId: containerInfo.Id, error: error.message });
        }
      }
    } catch (error) {
      errors.push({ error: error.message });
    }

    return { removed, errors };
  }

  /**
   * Obtém estatísticas de recursos dos containers ativos
   * @returns {Promise<Array>} Lista de estatísticas
   */
  async getResourceStats() {
    if (!this.docker) {
      return [];
    }

    const stats = [];

    try {
      const containers = await this.docker.listContainers({
        filters: { name: ['ultra-sandbox-'] }
      });

      for (const containerInfo of containers) {
        try {
          const container = this.docker.getContainer(containerInfo.Id);
          const containerStats = await container.stats({ stream: false });
          
          stats.push({
            containerId: containerInfo.Id.substring(0, 12),
            name: containerInfo.Names[0],
            cpuPercent: this.calculateCpuPercent(containerStats),
            memoryUsage: containerStats.memory_stats?.usage || 0,
            memoryLimit: containerStats.memory_stats?.limit || 0,
            state: containerInfo.State
          });
        } catch (error) {
          // Container pode ter sido removido
        }
      }
    } catch (error) {
      this.logger?.warn('Erro ao obter estatísticas', { error: error.message });
    }

    return stats;
  }

  /**
   * Calcula uso de CPU em percentual
   */
  calculateCpuPercent(stats) {
    if (!stats.cpu_stats || !stats.precpu_stats) {
      return 0;
    }

    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - 
                     stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - 
                        stats.precpu_stats.system_cpu_usage;

    if (systemDelta > 0) {
      const cpuPercent = (cpuDelta / systemDelta) * 100;
      return Math.round(cpuPercent * 100) / 100;
    }
    return 0;
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do DockerSandbox
 */
export function getDockerSandbox(config = null, logger = null, errorHandler = null) {
  if (!instance) {
    instance = new DockerSandbox(config, logger, errorHandler);
  }
  return instance;
}

/**
 * Cria nova instância do DockerSandbox
 */
export function createDockerSandbox(config = null, logger = null, errorHandler = null) {
  return new DockerSandbox(config, logger, errorHandler);
}

export default DockerSandbox;
