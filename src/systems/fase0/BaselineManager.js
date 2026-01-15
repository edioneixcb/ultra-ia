/**
 * BaselineManager - Sistema de Baseline de Ambiente
 * 
 * Documenta estado inicial do ambiente para reprodução e debugging.
 * Implementa detecção robusta e sanitização de dados sensíveis.
 * 
 * Funcionalidades:
 * - Detecção segura de ambiente (OS, runtime, build tools)
 * - Verificação de conectividade Docker sem travar
 * - Sanitização de variáveis de ambiente
 * - Cache de baseline para performance
 */

import BaseSystem from '../../core/BaseSystem.js';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import os from 'os';
import { join } from 'path';

class BaselineManager extends BaseSystem {
  async onInitialize() {
    this.baselines = new Map();
    this.logger?.info('BaselineManager inicializado');
  }

  /**
   * Cria baseline completo para um sistema
   * @param {Object} context - Contexto { systemName, options }
   * @returns {Promise<Object>} Baseline completo
   */
  async onExecute(context) {
    const { systemName, options = {} } = context;

    if (!systemName) {
      throw new Error('systemName é obrigatório no contexto');
    }

    this.logger?.info(`Criando baseline para sistema: ${systemName}`);

    // Usar cache por sistema se disponível e não for forçado refresh
    if (!options.forceRefresh && this.baselines.has(systemName)) {
      return this.baselines.get(systemName);
    }

    const baseline = {
      timestamp: new Date().toISOString(),
      system: systemName,
      environment: await this.detectEnvironment(),
      dependencies: await this.detectDependencies(options),
      configuration: await this.detectConfiguration(options)
    };

    // Armazenar baseline por sistema
    this.baselines.set(systemName, baseline);

    // Cache por sistema
    this.baselines.set(systemName, baseline);
    return baseline;
  }

  /**
   * Detecta ambiente de execução de forma segura
   */
  async detectEnvironment() {
    return {
      os: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        cpus: os.cpus().length,
        memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB'
      },
      runtime: {
        name: 'node',
        version: process.version,
        env: process.env.NODE_ENV || 'development'
      },
      buildTools: {
        npm: await this.checkToolVersion('npm --version'),
        yarn: await this.checkToolVersion('yarn --version'),
        pnpm: await this.checkToolVersion('pnpm --version')
      },
      ide: {
        detected: process.env.VSCODE_PID ? 'VSCode' : 'unknown'
      },
      process: {
        pid: process.pid,
        cwd: process.cwd(),
        uptime: process.uptime()
      }
    };
  }

  /**
   * Detecta dependências externas com timeouts seguros
   */
  async detectDependencies(options) {
    const checkDocker = options.checkServices !== false; // Default true
    
    return {
      external: {
        docker: checkDocker ? await this.checkDockerStatus() : 'skipped',
        git: await this.checkToolVersion('git --version')
      },
      runtime: {
        node: process.version,
        npm: await this.checkToolVersion('npm --version')
      }
    };
  }

  /**
   * Verifica status do Docker de forma segura
   */
  async checkDockerStatus() {
    try {
      // Tentar comando rápido primeiro
      execSync('docker --version', { stdio: 'ignore', timeout: 1000 });
      // Se passar, tentar info (pode falhar se daemon desligado)
      execSync('docker info', { stdio: 'ignore', timeout: 2000 });
      return { available: true, status: 'running' };
    } catch (error) {
      return { available: false, status: 'not_found_or_stopped', error: error.message };
    }
  }

  /**
   * Verifica versão de ferramenta CLI
   */
  async checkToolVersion(command) {
      try {
      const output = execSync(command, { encoding: 'utf8', timeout: 1000 });
      return output.trim();
      } catch (e) {
      return 'not_found';
        }
  }

  /**
   * Detecta configuração sanitizada
   */
  async detectConfiguration(options) {
    return {
      envVars: this.getSanitizedEnvVars(options.envVarsFilter),
      secretsFound: await this.checkSecretsPresence(options.secretsPaths),
      secrets: await this.checkSecretsPresence(options.secretsPaths),
      certificates: []
    };
  }

  /**
   * Retorna variáveis de ambiente sanitizadas
   */
  getSanitizedEnvVars(filter = []) {
    const sanitized = {};
    const sensitivePatterns = [/key/i, /secret/i, /token/i, /password/i, /auth/i, /credential/i];

    for (const [key, value] of Object.entries(process.env)) {
      // Pular se filtro explícito
      if (filter.length > 0 && !filter.includes(key)) continue;

      // Sanitizar se parecer sensível
      if (sensitivePatterns.some(p => p.test(key))) {
        sanitized[key] = '***REDACTED***';
    } else {
        sanitized[key] = value;
        }
      }
    return sanitized;
  }

  /**
   * Verifica presença de arquivos de segredos (sem ler conteúdo)
   */
  async checkSecretsPresence(paths = []) {
    const found = [];
    const defaultPaths = ['.env', '.env.local', 'secrets.json'];
    const checkPaths = paths.length > 0 ? paths : defaultPaths;

    for (const p of checkPaths) {
      if (existsSync(p)) {
        found.push(p);
  }
    }
    return found;
  }

  /**
   * Retorna baseline de um sistema ou null
   */
  getBaseline(systemName) {
    return this.baselines.get(systemName) || null;
  }

  /**
   * Lista sistemas com baseline
   */
  listBaselines() {
    return Array.from(this.baselines.keys());
  }

  /**
   * Valida contexto de entrada
   */
  validate(context) {
    if (!context || typeof context !== 'object') {
      return { valid: false };
    }
    if (!context.systemName || typeof context.systemName !== 'string') {
      return { valid: false };
    }
    return { valid: true };
  }
}

/**
 * Cria nova instância do BaselineManager
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @param {object} errorHandler - ErrorHandler
 * @returns {BaselineManager} Nova instância
 */
export function createBaselineManager(config = null, logger = null, errorHandler = null) {
  return new BaselineManager(config, logger, errorHandler);
}

export default BaselineManager;
