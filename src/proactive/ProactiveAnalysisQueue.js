/**
 * ProactiveAnalysisQueue
 *
 * Fila de análises com priorização e processamento assíncrono.
 */

import { getLogger } from '../utils/Logger.js';

const PRIORITIES = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
};

class ProactiveAnalysisQueue {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.maxSize = config?.proactive?.queue?.maxSize || 100;
    this.processing = false;
    this.queue = [];
    this.processor = null;
  }

  /**
   * Enfileira um item com prioridade.
   * @param {object} item - Item da fila
   * @param {string} priority - CRITICAL | HIGH | MEDIUM | LOW
   */
  enqueue(item, priority = 'MEDIUM') {
    const normalized = PRIORITIES[priority] !== undefined ? priority : 'MEDIUM';
    const entry = {
      id: item.id || `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      priority: normalized,
      payload: item,
      createdAt: Date.now()
    };

    if (this.queue.length >= this.maxSize) {
      this.queue.sort((a, b) => PRIORITIES[b.priority] - PRIORITIES[a.priority]);
      this.queue.shift();
    }

    this.queue.push(entry);
    this.queue.sort((a, b) => PRIORITIES[a.priority] - PRIORITIES[b.priority]);
    return entry.id;
  }

  /**
   * Inicia o processamento com um callback.
   * @param {Function} processor - Função async que recebe payload
   */
  start(processor) {
    if (this.processing) {
      return;
    }
    if (typeof processor !== 'function') {
      throw new Error('Processor deve ser uma função');
    }
    this.processor = processor;
    this.processing = true;
    this.runLoop();
  }

  async runLoop() {
    while (this.processing) {
      const next = this.queue.shift();
      if (!next) {
        await new Promise(resolve => setTimeout(resolve, 50));
        continue;
      }

      try {
        await this.processor(next.payload);
      } catch (error) {
        this.logger?.warn('Erro ao processar item da fila', {
          id: next.id,
          error: error.message
        });
      }
    }
  }

  stop() {
    this.processing = false;
    this.processor = null;
  }

  getStats() {
    return {
      size: this.queue.length,
      processing: this.processing,
      maxSize: this.maxSize
    };
  }
}

let instance = null;

/**
 * Obtém instância singleton do ProactiveAnalysisQueue.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {ProactiveAnalysisQueue} Instância
 */
export function getProactiveAnalysisQueue(config = null, logger = null) {
  if (!instance) {
    instance = new ProactiveAnalysisQueue(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do ProactiveAnalysisQueue.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {ProactiveAnalysisQueue} Nova instância
 */
export function createProactiveAnalysisQueue(config = null, logger = null) {
  return new ProactiveAnalysisQueue(config, logger);
}

export default ProactiveAnalysisQueue;
