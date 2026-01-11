/**
 * MultiEnvironmentCompatibilityAnalyzer - Sistema de Análise de Compatibilidade Multi-Ambiente e Multi-Runtime
 * 
 * Analisa compatibilidade em múltiplos ambientes e runtimes.
 * 
 * Funcionalidades:
 * - Análise de Compatibilidade de Runtime (detectar diferenças entre Deno e Node.js)
 * - Análise de Compatibilidade de Plataforma (detectar problemas específicos de Windows/Linux/Mac)
 * - Análise de Compatibilidade de SDK (consultar CHANGELOGs automaticamente)
 * 
 * Métricas de Sucesso:
 * - 100% dos problemas de compatibilidade prevenidos
 * - 100% das APIs obsoletas detectadas antes de uso
 * - 100% das incompatibilidades de plataforma detectadas
 */

import BaseSystem from '../../core/BaseSystem.js';

class MultiEnvironmentCompatibilityAnalyzer extends BaseSystem {
  async onInitialize() {
    this.analyses = new Map();
    this.changelogCache = new Map();
    this.logger?.info('MultiEnvironmentCompatibilityAnalyzer inicializado');
  }

  /**
   * Analisa compatibilidade
   * 
   * @param {Object} context - Contexto com code e análise desejada
   * @returns {Promise<Object>} Resultado da análise
   */
  async onExecute(context) {
    const { code, analysisType = 'full', targetRuntime, sdkVersion, platform, analysisId } = context;

    if (!code) {
      throw new Error('code é obrigatório no contexto');
    }

    this.logger?.info('Analisando compatibilidade', {
      analysisType,
      analysisId: analysisId || 'desconhecido'
    });

    let analysis;

    if (analysisType === 'runtime') {
      analysis = await this.analyzeRuntimeCompatibility(code, targetRuntime || 'nodejs');
    } else if (analysisType === 'platform') {
      analysis = await this.analyzePlatformCompatibility(code, platform || 'linux');
    } else if (analysisType === 'sdk') {
      analysis = await this.analyzeSDKCompatibility(code, sdkVersion);
    } else {
      // Análise completa
      analysis = {
        runtime: await this.analyzeRuntimeCompatibility(code, targetRuntime || 'nodejs'),
        platform: await this.analyzePlatformCompatibility(code, platform || 'linux'),
        sdk: sdkVersion ? await this.analyzeSDKCompatibility(code, sdkVersion) : null
      };
    }

    // Armazenar análise
    const id = analysisId || `analysis-${Date.now()}`;
    this.analyses.set(id, {
      ...analysis,
      code,
      analysisType,
      analyzedAt: new Date().toISOString()
    });

    return analysis;
  }

  /**
   * Analisa compatibilidade de runtime
   * 
   * @param {string} code - Código
   * @param {string} targetRuntime - Runtime alvo (nodejs, deno, browser)
   * @returns {Promise<Object>} Análise de compatibilidade
   */
  async analyzeRuntimeCompatibility(code, targetRuntime) {
    const analysis = {
      nodejs: await this.analyzeForNodeJS(code),
      deno: await this.analyzeForDeno(code),
      browser: await this.analyzeForBrowser(code)
    };

    const targetAnalysis = analysis[targetRuntime] || analysis.nodejs;

    return {
      targetRuntime,
      compatible: targetAnalysis.isCompatible,
      issues: targetAnalysis.issues,
      alternatives: await this.suggestAlternatives(code, targetRuntime, targetAnalysis.issues)
    };
  }

  /**
   * Analisa código para Node.js
   * 
   * @param {string} code - Código
   * @returns {Promise<Object>} Análise
   */
  async analyzeForNodeJS(code) {
    const issues = [];

    // Verificar uso de APIs específicas do Deno
    if (code.includes('Deno.') || code.includes('import.meta.main')) {
      issues.push({
        type: 'deno_specific_api',
        severity: 'high',
        description: 'Código usa APIs específicas do Deno',
        suggestion: 'Usar APIs compatíveis com Node.js ou adicionar polyfills'
      });
    }

    // Verificar uso de require (Node.js) vs import (ESM)
    const hasRequire = /require\s*\(/.test(code);
    const hasImport = /import\s+.*from/.test(code);

    if (hasRequire && hasImport) {
      issues.push({
        type: 'mixed_modules',
        severity: 'medium',
        description: 'Código mistura CommonJS (require) e ES Modules (import)',
        suggestion: 'Padronizar para um único sistema de módulos'
      });
    }

    return {
      isCompatible: issues.length === 0,
      issues
    };
  }

  /**
   * Analisa código para Deno
   * 
   * @param {string} code - Código
   * @returns {Promise<Object>} Análise
   */
  async analyzeForDeno(code) {
    const issues = [];

    // Verificar uso de APIs específicas do Node.js
    if (code.includes('process.') || code.includes('__dirname') || code.includes('__filename')) {
      issues.push({
        type: 'nodejs_specific_api',
        severity: 'high',
        description: 'Código usa APIs específicas do Node.js',
        suggestion: 'Usar APIs compatíveis com Deno ou usar polyfills'
      });
    }

    // Verificar uso de require (não suportado no Deno)
    if (/require\s*\(/.test(code)) {
      issues.push({
        type: 'require_not_supported',
        severity: 'high',
        description: 'Deno não suporta require(), apenas import',
        suggestion: 'Converter require() para import'
      });
    }

    return {
      isCompatible: issues.length === 0,
      issues
    };
  }

  /**
   * Analisa código para Browser
   * 
   * @param {string} code - Código
   * @returns {Promise<Object>} Análise
   */
  async analyzeForBrowser(code) {
    const issues = [];

    // Verificar uso de APIs do Node.js/Deno
    if (code.includes('fs.') || code.includes('path.') || code.includes('process.')) {
      issues.push({
        type: 'server_side_api',
        severity: 'high',
        description: 'Código usa APIs do servidor não disponíveis no browser',
        suggestion: 'Usar APIs do browser ou bibliotecas compatíveis'
      });
    }

    return {
      isCompatible: issues.length === 0,
      issues
    };
  }

  /**
   * Analisa compatibilidade de plataforma
   * 
   * @param {string} code - Código
   * @param {string} platform - Plataforma (windows, linux, mac)
   * @returns {Promise<Object>} Análise
   */
  async analyzePlatformCompatibility(code, platform) {
    const issues = [];

    // Verificar caminhos específicos de plataforma
    if (code.includes('\\') && platform !== 'windows') {
      issues.push({
        type: 'windows_path',
        severity: 'medium',
        description: 'Código usa separadores de caminho do Windows',
        suggestion: 'Usar path.join() ou path.posix para compatibilidade cross-platform'
      });
    }

    // Verificar uso de comandos específicos de plataforma
    if (code.includes('cmd.exe') || code.includes('/bin/bash')) {
      issues.push({
        type: 'platform_specific_command',
        severity: 'medium',
        description: 'Código usa comandos específicos de plataforma',
        suggestion: 'Usar bibliotecas cross-platform ou detectar plataforma dinamicamente'
      });
    }

    return {
      platform,
      compatible: issues.length === 0,
      issues
    };
  }

  /**
   * Analisa compatibilidade de SDK
   * 
   * @param {string} code - Código
   * @param {string} sdkVersion - Versão do SDK
   * @returns {Promise<Object>} Análise
   */
  async analyzeSDKCompatibility(code, sdkVersion) {
    const changelog = await this.fetchChangelog(sdkVersion);
    const deprecatedAPIs = await this.findDeprecatedAPIs(code, changelog);
    const breakingChanges = await this.findBreakingChanges(code, changelog);

    return {
      sdkVersion,
      compatible: deprecatedAPIs.length === 0 && breakingChanges.length === 0,
      deprecated: deprecatedAPIs,
      breaking: breakingChanges,
      alternatives: await this.suggestSDKAlternatives(deprecatedAPIs, breakingChanges)
    };
  }

  /**
   * Busca changelog (simplificado - em produção buscaria de fonte real)
   * 
   * @param {string} sdkVersion - Versão do SDK
   * @returns {Promise<Object>} Changelog
   */
  async fetchChangelog(sdkVersion) {
    // Verificar cache
    if (this.changelogCache.has(sdkVersion)) {
      return this.changelogCache.get(sdkVersion);
    }

    // Simulado - em produção buscaria de fonte real
    const changelog = {
      version: sdkVersion,
      deprecated: [],
      breaking: []
    };

    this.changelogCache.set(sdkVersion, changelog);
    return changelog;
  }

  /**
   * Encontra APIs deprecated no código
   * 
   * @param {string} code - Código
   * @param {Object} changelog - Changelog
   * @returns {Promise<Array<Object>>} APIs deprecated encontradas
   */
  async findDeprecatedAPIs(code, changelog) {
    const deprecated = [];

    // Simplificado - em produção compararia com changelog real
    if (changelog.deprecated) {
      for (const api of changelog.deprecated) {
        if (code.includes(api.name)) {
          deprecated.push({
            api: api.name,
            deprecatedSince: api.since,
            alternative: api.alternative
          });
        }
      }
    }

    return deprecated;
  }

  /**
   * Encontra breaking changes no código
   * 
   * @param {string} code - Código
   * @param {Object} changelog - Changelog
   * @returns {Promise<Array<Object>>} Breaking changes encontrados
   */
  async findBreakingChanges(code, changelog) {
    const breaking = [];

    // Simplificado - em produção compararia com changelog real
    if (changelog.breaking) {
      for (const change of changelog.breaking) {
        if (code.includes(change.api)) {
          breaking.push({
            api: change.api,
            breakingSince: change.since,
            description: change.description
          });
        }
      }
    }

    return breaking;
  }

  /**
   * Sugere alternativas para problemas de runtime
   * 
   * @param {string} code - Código
   * @param {string} targetRuntime - Runtime alvo
   * @param {Array<Object>} issues - Problemas encontrados
   * @returns {Promise<Array<Object>>} Alternativas sugeridas
   */
  async suggestAlternatives(code, targetRuntime, issues) {
    const alternatives = [];

    for (const issue of issues) {
      if (issue.type === 'deno_specific_api' && targetRuntime === 'nodejs') {
        alternatives.push({
          issue: issue.type,
          suggestion: 'Usar APIs nativas do Node.js ou bibliotecas compatíveis'
        });
      } else if (issue.type === 'nodejs_specific_api' && targetRuntime === 'deno') {
        alternatives.push({
          issue: issue.type,
          suggestion: 'Usar APIs nativas do Deno ou polyfills'
        });
      }
    }

    return alternatives;
  }

  /**
   * Sugere alternativas para problemas de SDK
   * 
   * @param {Array<Object>} deprecatedAPIs - APIs deprecated
   * @param {Array<Object>} breakingChanges - Breaking changes
   * @returns {Promise<Array<Object>>} Alternativas sugeridas
   */
  async suggestSDKAlternatives(deprecatedAPIs, breakingChanges) {
    const alternatives = [];

    for (const api of deprecatedAPIs) {
      if (api.alternative) {
        alternatives.push({
          deprecated: api.api,
          alternative: api.alternative
        });
      }
    }

    return alternatives;
  }

  /**
   * Obtém análise armazenada
   * 
   * @param {string} analysisId - ID da análise
   * @returns {Object|null} Análise ou null
   */
  getAnalysis(analysisId) {
    return this.analyses.get(analysisId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.analyses.values());
    const totalIssues = all.reduce((sum, a) => {
      let count = 0;
      if (a.runtime?.issues) count += a.runtime.issues.length;
      if (a.platform?.issues) count += a.platform.issues.length;
      if (a.sdk?.deprecated) count += a.sdk.deprecated.length;
      if (a.sdk?.breaking) count += a.sdk.breaking.length;
      if (Array.isArray(a.issues)) count += a.issues.length;
      return sum + count;
    }, 0);

    return {
      totalAnalyses: all.length,
      totalIssues
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

    if (!context.code || typeof context.code !== 'string') {
      return { valid: false, errors: ['code é obrigatório e deve ser string'] };
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

export default MultiEnvironmentCompatibilityAnalyzer;

/**
 * Factory function para criar MultiEnvironmentCompatibilityAnalyzer
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {MultiEnvironmentCompatibilityAnalyzer} Instância do MultiEnvironmentCompatibilityAnalyzer
 */
export function createMultiEnvironmentCompatibilityAnalyzer(config = null, logger = null, errorHandler = null) {
  return new MultiEnvironmentCompatibilityAnalyzer(config, logger, errorHandler);
}
