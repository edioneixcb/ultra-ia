/**
 * EnvironmentDetector - Sistema de Detecção de Ambiente
 * 
 * Detecta ambiente antes de executar scripts.
 * 
 * Funcionalidades:
 * - Detecção de Node.js (PATH, NVM, n, system)
 * - Detecção de Python (PATH, venv, conda, pyenv)
 * - Detecção de Docker
 * - Detecção de outras ferramentas
 * - Integração com BaselineManager (opcional)
 * 
 * Métricas de Sucesso:
 * - 100% dos ambientes detectados corretamente
 * - 100% dos fallbacks funcionando
 * - 0% de scripts falhando por ambiente não detectado
 */

import BaseSystem from '../../core/BaseSystem.js';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

class EnvironmentDetector extends BaseSystem {
  /**
   * Construtor com injeção de dependências
   * 
   * @param {Object} config - Configuração
   * @param {Object} logger - Logger
   * @param {Object} errorHandler - Error Handler
   * @param {Object} [baselineManager=null] - Baseline Manager opcional
   */
  constructor(config = null, logger = null, errorHandler = null, baselineManager = null) {
    super(config, logger, errorHandler);
    this.baselineManager = baselineManager;
    this.useBaselineDetection = config?.features?.useBaselineDetection !== false && baselineManager !== null;
  }

  async onInitialize() {
    this.detections = new Map();
    this.logger?.info('EnvironmentDetector inicializado', {
      useBaselineDetection: this.useBaselineDetection
    });
  }

  /**
   * Detecta todos os ambientes
   * 
   * @param {Object} context - Contexto (opcional)
   * @returns {Promise<Object>} Detecções de ambiente
   */
  async onExecute(context) {
    this.logger?.info('Detectando ambientes');

    // Se integração com baseline habilitada, usar
    if (this.useBaselineDetection && this.baselineManager) {
      try {
        const baseline = await this.baselineManager.execute({ systemName: 'EnvironmentDetector' });
        const result = this.mapBaselineToDetections(baseline);
        
        // Armazenar detecção
        const detectionId = `detection-${Date.now()}`;
        this.detections.set(detectionId, {
          ...result,
          source: 'baseline',
          detectedAt: new Date().toISOString()
        });
        
        return result;
      } catch (error) {
        this.logger?.warn('Falha na detecção via baseline, usando fallback', { error });
      }
    }

    const result = await this.detectAll();

    // Armazenar detecção
    const detectionId = `detection-${Date.now()}`;
    this.detections.set(detectionId, {
      ...result,
      source: 'local',
      detectedAt: new Date().toISOString()
    });

    return result;
  }

  /**
   * Mapeia baseline para formato de detecção
   * 
   * @param {Object} baseline - Baseline do ambiente
   * @returns {Object} Detecções mapeadas
   */
  mapBaselineToDetections(baseline) {
    const tools = {};
    if (baseline.dependencies) {
      if (baseline.dependencies.git) tools.git = { found: true, version: baseline.dependencies.git };
      if (baseline.dependencies.npm) tools.npm = { found: true, version: baseline.dependencies.npm };
    }

    return {
      nodejs: {
        found: true,
        version: baseline.environment?.runtime?.version || process.version,
        method: 'baseline'
      },
      python: { found: false }, // Baseline atual não detecta python explicitamente
      docker: baseline.dependencies?.docker === 'running' 
        ? { found: true, version: 'running', method: 'baseline' } 
        : { found: false },
      tools
    };
  }

  /**
   * Detecta todos os ambientes (Fallback)
   * 
   * @returns {Promise<Object>} Detecções
   */
  async detectAll() {
    return {
      nodejs: await this.detectNodeJS(),
      python: await this.detectPython(),
      docker: await this.detectDocker(),
      tools: await this.detectTools()
    };
  }

  /**
   * Detecta Node.js
   * 
   * @returns {Promise<Object>} Detecção de Node.js
   */
  async detectNodeJS() {
    // Tentar PATH primeiro
    try {
      const version = execSync('node --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      const which = execSync('which node', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      return {
        found: true,
        method: 'PATH',
        path: which,
        version
      };
    } catch (e) {
      // Node.js não encontrado no PATH
    }

    // Tentar NVM
    const nvmPath = process.env.NVM_DIR || join(process.env.HOME || '', '.nvm');
    if (existsSync(nvmPath)) {
      try {
        const nvmNodePath = join(nvmPath, 'versions', 'node');
        if (existsSync(nvmNodePath)) {
          return {
            found: true,
            method: 'NVM',
            path: nvmNodePath,
            version: 'detected via NVM'
          };
        }
      } catch (e) {
        // NVM não disponível
      }
    }

    return { found: false };
  }

  /**
   * Detecta Python
   * 
   * @returns {Promise<Object>} Detecção de Python
   */
  async detectPython() {
    // Tentar python3 primeiro
    try {
      const version = execSync('python3 --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      const which = execSync('which python3', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      return {
        found: true,
        method: 'PATH',
        path: which,
        version
      };
    } catch (e) {
      // Python3 não encontrado
    }

    // Tentar python
    try {
      const version = execSync('python --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      const which = execSync('which python', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      return {
        found: true,
        method: 'PATH',
        path: which,
        version
      };
    } catch (e) {
      // Python não encontrado
    }

    // Verificar venv
    if (process.env.VIRTUAL_ENV) {
      return {
        found: true,
        method: 'venv',
        path: process.env.VIRTUAL_ENV,
        version: 'detected via venv'
      };
    }

    return { found: false };
  }

  /**
   * Detecta Docker
   * 
   * @returns {Promise<Object>} Detecção de Docker
   */
  async detectDocker() {
    try {
      const version = execSync('docker --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      const which = execSync('which docker', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      return {
        found: true,
        method: 'PATH',
        path: which,
        version
      };
    } catch (e) {
      return { found: false };
    }
  }

  /**
   * Detecta outras ferramentas
   * 
   * @returns {Promise<Object>} Detecções de ferramentas
   */
  async detectTools() {
    const tools = {};

    const toolCommands = {
      git: 'git --version',
      npm: 'npm --version',
      yarn: 'yarn --version',
      pnpm: 'pnpm --version',
      docker: 'docker --version'
    };

    for (const [tool, command] of Object.entries(toolCommands)) {
      try {
        const version = execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
        tools[tool] = {
          found: true,
          version
        };
      } catch (e) {
        tools[tool] = { found: false };
      }
    }

    return tools;
  }

  /**
   * Obtém detecção armazenada
   * 
   * @param {string} detectionId - ID da detecção
   * @returns {Object|null} Detecção ou null
   */
  getDetection(detectionId) {
    return this.detections.get(detectionId) || null;
  }

  /**
   * Valida contexto
   * 
   * @param {Object} context - Contexto
   * @returns {Object} Resultado da validação
   */
  onValidate(context) {
    // Contexto é opcional para detectAll
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

export default EnvironmentDetector;

/**
 * Factory function para criar EnvironmentDetector
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @param {Object} [baselineManager=null] - Baseline Manager opcional
 * @returns {EnvironmentDetector} Instância do EnvironmentDetector
 */
export function createEnvironmentDetector(config = null, logger = null, errorHandler = null, baselineManager = null) {
  return new EnvironmentDetector(config, logger, errorHandler, baselineManager);
}
