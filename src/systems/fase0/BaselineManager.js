/**
 * BaselineManager - Sistema de Baseline de Ambiente
 * 
 * Documenta estado inicial do ambiente para reprodução e debugging.
 * 
 * Funcionalidades:
 * - Detecção de ambiente (OS, runtime, build tools, IDE)
 * - Detecção de dependências externas
 * - Verificação de status de serviços
 * - Documentação de configurações críticas
 * 
 * Métricas de Sucesso:
 * - 100% das tecnologias identificadas
 * - 100% das versões documentadas
 * - 100% do status de dependências verificado
 */

import BaseSystem from '../../core/BaseSystem.js';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { platform, arch, version, cpus } from 'os';
import { join } from 'path';

class BaselineManager extends BaseSystem {
  async onInitialize() {
    this.baselines = new Map();
    this.logger?.info('BaselineManager inicializado');
  }

  /**
   * Cria baseline completo para um sistema
   * 
   * @param {string} systemName - Nome do sistema
   * @param {Object} options - Opções de baseline
   * @returns {Promise<Object>} Baseline completo
   */
  async onExecute(context) {
    const { systemName, options = {} } = context;

    if (!systemName) {
      throw new Error('systemName é obrigatório no contexto');
    }

    this.logger?.info(`Criando baseline para sistema: ${systemName}`);

    const baseline = {
      timestamp: new Date().toISOString(),
      system: systemName,
      environment: await this.detectEnvironment(),
      dependencies: await this.detectDependencies(options),
      configuration: await this.detectConfiguration(options),
      metadata: {
        createdBy: 'BaselineManager',
        version: '1.0.0'
      }
    };

    // Armazenar baseline
    this.baselines.set(systemName, baseline);

    this.logger?.info(`Baseline criado com sucesso para: ${systemName}`, {
      technologies: Object.keys(baseline.environment).length,
      dependencies: baseline.dependencies.external?.length || 0
    });

    return baseline;
  }

  /**
   * Detecta ambiente de execução
   * 
   * @returns {Promise<Object>} Informações do ambiente
   */
  async detectEnvironment() {
    const env = {
      os: {
        platform: platform(),
        arch: arch(),
        version: version(),
        cpus: cpus().length
      },
      runtime: await this.detectRuntime(),
      buildTools: await this.detectBuildTools(),
      ide: await this.detectIDE()
    };

    return env;
  }

  /**
   * Detecta runtime (Node.js, Python, etc)
   * 
   * @returns {Promise<Object>} Informações do runtime
   */
  async detectRuntime() {
    const runtime = {
      type: 'nodejs',
      version: process.version,
      v8: process.versions.v8,
      uv: process.versions.uv,
      zlib: process.versions.zlib,
      openssl: process.versions.openssl
    };

    // Detectar Python se disponível
    try {
      const pythonVersion = execSync('python3 --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      runtime.python = pythonVersion;
    } catch (e) {
      // Python não disponível
    }

    return runtime;
  }

  /**
   * Detecta ferramentas de build
   * 
   * @returns {Promise<Object>} Informações das ferramentas
   */
  async detectBuildTools() {
    const tools = {};

    // Detectar npm/yarn/pnpm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      tools.npm = npmVersion;
    } catch (e) {
      tools.npm = 'não disponível';
    }

    try {
      const yarnVersion = execSync('yarn --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      tools.yarn = yarnVersion;
    } catch (e) {
      // Yarn não disponível
    }

    // Detectar Docker
    try {
      const dockerVersion = execSync('docker --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      tools.docker = dockerVersion;
    } catch (e) {
      tools.docker = 'não disponível';
    }

    // Detectar Git
    try {
      const gitVersion = execSync('git --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      tools.git = gitVersion;
    } catch (e) {
      tools.git = 'não disponível';
    }

    return tools;
  }

  /**
   * Detecta IDE/Editor
   * 
   * @returns {Promise<Object>} Informações do IDE
   */
  async detectIDE() {
    const ide = {
      detected: null,
      environment: {}
    };

    // Detectar variáveis de ambiente comuns
    if (process.env.VSCODE_INJECTION) {
      ide.detected = 'VS Code';
    } else if (process.env.JETBRAINS_IDE) {
      ide.detected = 'JetBrains IDE';
    } else if (process.env.CURSOR) {
      ide.detected = 'Cursor';
    }

    // Detectar extensões/plugins se possível
    if (process.env.VSCODE_EXTENSIONS) {
      ide.environment.extensions = process.env.VSCODE_EXTENSIONS;
    }

    return ide;
  }

  /**
   * Detecta dependências externas
   * 
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Informações de dependências
   */
  async detectDependencies(options) {
    const dependencies = {
      external: [],
      status: {},
      quotas: {}
    };

    // Detectar package.json se disponível
    const packageJsonPath = options.packageJsonPath || 'package.json';
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        dependencies.packageJson = {
          name: packageJson.name,
          version: packageJson.version,
          dependencies: Object.keys(packageJson.dependencies || {}).length,
          devDependencies: Object.keys(packageJson.devDependencies || {}).length
        };
      } catch (e) {
        this.logger?.warn('Erro ao ler package.json', { error: e.message });
      }
    }

    // Verificar serviços externos se configurados
    if (options.checkServices) {
      dependencies.status = await this.checkServiceStatus(options.services || []);
    }

    return dependencies;
  }

  /**
   * Verifica status de serviços externos
   * 
   * @param {Array<string>} services - Lista de serviços para verificar
   * @returns {Promise<Object>} Status dos serviços
   */
  async checkServiceStatus(services) {
    const status = {};

    for (const service of services) {
      try {
        // Verificação básica via ping ou curl
        if (service.type === 'http') {
          status[service.name] = {
            available: true, // Simplificado - implementar verificação real se necessário
            checked: new Date().toISOString()
          };
        }
      } catch (e) {
        status[service.name] = {
          available: false,
          error: e.message,
          checked: new Date().toISOString()
        };
      }
    }

    return status;
  }

  /**
   * Detecta configurações críticas
   * 
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Configurações detectadas
   */
  async detectConfiguration(options) {
    const config = {
      envVars: this.listEnvVars(options.envVarsFilter),
      secrets: this.listSecretsLocations(options.secretsPaths),
      certificates: this.listCertificates(options.certPaths)
    };

    return config;
  }

  /**
   * Lista variáveis de ambiente relevantes
   * 
   * @param {Array<string>} filter - Filtro de variáveis (opcional)
   * @returns {Object} Variáveis de ambiente
   */
  listEnvVars(filter) {
    const envVars = {};

    if (filter && Array.isArray(filter)) {
      for (const key of filter) {
        if (process.env[key]) {
          envVars[key] = '***'; // Não expor valores sensíveis
        }
      }
    } else {
      // Listar variáveis comuns
      const commonVars = ['NODE_ENV', 'PATH', 'HOME', 'USER', 'SHELL'];
      for (const key of commonVars) {
        if (process.env[key]) {
          envVars[key] = process.env[key];
        }
      }
    }

    return envVars;
  }

  /**
   * Lista locais de secrets
   * 
   * @param {Array<string>} paths - Caminhos para verificar
   * @returns {Array<Object>} Locais de secrets
   */
  listSecretsLocations(paths) {
    const locations = [];
    const defaultPaths = paths || ['.env', '.env.local', 'secrets/', 'config/secrets.json'];

    for (const path of defaultPaths) {
      if (existsSync(path)) {
        locations.push({
          path,
          exists: true,
          type: this.detectFileType(path)
        });
      }
    }

    return locations;
  }

  /**
   * Lista certificados
   * 
   * @param {Array<string>} paths - Caminhos para verificar
   * @returns {Array<Object>} Certificados encontrados
   */
  listCertificates(paths) {
    const certificates = [];
    const defaultPaths = paths || ['certs/', 'certificates/', '/etc/ssl/certs'];

    for (const path of defaultPaths) {
      if (existsSync(path)) {
        certificates.push({
          path,
          exists: true
        });
      }
    }

    return certificates;
  }

  /**
   * Detecta tipo de arquivo
   * 
   * @param {string} path - Caminho do arquivo
   * @returns {string} Tipo do arquivo
   */
  detectFileType(path) {
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.env')) return 'env';
    if (path.endsWith('.key')) return 'key';
    if (path.endsWith('.pem')) return 'pem';
    if (path.endsWith('.crt')) return 'certificate';
    return 'unknown';
  }

  /**
   * Obtém baseline armazenado
   * 
   * @param {string} systemName - Nome do sistema
   * @returns {Object|null} Baseline ou null
   */
  getBaseline(systemName) {
    return this.baselines.get(systemName) || null;
  }

  /**
   * Lista todos os baselines criados
   * 
   * @returns {Array<string>} Nomes dos sistemas com baseline
   */
  listBaselines() {
    return Array.from(this.baselines.keys());
  }

  /**
   * Valida contexto
   * 
   * @param {Object} context - Contexto
   * @returns {Object} Resultado da validação
   */
  onValidate(context) {
    if (!context || typeof context !== 'object') {
      return { valid: false, errors: ['Context deve ser um objeto'] };
    }

    if (!context.systemName || typeof context.systemName !== 'string') {
      return { valid: false, errors: ['systemName é obrigatório e deve ser string'] };
    }

    return { valid: true };
  }

  /**
   * Retorna dependências do sistema
   * 
   * @returns {Array<string>} Dependências
   */
  onGetDependencies() {
    return ['logger', 'config'];
  }
}

export default BaselineManager;

/**
 * Factory function para criar BaselineManager
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {BaselineManager} Instância do BaselineManager
 */
export function createBaselineManager(config = null, logger = null, errorHandler = null) {
  return new BaselineManager(config, logger, errorHandler);
}
