/**
 * ConfigValidator - Sistema de Validação de Configuração
 * 
 * Valida configurações antes de commit.
 * 
 * Funcionalidades:
 * - Config Schema Validator (validar schemas de configuração)
 * - Dependency Checker (verificar dependências usadas vs declaradas)
 * - SDK Compatibility Checker (validar compatibilidade de APIs)
 * - Runtime Compatibility Checker (verificar compatibilidade de runtime)
 * - Path Validator (validar caminhos em configurações externas)
 * - Project Root Detector (detectar raiz do projeto automaticamente)
 * 
 * Métricas de Sucesso:
 * - 100% das configurações validadas antes de commit
 * - 100% das dependências verificadas corretamente
 * - 100% das compatibilidades validadas antes de build
 */

import BaseSystem from '../../core/BaseSystem.js';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

class ConfigValidator extends BaseSystem {
  async onInitialize() {
    this.validations = new Map();
    this.projectRoot = null;
    this.logger?.info('ConfigValidator inicializado');
  }

  /**
   * Valida configuração
   * 
   * @param {Object} context - Contexto com config a validar
   * @returns {Promise<Object>} Resultado da validação
   */
  async onExecute(context) {
    const { config, configId, validationType = 'full' } = context;

    if (!config) {
      throw new Error('config é obrigatório no contexto');
    }

    this.logger?.info('Validando configuração', {
      configId: configId || 'desconhecido',
      validationType
    });

    // Detectar raiz do projeto se não detectada
    if (!this.projectRoot) {
      this.projectRoot = this.detectProjectRoot();
    }

    let validation;

    if (validationType === 'build') {
      validation = await this.validateBuildConfig(config);
    } else if (validationType === 'sdk') {
      validation = await this.validateSDKCompatibility(config, context.sdkVersion);
    } else if (validationType === 'paths') {
      validation = { paths: await this.validatePaths(config) };
    } else {
      // Validação completa
      validation = {
        build: await this.validateBuildConfig(config),
        sdk: await this.validateSDKCompatibility(config, context.sdkVersion),
        paths: await this.validatePaths(config),
        dependencies: await this.validateDependencies(config)
      };
    }

    // Armazenar validação
    const id = configId || `validation-${Date.now()}`;
    this.validations.set(id, {
      ...validation,
      config,
      validationType,
      validatedAt: new Date().toISOString()
    });

    return validation;
  }

  /**
   * Valida configuração de build
   * 
   * @param {Object} config - Configuração
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateBuildConfig(config) {
    const issues = [];

    // Garantir que projectRoot está definido
    if (!this.projectRoot) {
      this.projectRoot = this.detectProjectRoot();
    }

    // Validar estrutura de pastas (se aplicável)
    if (config.paths) {
      const requiredPaths = ['android', 'ios'];
      for (const path of requiredPaths) {
        if (config.paths[path] && this.projectRoot && !existsSync(join(this.projectRoot, config.paths[path]))) {
          issues.push({
            type: 'missing_path',
            severity: 'high',
            path: config.paths[path],
            suggestion: `Caminho não existe: ${config.paths[path]}`
          });
        }
      }
    }

    // Verificar compatibilidade de plugins Babel
    if (config.babel && config.babel.plugins) {
      const knownPlugins = ['@babel/plugin-proposal-class-properties', '@babel/plugin-transform-runtime'];
      for (const plugin of config.babel.plugins) {
        if (typeof plugin === 'string' && !knownPlugins.includes(plugin)) {
          issues.push({
            type: 'unknown_babel_plugin',
            severity: 'medium',
            plugin,
            suggestion: `Verificar se plugin Babel ${plugin} está instalado e é compatível`
          });
        }
      }
    }

    // Detectar conflitos de módulos nativos
    if (config.nativeModules) {
      const conflicts = this.detectNativeModuleConflicts(config.nativeModules);
      if (conflicts.length > 0) {
        issues.push(...conflicts);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Valida compatibilidade de SDK
   * 
   * @param {Object} config - Configuração
   * @param {string} sdkVersion - Versão do SDK
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateSDKCompatibility(config, sdkVersion) {
    const issues = [];

    if (!sdkVersion) {
      return {
        valid: true,
        issues: [],
        note: 'Versão do SDK não fornecida - validação pulada'
      };
    }

    // Validar compatibilidade de APIs (simplificado)
    if (config.sdkAPIs) {
      for (const api of config.sdkAPIs) {
        // Verificar se API é compatível com versão do SDK
        // (implementação simplificada - em produção consultaria CHANGELOG)
        if (api.deprecated && this.isVersionBefore(api.deprecatedSince, sdkVersion)) {
          issues.push({
            type: 'deprecated_api',
            severity: 'medium',
            api: api.name,
            deprecatedSince: api.deprecatedSince,
            suggestion: `API ${api.name} está deprecated desde ${api.deprecatedSince}. Usar alternativa sugerida.`
          });
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Valida caminhos
   * 
   * @param {Object} config - Configuração
   * @returns {Promise<Object>} Resultado da validação
   */
  async validatePaths(config) {
    const issues = [];
    const correctedPaths = {};

    // Garantir que projectRoot está definido
    if (!this.projectRoot) {
      this.projectRoot = this.detectProjectRoot();
    }

    if (!config.paths) {
      return {
        valid: true,
        issues: [],
        correctedPaths: {}
      };
    }

    for (const [key, path] of Object.entries(config.paths)) {
      if (!path || typeof path !== 'string') {
        continue;
      }

      let correctedPath = path;

      // Corrigir caminhos relativos
      if (this.projectRoot) {
        if (!path.startsWith('/') && !path.startsWith('.')) {
          correctedPath = join(this.projectRoot, path);
          correctedPaths[key] = correctedPath;
        } else if (path.startsWith('.')) {
          correctedPath = join(this.projectRoot, path);
          correctedPaths[key] = correctedPath;
        } else {
          correctedPaths[key] = path;
        }
      } else {
        correctedPaths[key] = path;
      }

      // Verificar se caminho existe
      if (correctedPath && existsSync(correctedPath)) {
        // Caminho existe - tudo ok
      } else if (correctedPath) {
        issues.push({
          type: 'path_not_exists',
          severity: 'high',
          key,
          path: correctedPath,
          suggestion: `Caminho não existe: ${key} = ${correctedPath}`
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      correctedPaths
    };
  }

  /**
   * Valida dependências
   * 
   * @param {Object} config - Configuração
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateDependencies(config) {
    const issues = [];

    // Verificar se dependências usadas estão declaradas
    if (config.usedDependencies && config.declaredDependencies) {
      for (const dep of config.usedDependencies) {
        if (!config.declaredDependencies.includes(dep)) {
          issues.push({
            type: 'undeclared_dependency',
            severity: 'medium',
            dependency: dep,
            suggestion: `Dependência ${dep} está sendo usada mas não está declarada no package.json`
          });
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Detecta conflitos de módulos nativos
   * 
   * @param {Array<string>} modules - Lista de módulos
   * @returns {Array<Object>} Conflitos encontrados
   */
  detectNativeModuleConflicts(modules) {
    const conflicts = [];
    const knownConflicts = [
      { modules: ['react-native-gesture-handler', 'react-native-reanimated'], severity: 'high' },
      { modules: ['@react-native-async-storage/async-storage', 'react-native-async-storage'], severity: 'high' }
    ];

    for (const conflict of knownConflicts) {
      const hasConflict = conflict.modules.every(m => modules.includes(m));
      if (hasConflict) {
        conflicts.push({
          type: 'native_module_conflict',
          severity: conflict.severity,
          modules: conflict.modules,
          suggestion: `Módulos ${conflict.modules.join(' e ')} podem ter conflitos. Verificar compatibilidade.`
        });
      }
    }

    return conflicts;
  }

  /**
   * Detecta raiz do projeto
   * 
   * @returns {string} Caminho da raiz do projeto
   */
  detectProjectRoot() {
    let current = process.cwd();

    // Se estamos em um módulo ES, tentar detectar raiz baseada em __dirname
    try {
      const __filename = fileURLToPath(import.meta.url);
      current = dirname(__filename);
    } catch (e) {
      // Fallback para process.cwd()
    }

    while (current !== '/' && current !== dirname(current)) {
      if (existsSync(join(current, 'package.json'))) {
        return current;
      }
      current = dirname(current);
    }

    return process.cwd();
  }

  /**
   * Compara versões
   * 
   * @param {string} version1 - Versão 1
   * @param {string} version2 - Versão 2
   * @returns {boolean} True se version1 < version2
   */
  isVersionBefore(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return true;
      if (v1Part > v2Part) return false;
    }

    return false;
  }

  /**
   * Obtém validação armazenada
   * 
   * @param {string} validationId - ID da validação
   * @returns {Object|null} Validação ou null
   */
  getValidation(validationId) {
    return this.validations.get(validationId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.validations.values());
    const totalIssues = all.reduce((sum, v) => {
      let count = 0;
      if (v.build?.issues) count += v.build.issues.length;
      if (v.sdk?.issues) count += v.sdk.issues.length;
      if (v.paths?.issues) count += v.paths.issues.length;
      if (v.dependencies?.issues) count += v.dependencies.issues.length;
      if (Array.isArray(v.issues)) count += v.issues.length;
      return sum + count;
    }, 0);

    return {
      totalValidations: all.length,
      totalIssues,
      valid: all.filter(v => {
        if (v.valid !== undefined) return v.valid;
        return (v.build?.valid !== false) && (v.sdk?.valid !== false) && 
               (v.paths?.valid !== false) && (v.dependencies?.valid !== false);
      }).length
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

    if (!context.config || typeof context.config !== 'object') {
      return { valid: false, errors: ['config é obrigatório e deve ser objeto'] };
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

export default ConfigValidator;

/**
 * Factory function para criar ConfigValidator
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {ConfigValidator} Instância do ConfigValidator
 */
export function createConfigValidator(config = null, logger = null, errorHandler = null) {
  return new ConfigValidator(config, logger, errorHandler);
}
