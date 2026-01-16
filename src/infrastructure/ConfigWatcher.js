/**
 * ConfigWatcher
 *
 * Observa alterações em config.json e emite evento de reload.
 */

import { existsSync, watch } from 'fs';
import { join } from 'path';
import { getLogger } from '../utils/Logger.js';
import { getConfigLoader } from '../utils/ConfigLoader.js';
import { getEventBus } from './EventBus.js';

class ConfigWatcher {
  constructor(config = null, logger = null) {
    this.configLoader = getConfigLoader();

    if (!config) {
      if (this.configLoader.config) {
        config = this.configLoader.get();
      } else {
        this.configLoader.load();
        config = this.configLoader.get();
      }
    }

    this.config = config;
    this.logger = logger || getLogger(config);
    this.eventBus = getEventBus(config, this.logger);

    const fallbackPath = join(process.cwd(), 'config', 'config.json');
    this.configPath = process.env.ULTRA_CONFIG_PATH || this.configLoader.getInfo().configPath || fallbackPath;
    this.debounceMs = config?.proactive?.configWatcher?.debounceMs || 500;
    this.watcher = null;
    this.debounceTimer = null;
  }

  start() {
    if (this.watcher) {
      return;
    }

    if (!existsSync(this.configPath)) {
      this.logger?.warn('ConfigWatcher: config.json não encontrado', { configPath: this.configPath });
      return;
    }

    this.watcher = watch(this.configPath, { persistent: true }, (eventType) => {
      if (eventType !== 'change') {
        return;
      }
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        this.reload();
      }, this.debounceMs);
    });

    this.logger?.info('ConfigWatcher iniciado', { configPath: this.configPath });
  }

  reload() {
    const result = this.configLoader.reload(this.configPath);
    if (result.success) {
      this.config = this.configLoader.get();
      this.eventBus.emit('config:changed', {
        configPath: this.configPath,
        validation: result.validation,
        changed: result.configChanged
      });
      this.logger?.info('ConfigWatcher: configuração recarregada', {
        configPath: this.configPath,
        changed: result.configChanged
      });
    } else {
      this.eventBus.emit('config:reload_failed', {
        configPath: this.configPath,
        error: result.error
      });
      this.logger?.warn('ConfigWatcher: falha ao recarregar', {
        configPath: this.configPath,
        error: result.error
      });
    }
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.logger?.info('ConfigWatcher parado');
  }
}

let instance = null;

/**
 * Obtém instância singleton do ConfigWatcher.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {ConfigWatcher} Instância
 */
export function getConfigWatcher(config = null, logger = null) {
  if (!instance) {
    instance = new ConfigWatcher(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do ConfigWatcher.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {ConfigWatcher} Nova instância
 */
export function createConfigWatcher(config = null, logger = null) {
  return new ConfigWatcher(config, logger);
}

export default ConfigWatcher;
