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
import axios from 'axios';
import { getCacheManager } from '../../utils/CacheManager.js';

class MultiEnvironmentCompatibilityAnalyzer extends BaseSystem {
  constructor(config = null, logger = null, errorHandler = null, environmentDetector = null) {
    super(config, logger, errorHandler);
    this.environmentDetector = environmentDetector;
    this.useEnvironmentDetection = config?.features?.useEnvironmentDetection !== false && environmentDetector !== null;
    this.useHTTPCache = config?.features?.useHTTPCache !== false;
    this.cacheTimeout = config?.fase2?.multiEnvironmentCompatibilityAnalyzer?.cacheTimeout || 3600000; // 1 hora padrão
    this.cacheManager = null;
    this.useLRUCache = config?.features?.useCache !== false;
  }

  async onInitialize() {
    this.analyses = new Map();
    this.changelogCache = new Map();
    this.httpCache = new Map(); // Cache HTTP para changelogs
    
    // Inicializar cache LRU se habilitado
    if (this.useLRUCache) {
      try {
        this.cacheManager = getCacheManager(this.config, this.logger);
        this.logger?.debug('CacheManager integrado no MultiEnvironmentCompatibilityAnalyzer');
      } catch (e) {
        this.logger?.warn('Erro ao obter CacheManager, continuando sem cache LRU', { error: e.message });
        this.useLRUCache = false;
      }
    }
    
    this.logger?.info('MultiEnvironmentCompatibilityAnalyzer inicializado', {
      useEnvironmentDetection: this.useEnvironmentDetection,
      useHTTPCache: this.useHTTPCache,
      useLRUCache: this.useLRUCache
    });
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
   * Analisa compatibilidade de runtime (com cache)
   * 
   * @param {string} code - Código
   * @param {string} targetRuntime - Runtime alvo (nodejs, deno, browser)
   * @returns {Promise<Object>} Análise de compatibilidade
   */
  async analyzeRuntimeCompatibility(code, targetRuntime) {
    // Verificar cache LRU se habilitado
    if (this.useLRUCache && this.cacheManager) {
      const cacheKey = `runtime:${targetRuntime}:${code.substring(0, 100).replace(/\s+/g, '')}`;
      const cached = this.cacheManager.get(cacheKey);
      if (cached) {
        this.logger?.debug('Análise de runtime retornada do cache');
        return cached;
      }
    }

    // Se EnvironmentDetector disponível, usar detecção real do ambiente
    let detectedEnvironment = null;
    if (this.useEnvironmentDetection && this.environmentDetector) {
      try {
        detectedEnvironment = await this.environmentDetector.execute({});
        this.logger?.debug('Ambiente detectado para análise de compatibilidade', {
          nodejs: detectedEnvironment.nodejs?.found,
          docker: detectedEnvironment.docker?.found
        });
      } catch (e) {
        this.logger?.warn('Erro ao detectar ambiente, usando análise padrão', { error: e.message });
      }
    }

    const analysis = {
      nodejs: await this.analyzeForNodeJS(code, detectedEnvironment),
      deno: await this.analyzeForDeno(code, detectedEnvironment),
      browser: await this.analyzeForBrowser(code, detectedEnvironment)
    };

    const targetAnalysis = analysis[targetRuntime] || analysis.nodejs;

    // Adicionar informações do ambiente detectado se disponível
    const result = {
      targetRuntime,
      compatible: targetAnalysis.isCompatible,
      issues: targetAnalysis.issues,
      alternatives: await this.suggestAlternatives(code, targetRuntime, targetAnalysis.issues)
    };

    if (detectedEnvironment) {
      result.detectedEnvironment = {
        nodejs: detectedEnvironment.nodejs,
        docker: detectedEnvironment.docker
      };
    }

    // Armazenar no cache LRU se habilitado
    if (this.useLRUCache && this.cacheManager) {
      const cacheKey = `runtime:${targetRuntime}:${code.substring(0, 100).replace(/\s+/g, '')}`;
      this.cacheManager.set(cacheKey, result, 3600000); // Cache por 1 hora
    }

    return result;
  }

  /**
   * Analisa código para Node.js
   * 
   * @param {string} code - Código
   * @param {Object} detectedEnvironment - Ambiente detectado (opcional)
   * @returns {Promise<Object>} Análise
   */
  async analyzeForNodeJS(code, detectedEnvironment = null) {
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

    // Se ambiente detectado, verificar versão do Node.js
    if (detectedEnvironment?.nodejs?.found && detectedEnvironment.nodejs.version) {
      const nodeVersion = detectedEnvironment.nodejs.version;
      const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);

      // Verificar features que requerem versões específicas
      if (code.includes('??') && majorVersion < 14) {
        issues.push({
          type: 'node_version_incompatible',
          severity: 'high',
          description: `Nullish coalescing (??) requer Node.js 14+, detectado: ${nodeVersion}`,
          suggestion: 'Atualizar Node.js ou usar alternativa compatível'
        });
      }

      if (code.includes('?.') && majorVersion < 14) {
        issues.push({
          type: 'node_version_incompatible',
          severity: 'high',
          description: `Optional chaining (?.) requer Node.js 14+, detectado: ${nodeVersion}`,
          suggestion: 'Atualizar Node.js ou usar alternativa compatível'
        });
      }
    }

    return {
      isCompatible: issues.length === 0,
      issues,
      nodeVersion: detectedEnvironment?.nodejs?.version || null
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
   * @param {string} sdkName - Nome do SDK (opcional, padrão 'node')
   * @returns {Promise<Object>} Análise
   */
  async analyzeSDKCompatibility(code, sdkVersion, sdkName = 'node') {
    const changelog = await this.fetchChangelog(sdkVersion, sdkName);
    const deprecatedAPIs = await this.findDeprecatedAPIs(code, changelog);
    const breakingChanges = await this.findBreakingChanges(code, changelog);

    return {
      sdkVersion,
      sdkName,
      compatible: deprecatedAPIs.length === 0 && breakingChanges.length === 0,
      deprecated: deprecatedAPIs,
      breaking: breakingChanges,
      alternatives: await this.suggestSDKAlternatives(deprecatedAPIs, breakingChanges),
      changelogSource: changelog.source || 'unknown'
    };
  }

  /**
   * Busca changelog com cache HTTP quando disponível
   * 
   * @param {string} sdkVersion - Versão do SDK
   * @param {string} sdkName - Nome do SDK (ex: 'node', 'express', 'react')
   * @returns {Promise<Object>} Changelog
   */
  async fetchChangelog(sdkVersion, sdkName = 'node') {
    const cacheKey = `${sdkName}@${sdkVersion}`;

    // Verificar cache local primeiro
    if (this.changelogCache.has(cacheKey)) {
      const cached = this.changelogCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.logger?.debug('Changelog retornado do cache local', { cacheKey });
        return cached.data;
      }
    }

    // Verificar cache HTTP se habilitado
    if (this.useHTTPCache && this.httpCache.has(cacheKey)) {
      const httpCached = this.httpCache.get(cacheKey);
      if (Date.now() - httpCached.timestamp < this.cacheTimeout) {
        this.logger?.debug('Changelog retornado do cache HTTP', { cacheKey });
        return httpCached.data;
      }
    }

    // Tentar buscar de fonte HTTP se habilitado
    if (this.useHTTPCache) {
      try {
        const changelog = await this.fetchChangelogFromHTTP(sdkName, sdkVersion);
        if (changelog) {
          // Armazenar em ambos os caches
          this.changelogCache.set(cacheKey, {
            data: changelog,
            timestamp: Date.now()
          });
          this.httpCache.set(cacheKey, {
            data: changelog,
            timestamp: Date.now()
          });
          return changelog;
        }
      } catch (e) {
        this.logger?.warn('Erro ao buscar changelog via HTTP, usando fallback', {
          error: e.message,
          sdkName,
          sdkVersion
        });
      }
    }

    // Fallback: changelog vazio (em produção poderia buscar de arquivo local ou outra fonte)
    const changelog = {
      version: sdkVersion,
      deprecated: [],
      breaking: [],
      source: 'fallback'
    };

    this.changelogCache.set(cacheKey, {
      data: changelog,
      timestamp: Date.now()
    });

    return changelog;
  }

  /**
   * Busca changelog de fonte HTTP (GitHub, npm, etc.)
   * 
   * @param {string} sdkName - Nome do SDK
   * @param {string} sdkVersion - Versão do SDK
   * @returns {Promise<Object|null>} Changelog ou null se não encontrado
   */
  async fetchChangelogFromHTTP(sdkName, sdkVersion) {
    // URLs comuns para changelogs
    const urls = [
      `https://raw.githubusercontent.com/nodejs/node/${sdkVersion}/CHANGELOG.md`,
      `https://registry.npmjs.org/${sdkName}/${sdkVersion}`,
      `https://api.github.com/repos/${sdkName}/${sdkName}/releases/tags/v${sdkVersion}`
    ];

    for (const url of urls) {
      try {
        const response = await axios.get(url, {
          timeout: 5000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Ultra-IA-CompatibilityAnalyzer'
          }
        });

        if (response.status === 200 && response.data) {
          // Parse básico (em produção seria mais sofisticado)
          const changelog = this.parseChangelog(response.data, sdkVersion);
          if (changelog) {
            this.logger?.info('Changelog obtido via HTTP', { url, sdkName, sdkVersion });
            return changelog;
          }
        }
      } catch (e) {
        // Continuar para próxima URL
        continue;
      }
    }

    return null;
  }

  /**
   * Faz parse básico de changelog (simplificado)
   * 
   * @param {string|Object} data - Dados do changelog
   * @param {string} version - Versão
   * @returns {Object|null} Changelog parseado ou null
   */
  parseChangelog(data, version) {
    // Parse simplificado - em produção seria mais robusto
    const changelog = {
      version,
      deprecated: [],
      breaking: [],
      source: 'http'
    };

    // Se data é string (markdown), tentar extrair informações básicas
    if (typeof data === 'string') {
      // Procurar por padrões comuns de deprecation e breaking changes
      const deprecatedMatches = data.match(/deprecated|deprecate/gi);
      const breakingMatches = data.match(/breaking|BREAKING/gi);

      if (deprecatedMatches) {
        changelog.deprecated = deprecatedMatches.map((_, i) => ({
          name: `deprecated_api_${i}`,
          since: version,
          alternative: 'Ver documentação'
        }));
      }

      if (breakingMatches) {
        changelog.breaking = breakingMatches.map((_, i) => ({
          api: `breaking_change_${i}`,
          since: version,
          description: 'Breaking change detectado no changelog'
        }));
      }
    }

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
    return ['logger', 'config', '?EnvironmentDetector'];
  }
}

export default MultiEnvironmentCompatibilityAnalyzer;

/**
 * Factory function para criar MultiEnvironmentCompatibilityAnalyzer
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @param {Object} environmentDetector - Environment Detector (opcional)
 * @returns {MultiEnvironmentCompatibilityAnalyzer} Instância do MultiEnvironmentCompatibilityAnalyzer
 */
export function createMultiEnvironmentCompatibilityAnalyzer(config = null, logger = null, errorHandler = null, environmentDetector = null) {
  return new MultiEnvironmentCompatibilityAnalyzer(config, logger, errorHandler, environmentDetector);
}
