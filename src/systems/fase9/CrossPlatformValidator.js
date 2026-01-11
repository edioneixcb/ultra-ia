/**
 * CrossPlatformValidator - Validador Cross-Platform
 * 
 * Valida compatibilidade cross-platform de código.
 * 
 * Funcionalidades:
 * - Validação de Compatibilidade (validar código em múltiplas plataformas)
 * - Detecção de Problemas Cross-Platform (detectar problemas específicos)
 * - Sugestões de Correção (sugerir correções para compatibilidade)
 * 
 * Métricas de Sucesso:
 * - 100% do código é validado em todas as plataformas
 * - 100% dos problemas cross-platform são detectados
 */

import BaseSystem from '../../core/BaseSystem.js';

class CrossPlatformValidator extends BaseSystem {
  async onInitialize() {
    this.validations = new Map();
    this.logger?.info('CrossPlatformValidator inicializado');
  }

  /**
   * Valida compatibilidade cross-platform
   * 
   * @param {Object} context - Contexto com code, platforms e opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async onExecute(context) {
    const { action, code, platforms = [], options = {}, validationId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'validate') {
      if (!code) {
        throw new Error('code é obrigatório para validate');
      }
      return await this.validateCrossPlatform(code, platforms, options, validationId);
    } else if (action === 'getValidation') {
      if (!validationId) {
        throw new Error('validationId é obrigatório para getValidation');
      }
      return this.getValidation(validationId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Valida compatibilidade cross-platform
   * 
   * @param {string} code - Código a validar
   * @param {Array<string>} platforms - Plataformas a validar
   * @param {Object} options - Opções
   * @param {string} validationId - ID da validação (opcional)
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateCrossPlatform(code, platforms = [], options = {}, validationId = null) {
    const id = validationId || `validation-${Date.now()}`;
    const targetPlatforms = platforms.length > 0 ? platforms : ['windows', 'linux', 'macos', 'web'];

    const platformResults = [];

    // Validar em cada plataforma
    for (const platform of targetPlatforms) {
      const platformResult = await this.validateForPlatform(code, platform, options);
      platformResults.push({
        platform,
        ...platformResult
      });
    }

    // Detectar problemas cross-platform
    const crossPlatformIssues = this.detectCrossPlatformIssues(code, platformResults);

    // Gerar sugestões
    const suggestions = this.generateSuggestions(crossPlatformIssues);

    const allValid = platformResults.every(r => r.valid) && crossPlatformIssues.length === 0;

    const result = {
      id,
      valid: allValid,
      platforms: platformResults,
      crossPlatformIssues,
      suggestions,
      validatedAt: new Date().toISOString()
    };

    this.validations.set(id, result);

    return result;
  }

  /**
   * Valida código para plataforma específica
   * 
   * @param {string} code - Código
   * @param {string} platform - Plataforma
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateForPlatform(code, platform, options) {
    const issues = [];

    switch (platform.toLowerCase()) {
      case 'windows':
        issues.push(...this.validateWindows(code));
        break;
      case 'linux':
        issues.push(...this.validateLinux(code));
        break;
      case 'macos':
        issues.push(...this.validateMacOS(code));
        break;
      case 'web':
        issues.push(...this.validateWeb(code));
        break;
      case 'android':
        issues.push(...this.validateAndroid(code));
        break;
      case 'ios':
        issues.push(...this.validateIOS(code));
        break;
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Valida para Windows
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Issues encontradas
   */
  validateWindows(code) {
    const issues = [];

    // Verificar uso de caminhos Unix
    if (/\/tmp\/|\/var\/|\/usr\//.test(code) && !/process\.platform/.test(code)) {
      issues.push({
        type: 'unix_path',
        severity: 'high',
        description: 'Código usa caminhos Unix que podem não funcionar no Windows',
        platform: 'windows'
      });
    }

    return issues;
  }

  /**
   * Valida para Linux
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Issues encontradas
   */
  validateLinux(code) {
    const issues = [];

    // Verificar uso de caminhos Windows
    if (/C:\\|D:\\/.test(code) && !/process\.platform/.test(code)) {
      issues.push({
        type: 'windows_path',
        severity: 'high',
        description: 'Código usa caminhos Windows que não funcionam no Linux',
        platform: 'linux'
      });
    }

    return issues;
  }

  /**
   * Valida para macOS
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Issues encontradas
   */
  validateMacOS(code) {
    // Similar ao Linux
    return this.validateLinux(code);
  }

  /**
   * Valida para Web
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Issues encontradas
   */
  validateWeb(code) {
    const issues = [];

    // Verificar uso de módulos Node.js
    if (/require\s*\(['"]fs['"]|require\s*\(['"]path['"]|process\./i.test(code)) {
      issues.push({
        type: 'nodejs_module',
        severity: 'high',
        description: 'Código usa módulos Node.js que não estão disponíveis no browser',
        platform: 'web'
      });
    }

    return issues;
  }

  /**
   * Valida para Android
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Issues encontradas
   */
  validateAndroid(code) {
    const issues = [];

    // Verificar se usa Platform.OS para Android
    if (!/Platform\.OS|Platform\.select/i.test(code) && /android|Android/i.test(code)) {
      issues.push({
        type: 'missing_platform_check',
        severity: 'medium',
        description: 'Código Android deve usar Platform.OS para verificação',
        platform: 'android'
      });
    }

    return issues;
  }

  /**
   * Valida para iOS
   * 
   * @param {string} code - Código
   * @returns {Array<Object>} Issues encontradas
   */
  validateIOS(code) {
    const issues = [];

    // Verificar se usa Platform.OS para iOS
    if (!/Platform\.OS|Platform\.select/i.test(code) && /ios|iOS/i.test(code)) {
      issues.push({
        type: 'missing_platform_check',
        severity: 'medium',
        description: 'Código iOS deve usar Platform.OS para verificação',
        platform: 'ios'
      });
    }

    return issues;
  }

  /**
   * Detecta problemas cross-platform
   * 
   * @param {string} code - Código
   * @param {Array<Object>} platformResults - Resultados por plataforma
   * @returns {Array<Object>} Problemas encontrados
   */
  detectCrossPlatformIssues(code, platformResults) {
    const issues = [];

    // Verificar se código tem problemas em múltiplas plataformas
    const platformsWithIssues = platformResults.filter(r => !r.valid);
    if (platformsWithIssues.length > 1) {
      issues.push({
        type: 'multiple_platform_issues',
        severity: 'high',
        description: `Código tem problemas em ${platformsWithIssues.length} plataformas`,
        affectedPlatforms: platformsWithIssues.map(r => r.platform)
      });
    }

    // Verificar uso de APIs não padronizadas
    if (/execSync|spawnSync/i.test(code) && !/process\.platform/i.test(code)) {
      issues.push({
        type: 'non_standard_api',
        severity: 'medium',
        description: 'Código usa APIs que podem não estar disponíveis em todas as plataformas'
      });
    }

    return issues;
  }

  /**
   * Gera sugestões de correção
   * 
   * @param {Array<Object>} issues - Issues encontradas
   * @returns {Array<Object>} Sugestões
   */
  generateSuggestions(issues) {
    return issues.map(issue => ({
      issue,
      suggestion: this.getSuggestionForIssue(issue)
    }));
  }

  /**
   * Obtém sugestão para issue específica
   * 
   * @param {Object} issue - Issue
   * @returns {string} Sugestão
   */
  getSuggestionForIssue(issue) {
    const suggestions = {
      unix_path: 'Usar path.join() ou process.platform para caminhos cross-platform',
      windows_path: 'Usar path.join() ou process.platform para caminhos cross-platform',
      nodejs_module: 'Usar APIs do browser ou verificar se está em ambiente Node.js',
      missing_platform_check: 'Adicionar verificação Platform.OS antes de código específico',
      multiple_platform_issues: 'Revisar código para garantir compatibilidade cross-platform',
      non_standard_api: 'Usar APIs padronizadas ou adicionar verificações de plataforma'
    };

    return suggestions[issue.type] || 'Revisar código para compatibilidade cross-platform';
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

    return {
      totalValidations: all.length,
      validCrossPlatform: all.filter(v => v.valid).length
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

export default CrossPlatformValidator;

export function createCrossPlatformValidator(config = null, logger = null, errorHandler = null) {
  return new CrossPlatformValidator(config, logger, errorHandler);
}
