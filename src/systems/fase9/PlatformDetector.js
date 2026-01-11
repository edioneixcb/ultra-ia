/**
 * PlatformDetector - Detector de Plataforma
 * 
 * Detecta plataforma atual e características do ambiente.
 * 
 * Funcionalidades:
 * - Detecção de Plataforma (Windows, Linux, macOS)
 * - Detecção de Runtime (Node.js, Deno, Browser)
 * - Detecção de Versões (versões de SO, runtime, ferramentas)
 * - Características do Ambiente (recursos disponíveis)
 * 
 * Métricas de Sucesso:
 * - 100% das plataformas são detectadas corretamente
 * - 100% das características são identificadas
 */

import BaseSystem from '../../core/BaseSystem.js';
import { platform, arch, version } from 'os';
import { execSync } from 'child_process';

class PlatformDetector extends BaseSystem {
  async onInitialize() {
    this.detections = new Map();
    this.logger?.info('PlatformDetector inicializado');
  }

  /**
   * Detecta plataforma ou retorna detecção armazenada
   * 
   * @param {Object} context - Contexto com action e opções
   * @returns {Promise<Object>} Resultado da detecção
   */
  async onExecute(context) {
    const { action, detectionId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'detect') {
      return await this.detectPlatform(detectionId);
    } else if (action === 'getDetection') {
      if (!detectionId) {
        throw new Error('detectionId é obrigatório para getDetection');
      }
      return this.getDetection(detectionId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Detecta plataforma completa
   * 
   * @param {string} detectionId - ID da detecção (opcional)
   * @returns {Promise<Object>} Resultado da detecção
   */
  async detectPlatform(detectionId = null) {
    const id = detectionId || `detection-${Date.now()}`;

    const detection = {
      id,
      platform: this.detectOS(),
      runtime: this.detectRuntime(),
      architecture: this.detectArchitecture(),
      versions: await this.detectVersions(),
      features: await this.detectFeatures(),
      detectedAt: new Date().toISOString()
    };

    this.detections.set(id, detection);

    return detection;
  }

  /**
   * Detecta sistema operacional
   * 
   * @returns {Object} Informações do SO
   */
  detectOS() {
    const osPlatform = platform();
    const osMap = {
      'win32': 'windows',
      'darwin': 'macos',
      'linux': 'linux'
    };

    return {
      name: osMap[osPlatform] || osPlatform,
      platform: osPlatform,
      version: version()
    };
  }

  /**
   * Detecta runtime
   * 
   * @returns {Object} Informações do runtime
   */
  detectRuntime() {
    // Verificar se está em Node.js
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      return {
        type: 'nodejs',
        version: process.versions.node,
        v8: process.versions.v8,
        uv: process.versions.uv
      };
    }

    // Verificar se está em Deno
    if (typeof Deno !== 'undefined') {
      return {
        type: 'deno',
        version: Deno.version?.deno || 'unknown'
      };
    }

    // Verificar se está em browser
    if (typeof window !== 'undefined') {
      return {
        type: 'browser',
        userAgent: navigator.userAgent
      };
    }

    return {
      type: 'unknown'
    };
  }

  /**
   * Detecta arquitetura
   * 
   * @returns {Object} Informações de arquitetura
   */
  detectArchitecture() {
    return {
      arch: arch(),
      endianness: this.detectEndianness()
    };
  }

  /**
   * Detecta endianness
   * 
   * @returns {string} Endianness
   */
  detectEndianness() {
    const buffer = Buffer.alloc(2);
    buffer[0] = 0xAA;
    buffer[1] = 0xBB;
    return buffer.readUInt16LE(0) === 0xBBAA ? 'LE' : 'BE';
  }

  /**
   * Detecta versões de ferramentas
   * 
   * @returns {Promise<Object>} Versões detectadas
   */
  async detectVersions() {
    const versions = {};

    // Detectar Node.js
    if (process.versions?.node) {
      versions.nodejs = process.versions.node;
    }

    // Detectar npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8', timeout: 5000 }).trim();
      versions.npm = npmVersion;
    } catch (error) {
      // npm não disponível
    }

    // Detectar git
    try {
      const gitVersion = execSync('git --version', { encoding: 'utf8', timeout: 5000 }).trim();
      versions.git = gitVersion.replace('git version ', '');
    } catch (error) {
      // git não disponível
    }

    // Detectar docker
    try {
      const dockerVersion = execSync('docker --version', { encoding: 'utf8', timeout: 5000 }).trim();
      versions.docker = dockerVersion.replace('Docker version ', '').split(',')[0];
    } catch (error) {
      // docker não disponível
    }

    return versions;
  }

  /**
   * Detecta características do ambiente
   * 
   * @returns {Promise<Object>} Características detectadas
   */
  async detectFeatures() {
    const features = {
      hasNodejs: typeof process !== 'undefined' && !!process.versions?.node,
      hasNpm: await this.checkCommand('npm'),
      hasGit: await this.checkCommand('git'),
      hasDocker: await this.checkCommand('docker'),
      hasPython: await this.checkCommand('python3') || await this.checkCommand('python'),
      hasJava: await this.checkCommand('java'),
      isCI: !!process.env.CI,
      isDocker: await this.isRunningInDocker()
    };

    return features;
  }

  /**
   * Verifica se comando está disponível
   * 
   * @param {string} command - Comando
   * @returns {Promise<boolean>} True se disponível
   */
  async checkCommand(command) {
    try {
      execSync(`which ${command}`, { encoding: 'utf8', timeout: 2000, stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verifica se está rodando em Docker
   * 
   * @returns {Promise<boolean>} True se em Docker
   */
  async isRunningInDocker() {
    try {
      // Verificar se existe /.dockerenv
      const fs = await import('fs');
      return fs.existsSync('/.dockerenv');
    } catch (error) {
      // Verificar variável de ambiente
      return !!process.env.DOCKER_CONTAINER;
    }
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
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.detections.values());

    return {
      totalDetections: all.length,
      platformsDetected: [...new Set(all.map(d => d.platform.name))],
      runtimesDetected: [...new Set(all.map(d => d.runtime.type))]
    };
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

    if (!context.action || typeof context.action !== 'string') {
      return { valid: false, errors: ['action é obrigatório e deve ser string'] };
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

export default PlatformDetector;

export function createPlatformDetector(config = null, logger = null, errorHandler = null) {
  return new PlatformDetector(config, logger, errorHandler);
}
