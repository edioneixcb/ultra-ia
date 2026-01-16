/**
 * FileWatcher
 *
 * Observa mudanças no codebase e emite eventos no EventBus.
 */

import chokidar from 'chokidar';
import { getLogger } from '../utils/Logger.js';
import { getEventBus } from '../infrastructure/EventBus.js';

class FileWatcher {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.eventBus = getEventBus(config, this.logger);

    this.rootPath = config?.proactive?.fileWatcher?.rootPath || process.cwd();
    this.ignorePatterns = config?.proactive?.fileWatcher?.ignore || [
      '**/node_modules/**',
      '**/.git/**',
      '**/data/**',
      '**/logs/**'
    ];
    this.debounceMs = config?.proactive?.fileWatcher?.debounceMs || 300;
    this.watcher = null;
    this.debounceMap = new Map();
    this.stats = {
      startedAt: null,
      events: 0
    };
  }

  start() {
    if (this.watcher) {
      return;
    }

    this.watcher = chokidar.watch(this.rootPath, {
      ignored: this.ignorePatterns,
      ignoreInitial: true,
      persistent: true
    });

    this.watcher.on('add', (filePath) => this.emitDebounced('file:created', filePath));
    this.watcher.on('change', (filePath) => this.emitDebounced('file:changed', filePath));
    this.watcher.on('unlink', (filePath) => this.emitDebounced('file:deleted', filePath));

    this.stats.startedAt = new Date().toISOString();
    this.logger?.info('FileWatcher iniciado', { rootPath: this.rootPath });
  }

  emitDebounced(eventName, filePath) {
    const key = `${eventName}:${filePath}`;
    const existing = this.debounceMap.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      this.debounceMap.delete(key);
      this.stats.events += 1;
      this.eventBus.emit(eventName, { filePath, at: Date.now() });
    }, this.debounceMs);
    this.debounceMap.set(key, timer);
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    for (const timer of this.debounceMap.values()) {
      clearTimeout(timer);
    }
    this.debounceMap.clear();
    this.logger?.info('FileWatcher parado');
  }

  getStats() {
    return {
      ...this.stats,
      watching: !!this.watcher,
      rootPath: this.rootPath
    };
  }
}

let instance = null;

/**
 * Obtém instância singleton do FileWatcher.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {FileWatcher} Instância
 */
export function getFileWatcher(config = null, logger = null) {
  if (!instance) {
    instance = new FileWatcher(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do FileWatcher.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {FileWatcher} Nova instância
 */
export function createFileWatcher(config = null, logger = null) {
  return new FileWatcher(config, logger);
}

export default FileWatcher;
