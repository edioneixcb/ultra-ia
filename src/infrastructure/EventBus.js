/**
 * EventBus
 *
 * Wrapper simples sobre EventEmitter para comunicação assíncrona
 * entre componentes. Fornece métricas básicas de emissão e listeners.
 */

import { EventEmitter } from 'events';
import { getLogger } from '../utils/Logger.js';

class EventBus {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.emitter = new EventEmitter();
    this.maxListeners = config?.proactive?.eventBus?.maxListeners || 50;
    this.emitter.setMaxListeners(this.maxListeners);

    this.stats = {
      emitted: 0,
      listeners: 0,
      events: new Map()
    };
  }

  /**
   * Emite um evento com payload opcional.
   * @param {string} event - Nome do evento
   * @param {any} payload - Dados do evento
   */
  emit(event, payload = null) {
    this.stats.emitted += 1;
    const count = this.stats.events.get(event) || 0;
    this.stats.events.set(event, count + 1);
    this.emitter.emit(event, payload);
    return true;
  }

  /**
   * Registra um listener.
   * @param {string} event - Nome do evento
   * @param {Function} handler - Callback
   */
  on(event, handler) {
    this.emitter.on(event, handler);
    this.updateListenerStats();
    return this;
  }

  /**
   * Registra um listener que dispara uma vez.
   * @param {string} event - Nome do evento
   * @param {Function} handler - Callback
   */
  once(event, handler) {
    this.emitter.once(event, handler);
    this.updateListenerStats();
    return this;
  }

  /**
   * Remove um listener.
   * @param {string} event - Nome do evento
   * @param {Function} handler - Callback
   */
  off(event, handler) {
    this.emitter.off(event, handler);
    this.updateListenerStats();
    return this;
  }

  /**
   * Retorna estatísticas do EventBus.
   */
  getStats() {
    return {
      emitted: this.stats.emitted,
      listeners: this.stats.listeners,
      events: Object.fromEntries(this.stats.events.entries())
    };
  }

  updateListenerStats() {
    const eventNames = this.emitter.eventNames();
    let total = 0;
    for (const name of eventNames) {
      total += this.emitter.listenerCount(name);
    }
    this.stats.listeners = total;
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do EventBus.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {EventBus} Instância
 */
export function getEventBus(config = null, logger = null) {
  if (!instance) {
    instance = new EventBus(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do EventBus.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {EventBus} Nova instância
 */
export function createEventBus(config = null, logger = null) {
  return new EventBus(config, logger);
}

export default EventBus;
