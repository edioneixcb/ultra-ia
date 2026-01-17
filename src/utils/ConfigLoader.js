/**
 * Sistema de Configuração Centralizado
 * 
 * Carrega configuração de múltiplas fontes:
 * 1. Arquivo config/config.json (padrão)
 * 2. Variáveis de ambiente (sobrescreve JSON)
 * 3. Valores padrão (fallback)
 * 
 * Valida configuração obrigatória na inicialização.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ConfigLoader {
  constructor() {
    this.config = null;
    this.configPath = null;
    this.loadedAt = null;
  }

  /**
   * Carrega configuração de todas as fontes
   * @param {string} customConfigPath - Caminho customizado para config.json (opcional)
   * @returns {object} Configuração carregada e validada
   */
  load(customConfigPath = null) {
    // Determinar caminho do config
    if (customConfigPath) {
      this.configPath = customConfigPath;
    } else {
      // Caminho padrão: raiz do projeto/config/config.json
      const projectRoot = join(__dirname, '../../');
      this.configPath = join(projectRoot, 'config', 'config.json');
    }

    // Carregar configuração base do JSON
    const baseConfig = this.loadFromFile(this.configPath);

    // Carregar variáveis de ambiente
    const envConfig = this.loadFromEnv();

    // Mesclar: JSON base + env vars (env sobrescreve JSON)
    this.config = this.mergeConfig(baseConfig, envConfig);

    // Expandir variáveis de ambiente em paths
    this.config = this.expandPaths(this.config);

    // Validar configuração obrigatória
    this.validate();

    this.loadedAt = new Date().toISOString();

    return this.config;
  }

  /**
   * Carrega configuração do arquivo JSON
   * @param {string} configPath - Caminho do arquivo config.json
   * @returns {object} Configuração do arquivo ou objeto vazio
   */
  loadFromFile(configPath) {
    if (!existsSync(configPath)) {
      console.warn(`⚠️  Arquivo de configuração não encontrado: ${configPath}`);
      console.warn('   Usando valores padrão e variáveis de ambiente');
      return {};
    }

    try {
      const fileContent = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(fileContent);
      return config;
    } catch (error) {
      throw new Error(`Erro ao carregar configuração de ${configPath}: ${error.message}`);
    }
  }

  /**
   * Carrega configuração de variáveis de ambiente
   * @returns {object} Configuração das env vars
   */
  loadFromEnv() {
    const envConfig = {};

    // Mapear variáveis de ambiente para estrutura de config
    if (process.env.NODE_ENV) {
      envConfig.environment = process.env.NODE_ENV;
    }

    if (process.env.PORT) {
      envConfig.port = parseInt(process.env.PORT, 10);
    }

    // Ollama
    if (process.env.OLLAMA_URL) {
      envConfig.services = envConfig.services || {};
      envConfig.services.ollama = envConfig.services.ollama || {};
      envConfig.services.ollama.url = process.env.OLLAMA_URL;
    }

    if (process.env.OLLAMA_DEFAULT_MODEL) {
      envConfig.services = envConfig.services || {};
      envConfig.services.ollama = envConfig.services.ollama || {};
      envConfig.services.ollama.defaultModel = process.env.OLLAMA_DEFAULT_MODEL;
    }

    // Paths
    if (process.env.SYSTEM_ROOT) {
      envConfig.paths = envConfig.paths || {};
      envConfig.paths.systemRoot = process.env.SYSTEM_ROOT;
    }

    if (process.env.KNOWLEDGE_BASE_PATH) {
      envConfig.paths = envConfig.paths || {};
      envConfig.paths.knowledgeBase = process.env.KNOWLEDGE_BASE_PATH;
    }

    if (process.env.CONTEXT_PATH) {
      envConfig.paths = envConfig.paths || {};
      envConfig.paths.context = process.env.CONTEXT_PATH;
    }

    if (process.env.LOGS_PATH) {
      envConfig.paths = envConfig.paths || {};
      envConfig.paths.logs = process.env.LOGS_PATH;
    }

    // API Auth - permite habilitar autenticação via env (para produção)
    if (process.env.API_AUTH_ENABLED) {
      envConfig.api = envConfig.api || {};
      envConfig.api.auth = envConfig.api.auth || {};
      envConfig.api.auth.enabled = process.env.API_AUTH_ENABLED === 'true';
    }

    if (process.env.API_KEY) {
      envConfig.api = envConfig.api || {};
      envConfig.api.auth = envConfig.api.auth || {};
      envConfig.api.auth.apiKey = process.env.API_KEY;
    }

    return envConfig;
  }

  /**
   * Mescla duas configurações (segunda sobrescreve primeira)
   * @param {object} base - Configuração base
   * @param {object} override - Configuração que sobrescreve
   * @returns {object} Configuração mesclada
   */
  mergeConfig(base, override) {
    const merged = { ...base };

    for (const key in override) {
      if (override[key] !== null && override[key] !== undefined) {
        if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
          merged[key] = this.mergeConfig(merged[key] || {}, override[key]);
        } else {
          merged[key] = override[key];
        }
      }
    }

    return merged;
  }

  /**
   * Expande variáveis de ambiente em paths
   * @param {object} config - Configuração
   * @returns {object} Configuração com paths expandidos
   */
  expandPaths(config) {
    if (!config.paths) {
      return config;
    }

    const expanded = { ...config };
    const home = process.env.HOME || process.env.USERPROFILE || '~';
    
    // Calcular PROJECT_ROOT baseado na localização do ConfigLoader
    // ConfigLoader está em src/utils/, então projeto raiz é ../../ a partir dele
    const projectRoot = join(__dirname, '../../');

    for (const key in expanded.paths) {
      if (typeof expanded.paths[key] === 'string') {
        let path = expanded.paths[key];
        
        // Expandir ${PROJECT_ROOT} primeiro (antes de $HOME)
        path = path.replace(/\$\{PROJECT_ROOT\}/g, projectRoot);
        
        // Expandir ~ para home
        path = path.replace(/^~/, home);
        
        // Expandir $HOME
        path = path.replace(/\$HOME/g, home);
        
        // Expandir ${HOME}
        path = path.replace(/\$\{HOME\}/g, home);
        
        expanded.paths[key] = path;
      }
    }

    return expanded;
  }

  /**
   * Valida configuração obrigatória
   * @throws {Error} Se configuração obrigatória estiver faltando
   */
  validate() {
    const errors = [];

    // Validar estrutura básica
    if (!this.config) {
      errors.push('Configuração não carregada');
    }

    // Validar services.ollama (obrigatório)
    if (!this.config.services || !this.config.services.ollama) {
      errors.push('services.ollama não configurado');
    } else {
      if (!this.config.services.ollama.url) {
        errors.push('services.ollama.url não configurado');
      }
      if (!this.config.services.ollama.defaultModel) {
        errors.push('services.ollama.defaultModel não configurado');
      }
    }

    // Validar paths (obrigatórios)
    if (!this.config.paths) {
      errors.push('paths não configurado');
    } else {
      const requiredPaths = ['systemRoot', 'knowledgeBase', 'context', 'logs'];
      for (const pathKey of requiredPaths) {
        if (!this.config.paths[pathKey]) {
          errors.push(`paths.${pathKey} não configurado`);
        }
      }
    }

    // Validar environment
    if (!this.config.environment) {
      // Usar padrão se não especificado
      this.config.environment = process.env.NODE_ENV || 'development';
    }

    // Validar port
    if (!this.config.port) {
      this.config.port = parseInt(process.env.PORT || '3000', 10);
    }

    if (errors.length > 0) {
      throw new Error(`Erros de validação de configuração:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }
  }

  /**
   * Retorna configuração carregada
   * @returns {object} Configuração atual
   */
  get() {
    if (!this.config) {
      throw new Error('Configuração não carregada. Chame load() primeiro.');
    }
    return this.config;
  }

  /**
   * Retorna valor de configuração específico
   * @param {string} path - Caminho da configuração (ex: 'services.ollama.url')
   * @param {any} defaultValue - Valor padrão se não encontrado
   * @returns {any} Valor da configuração ou defaultValue
   */
  getValue(path, defaultValue = null) {
    if (!this.config) {
      throw new Error('Configuração não carregada. Chame load() primeiro.');
    }

    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value === null || value === undefined || typeof value !== 'object') {
        return defaultValue;
      }
      value = value[key];
    }

    return value !== undefined ? value : defaultValue;
  }

  /**
   * Retorna informações sobre a configuração carregada
   * @returns {object} Metadados da configuração
   */
  getInfo() {
    return {
      loadedAt: this.loadedAt,
      configPath: this.configPath,
      environment: this.config?.environment,
      hasConfig: !!this.config,
    };
  }

  /**
   * Valida configuração em runtime
   * @returns {object} Resultado da validação
   */
  validateRuntime() {
    const errors = [];
    const warnings = [];

    if (!this.config) {
      errors.push('Configuração não carregada');
      return { valid: false, errors, warnings };
    }

    // Validar estrutura básica
    if (!this.config.services || !this.config.services.ollama) {
      errors.push('services.ollama não configurado');
    } else {
      if (!this.config.services.ollama.url) {
        errors.push('services.ollama.url não configurado');
      }
      if (!this.config.services.ollama.defaultModel) {
        errors.push('services.ollama.defaultModel não configurado');
      }
    }

    // Validar paths
    if (!this.config.paths) {
      errors.push('paths não configurado');
    } else {
      const requiredPaths = ['systemRoot', 'knowledgeBase', 'context', 'logs'];
      for (const pathKey of requiredPaths) {
        if (!this.config.paths[pathKey]) {
          errors.push(`paths.${pathKey} não configurado`);
        }
      }
    }

    // Validar valores numéricos
    if (this.config.port && (typeof this.config.port !== 'number' || this.config.port < 1 || this.config.port > 65535)) {
      errors.push('port deve ser um número entre 1 e 65535');
    }

    // Warnings para valores padrão
    if (!this.config.environment) {
      warnings.push('environment não configurado, usando padrão');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Recarrega configuração com validação
   * @param {string} customConfigPath - Caminho customizado (opcional)
   * @returns {object} Resultado do reload
   */
  reload(customConfigPath = null) {
    try {
      const oldConfig = { ...this.config };
      this.load(customConfigPath);
      const validation = this.validateRuntime();
      
      return {
        success: validation.valid,
        validation,
        configChanged: JSON.stringify(oldConfig) !== JSON.stringify(this.config)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        validation: { valid: false, errors: [error.message], warnings: [] }
      };
    }
  }
}

// Singleton instance with initialization lock
let instance = null;
let initializationPromise = null;

/**
 * Obtém instância singleton do ConfigLoader
 * Thread-safe: previne criação dupla durante inicialização concorrente
 * @returns {ConfigLoader} Instância do ConfigLoader
 */
export function getConfigLoader() {
  if (!instance) {
    instance = new ConfigLoader();
  }
  return instance;
}

/**
 * Carrega configuração e retorna instância configurada
 * @param {string} customConfigPath - Caminho customizado (opcional)
 * @returns {ConfigLoader} Instância configurada
 */
export function loadConfig(customConfigPath = null) {
  const loader = getConfigLoader();
  loader.load(customConfigPath);
  return loader;
}

export default ConfigLoader;
