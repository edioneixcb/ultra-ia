/**
 * PlatformSpecificGenerator - Gerador Específico por Plataforma
 * 
 * Gera código específico para cada plataforma.
 * 
 * Funcionalidades:
 * - Geração por Plataforma Desktop (Windows, Linux, macOS)
 * - Geração para Web (navegadores, responsivo)
 * - Geração Mobile (React Native, Android, iOS)
 * - Adaptação Automática (adaptar código para plataforma)
 * 
 * Métricas de Sucesso:
 * - 100% do código gerado é específico para plataforma
 * - 100% do código é compatível com plataforma alvo
 */

import BaseSystem from '../../core/BaseSystem.js';

class PlatformSpecificGenerator extends BaseSystem {
  async onInitialize() {
    this.generations = new Map();
    this.logger?.info('PlatformSpecificGenerator inicializado');
  }

  /**
   * Gera código específico por plataforma
   * 
   * @param {Object} context - Contexto com code, targetPlatform e opções
   * @returns {Promise<Object>} Código gerado
   */
  async onExecute(context) {
    const { action, code, targetPlatform, options = {}, generationId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'generate') {
      if (!code || !targetPlatform) {
        throw new Error('code e targetPlatform são obrigatórios para generate');
      }
      return await this.generatePlatformSpecific(code, targetPlatform, options, generationId);
    } else if (action === 'getGeneration') {
      if (!generationId) {
        throw new Error('generationId é obrigatório para getGeneration');
      }
      return this.getGeneration(generationId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Gera código específico por plataforma
   * 
   * @param {string} code - Código base
   * @param {string} targetPlatform - Plataforma alvo (windows, linux, macos, web, android, ios)
   * @param {Object} options - Opções
   * @param {string} generationId - ID da geração (opcional)
   * @returns {Promise<Object>} Código gerado
   */
  async generatePlatformSpecific(code, targetPlatform, options = {}, generationId = null) {
    const id = generationId || `generation-${Date.now()}`;

    let generatedCode = code;

    // Adaptar código para plataforma específica
    switch (targetPlatform.toLowerCase()) {
      case 'windows':
        generatedCode = this.adaptForWindows(code, options);
        break;
      case 'linux':
        generatedCode = this.adaptForLinux(code, options);
        break;
      case 'macos':
        generatedCode = this.adaptForMacOS(code, options);
        break;
      case 'web':
        generatedCode = this.adaptForWeb(code, options);
        break;
      case 'android':
        generatedCode = this.adaptForAndroid(code, options);
        break;
      case 'ios':
        generatedCode = this.adaptForIOS(code, options);
        break;
      default:
        throw new Error(`Plataforma não suportada: ${targetPlatform}`);
    }

    const result = {
      id,
      originalCode: code,
      generatedCode,
      targetPlatform,
      adaptations: this.getAdaptations(code, generatedCode),
      generatedAt: new Date().toISOString()
    };

    this.generations.set(id, result);

    return result;
  }

  /**
   * Adapta código para Windows
   * 
   * @param {string} code - Código
   * @param {Object} options - Opções
   * @returns {string} Código adaptado
   */
  adaptForWindows(code, options) {
    let adapted = code;

    // Substituir caminhos Unix por Windows
    adapted = adapted.replace(/\/path\/to\//g, 'C:\\path\\to\\');
    adapted = adapted.replace(/\/tmp\//g, 'C:\\temp\\');

    // Adicionar imports específicos do Windows se necessário
    if (/fs\.|path\./i.test(code)) {
      adapted = `// Windows-specific adaptations\n${adapted}`;
    }

    return adapted;
  }

  /**
   * Adapta código para Linux
   * 
   * @param {string} code - Código
   * @param {Object} options - Opções
   * @returns {string} Código adaptado
   */
  adaptForLinux(code, options) {
    let adapted = code;

    // Garantir caminhos Unix
    adapted = adapted.replace(/C:\\/g, '/');
    adapted = adapted.replace(/\\/g, '/');

    return adapted;
  }

  /**
   * Adapta código para macOS
   * 
   * @param {string} code - Código
   * @param {Object} options - Opções
   * @returns {string} Código adaptado
   */
  adaptForMacOS(code, options) {
    // macOS é similar ao Linux para caminhos
    return this.adaptForLinux(code, options);
  }

  /**
   * Adapta código para Web
   * 
   * @param {string} code - Código
   * @param {Object} options - Opções
   * @returns {string} Código adaptado
   */
  adaptForWeb(code, options) {
    let adapted = code;

    // Remover imports Node.js específicos
    adapted = adapted.replace(/require\s*\(['"]fs['"]\)/g, '// fs not available in browser');
    adapted = adapted.replace(/require\s*\(['"]path['"]\)/g, '// path not available in browser');

    // Adicionar verificações de browser
    if (/process\./i.test(code)) {
      adapted = `// Browser environment\nif (typeof window === 'undefined') {\n  throw new Error('This code requires a browser environment');\n}\n\n${adapted}`;
    }

    // Adicionar responsividade se solicitado
    if (options.responsive) {
      adapted = this.addResponsiveCode(adapted);
    }

    return adapted;
  }

  /**
   * Adiciona código responsivo
   * 
   * @param {string} code - Código
   * @returns {string} Código com responsividade
   */
  addResponsiveCode(code) {
    return `// Responsive design helpers
const isMobile = window.innerWidth < 768;
const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
const isDesktop = window.innerWidth >= 1024;

${code}`;
  }

  /**
   * Adapta código para Android
   * 
   * @param {string} code - Código
   * @param {Object} options - Opções
   * @returns {string} Código adaptado
   */
  adaptForAndroid(code, options) {
    let adapted = code;

    // Adicionar imports React Native
    if (!/import.*react-native/i.test(adapted)) {
      adapted = `import { Platform } from 'react-native';\n${adapted}`;
    }

    // Adicionar verificações de plataforma Android
    adapted = adapted.replace(/Platform\.OS/g, "Platform.OS === 'android' ? 'android' : Platform.OS");

    return adapted;
  }

  /**
   * Adapta código para iOS
   * 
   * @param {string} code - Código
   * @param {Object} options - Opções
   * @returns {string} Código adaptado
   */
  adaptForIOS(code, options) {
    let adapted = code;

    // Adicionar imports React Native
    if (!/import.*react-native/i.test(adapted)) {
      adapted = `import { Platform } from 'react-native';\n${adapted}`;
    }

    // Adicionar verificações de plataforma iOS
    adapted = adapted.replace(/Platform\.OS/g, "Platform.OS === 'ios' ? 'ios' : Platform.OS");

    return adapted;
  }

  /**
   * Obtém adaptações aplicadas
   * 
   * @param {string} original - Código original
   * @param {string} adapted - Código adaptado
   * @returns {Array<Object>} Lista de adaptações
   */
  getAdaptations(original, adapted) {
    const adaptations = [];

    if (original !== adapted) {
      adaptations.push({
        type: 'code_modification',
        description: 'Código foi adaptado para plataforma específica'
      });
    }

    return adaptations;
  }

  /**
   * Obtém geração armazenada
   * 
   * @param {string} generationId - ID da geração
   * @returns {Object|null} Geração ou null
   */
  getGeneration(generationId) {
    return this.generations.get(generationId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.generations.values());

    return {
      totalGenerations: all.length,
      platformsUsed: [...new Set(all.map(g => g.targetPlatform))]
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

export default PlatformSpecificGenerator;

export function createPlatformSpecificGenerator(config = null, logger = null, errorHandler = null) {
  return new PlatformSpecificGenerator(config, logger, errorHandler);
}
