/**
 * Metrics Collector
 * 
 * Coleta métricas abrangentes do sistema:
 * - Requests por endpoint (contagem, latência, status)
 * - Taxa de erros por tipo
 * - Métricas por componente
 * - Recursos do sistema (memória, CPU)
 * - Histórico de métricas com retenção configurável
 */

import { getLogger } from './Logger.js';
import os from 'os';

class MetricsCollector {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    
    // Configuração
    this.historySize = config?.metrics?.historySize || 1000;
    this.retentionMs = config?.metrics?.retentionMs || 3600000; // 1 hora
    
    // Métricas atuais
    this.metrics = {
      requests: {},        // Por endpoint
      errors: {},          // Por tipo/endpoint
      latency: {},         // Por endpoint (histograma)
      components: {},      // Por componente
      custom: {}           // Métricas customizadas
    };
    
    // Histórico de métricas
    this.history = [];
    
    // Contadores globais
    this.counters = {
      totalRequests: 0,
      totalErrors: 0,
      startTime: Date.now()
    };
    
    // Iniciar coleta periódica de recursos do sistema
    this.startSystemMetricsCollection();
  }

  /**
   * Registra uma requisição HTTP
   * @param {string} endpoint - Endpoint da requisição
   * @param {string} method - Método HTTP
   * @param {number} duration - Duração em ms
   * @param {number} statusCode - Código de status HTTP
   */
  recordRequest(endpoint, method, duration, statusCode) {
    const key = `${method} ${endpoint}`;
    const now = Date.now();
    
    if (!this.metrics.requests[key]) {
      this.metrics.requests[key] = {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0,
        statusCodes: {},
        lastRequest: null
      };
    }
    
    const metric = this.metrics.requests[key];
    metric.count++;
    metric.totalDuration += duration;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.avgDuration = metric.totalDuration / metric.count;
    metric.lastRequest = now;
    
    // Contar por status code
    const statusCategory = `${Math.floor(statusCode / 100)}xx`;
    metric.statusCodes[statusCategory] = (metric.statusCodes[statusCategory] || 0) + 1;
    
    // Atualizar contador global
    this.counters.totalRequests++;
    
    // Adicionar ao histograma de latência
    this.recordLatency(key, duration);
    
    // Adicionar ao histórico
    this.addToHistory({
      type: 'request',
      endpoint: key,
      duration,
      statusCode,
      timestamp: now
    });
  }

  /**
   * Registra um erro
   * @param {string} endpoint - Endpoint onde ocorreu o erro
   * @param {Error|string} error - Erro ocorrido
   * @param {object} context - Contexto adicional
   */
  recordError(endpoint, error, context = {}) {
    const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
    const errorKey = `${endpoint}:${errorType}`;
    const now = Date.now();
    
    if (!this.metrics.errors[errorKey]) {
      this.metrics.errors[errorKey] = {
        count: 0,
        lastOccurrence: null,
        samples: []
      };
    }
    
    const metric = this.metrics.errors[errorKey];
    metric.count++;
    metric.lastOccurrence = now;
    
    // Manter últimas 10 amostras
    if (metric.samples.length >= 10) {
      metric.samples.shift();
    }
    metric.samples.push({
      message: error instanceof Error ? error.message : String(error),
      timestamp: now,
      ...context
    });
    
    // Atualizar contador global
    this.counters.totalErrors++;
    
    // Adicionar ao histórico
    this.addToHistory({
      type: 'error',
      endpoint,
      errorType,
      message: error instanceof Error ? error.message : String(error),
      timestamp: now
    });
  }

  /**
   * Registra latência em histograma
   * @param {string} key - Chave do endpoint
   * @param {number} duration - Duração em ms
   */
  recordLatency(key, duration) {
    if (!this.metrics.latency[key]) {
      this.metrics.latency[key] = {
        buckets: {
          '<10ms': 0,
          '<50ms': 0,
          '<100ms': 0,
          '<500ms': 0,
          '<1s': 0,
          '<5s': 0,
          '>5s': 0
        },
        percentiles: []
      };
    }
    
    const latency = this.metrics.latency[key];
    
    // Atualizar buckets
    if (duration < 10) latency.buckets['<10ms']++;
    else if (duration < 50) latency.buckets['<50ms']++;
    else if (duration < 100) latency.buckets['<100ms']++;
    else if (duration < 500) latency.buckets['<500ms']++;
    else if (duration < 1000) latency.buckets['<1s']++;
    else if (duration < 5000) latency.buckets['<5s']++;
    else latency.buckets['>5s']++;
    
    // Manter últimas 100 latências para cálculo de percentis
    if (latency.percentiles.length >= 100) {
      latency.percentiles.shift();
    }
    latency.percentiles.push(duration);
  }

  /**
   * Registra métrica de componente
   * @param {string} component - Nome do componente
   * @param {string} operation - Operação executada
   * @param {number} duration - Duração em ms
   * @param {boolean} success - Se foi sucesso
   */
  recordComponentMetric(component, operation, duration, success) {
    const key = `${component}:${operation}`;
    const now = Date.now();
    
    if (!this.metrics.components[key]) {
      this.metrics.components[key] = {
        count: 0,
        successCount: 0,
        failureCount: 0,
        totalDuration: 0,
        avgDuration: 0,
        lastExecution: null
      };
    }
    
    const metric = this.metrics.components[key];
    metric.count++;
    if (success) {
      metric.successCount++;
    } else {
      metric.failureCount++;
    }
    metric.totalDuration += duration;
    metric.avgDuration = metric.totalDuration / metric.count;
    metric.lastExecution = now;
  }

  /**
   * Registra métrica customizada
   * @param {string} name - Nome da métrica
   * @param {number} value - Valor
   * @param {object} labels - Labels adicionais
   */
  recordCustomMetric(name, value, labels = {}) {
    const key = `${name}:${JSON.stringify(labels)}`;
    
    if (!this.metrics.custom[key]) {
      this.metrics.custom[key] = {
        name,
        labels,
        values: [],
        current: null,
        min: Infinity,
        max: -Infinity,
        avg: 0
      };
    }
    
    const metric = this.metrics.custom[key];
    metric.current = value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    
    // Manter últimos 100 valores
    if (metric.values.length >= 100) {
      metric.values.shift();
    }
    metric.values.push({ value, timestamp: Date.now() });
    
    // Calcular média
    metric.avg = metric.values.reduce((sum, v) => sum + v.value, 0) / metric.values.length;
  }

  /**
   * Adiciona entrada ao histórico
   */
  addToHistory(entry) {
    this.history.push(entry);
    
    // Limitar tamanho do histórico
    if (this.history.length > this.historySize) {
      this.history = this.history.slice(-this.historySize);
    }
    
    // Remover entradas antigas
    const cutoff = Date.now() - this.retentionMs;
    this.history = this.history.filter(e => e.timestamp > cutoff);
  }

  /**
   * Coleta métricas do sistema
   */
  collectSystemMetrics() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    return {
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercent: Math.round((usedMemory / totalMemory) * 100)
      },
      process: {
        memory: process.memoryUsage(),
        pid: process.pid,
        uptime: process.uptime()
      },
      cpu: {
        count: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        loadAvg: os.loadavg()
      },
      os: {
        platform: os.platform(),
        release: os.release(),
        hostname: os.hostname()
      }
    };
  }

  /**
   * Inicia coleta periódica de métricas do sistema
   */
  startSystemMetricsCollection() {
    // Coletar a cada 30 segundos
    this.systemMetricsInterval = setInterval(() => {
      const systemMetrics = this.collectSystemMetrics();
      this.recordCustomMetric('system.memory.usage', systemMetrics.memory.usagePercent, { type: 'percent' });
      this.recordCustomMetric('system.process.heapUsed', systemMetrics.process.memory.heapUsed, { type: 'bytes' });
    }, 30000);
    
    // Não bloquear o processo
    this.systemMetricsInterval.unref();
  }

  /**
   * Para coleta de métricas
   */
  stop() {
    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval);
    }
  }

  /**
   * Calcula percentil
   * @param {number[]} values - Array de valores ordenados
   * @param {number} percentile - Percentil (0-100)
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Exporta métricas em formato Prometheus
   * @returns {string} Métricas em formato Prometheus
   */
  getPrometheusFormat() {
    let output = '';
    const now = Date.now();
    
    // Métricas de requests
    output += '# HELP http_requests_total Total de requisições HTTP\n';
    output += '# TYPE http_requests_total counter\n';
    for (const [key, value] of Object.entries(this.metrics.requests)) {
      const [method, endpoint] = key.split(' ');
      output += `http_requests_total{method="${method}",endpoint="${endpoint}"} ${value.count}\n`;
    }
    
    // Métricas de duração
    output += '\n# HELP http_request_duration_ms Duração das requisições em ms\n';
    output += '# TYPE http_request_duration_ms gauge\n';
    for (const [key, value] of Object.entries(this.metrics.requests)) {
      const [method, endpoint] = key.split(' ');
      output += `http_request_duration_ms_avg{method="${method}",endpoint="${endpoint}"} ${value.avgDuration.toFixed(2)}\n`;
      output += `http_request_duration_ms_min{method="${method}",endpoint="${endpoint}"} ${value.minDuration === Infinity ? 0 : value.minDuration}\n`;
      output += `http_request_duration_ms_max{method="${method}",endpoint="${endpoint}"} ${value.maxDuration}\n`;
    }
    
    // Métricas de erros
    output += '\n# HELP http_errors_total Total de erros HTTP\n';
    output += '# TYPE http_errors_total counter\n';
    for (const [key, value] of Object.entries(this.metrics.errors)) {
      const [endpoint, errorType] = key.split(':');
      output += `http_errors_total{endpoint="${endpoint}",type="${errorType}"} ${value.count}\n`;
    }
    
    // Métricas de componentes
    output += '\n# HELP component_operations_total Total de operações de componentes\n';
    output += '# TYPE component_operations_total counter\n';
    for (const [key, value] of Object.entries(this.metrics.components)) {
      const [component, operation] = key.split(':');
      output += `component_operations_total{component="${component}",operation="${operation}",status="success"} ${value.successCount}\n`;
      output += `component_operations_total{component="${component}",operation="${operation}",status="failure"} ${value.failureCount}\n`;
    }
    
    // Métricas do sistema
    const system = this.collectSystemMetrics();
    output += '\n# HELP system_memory_usage_percent Uso de memória do sistema em porcentagem\n';
    output += '# TYPE system_memory_usage_percent gauge\n';
    output += `system_memory_usage_percent ${system.memory.usagePercent}\n`;
    
    output += '\n# HELP process_memory_heap_bytes Memória heap do processo em bytes\n';
    output += '# TYPE process_memory_heap_bytes gauge\n';
    output += `process_memory_heap_bytes ${system.process.memory.heapUsed}\n`;
    
    output += '\n# HELP process_uptime_seconds Uptime do processo em segundos\n';
    output += '# TYPE process_uptime_seconds gauge\n';
    output += `process_uptime_seconds ${system.process.uptime.toFixed(0)}\n`;
    
    return output;
  }

  /**
   * Obtém estatísticas completas
   * @returns {object} Todas as métricas
   */
  getStats() {
    const system = this.collectSystemMetrics();
    
    return {
      counters: this.counters,
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      latency: this.metrics.latency,
      components: this.metrics.components,
      custom: this.metrics.custom,
      system,
      historySize: this.history.length
    };
  }

  /**
   * Obtém histórico de métricas
   * @param {object} filters - Filtros opcionais { type, endpoint, since }
   * @returns {Array} Histórico filtrado
   */
  getHistory(filters = {}) {
    let history = this.history;
    
    if (filters.type) {
      history = history.filter(e => e.type === filters.type);
    }
    
    if (filters.endpoint) {
      history = history.filter(e => e.endpoint === filters.endpoint);
    }
    
    if (filters.since) {
      history = history.filter(e => e.timestamp > filters.since);
    }
    
    return history;
  }

  /**
   * Reseta todas as métricas
   */
  reset() {
    this.metrics = {
      requests: {},
      errors: {},
      latency: {},
      components: {},
      custom: {}
    };
    this.history = [];
    this.counters = {
      totalRequests: 0,
      totalErrors: 0,
      startTime: Date.now()
    };
  }
}

// Singleton instance with initialization lock
let instance = null;
let initializationPromise = null;

/**
 * Obtém instância singleton do MetricsCollector
 */
export function getMetricsCollector(config = null, logger = null) {
  if (instance) {
    return instance;
  }

  if (!initializationPromise) {
    instance = new MetricsCollector(config, logger);
  }
  
  return instance;
}

/**
 * Cria nova instância do MetricsCollector
 */
export function createMetricsCollector(config = null, logger = null) {
  return new MetricsCollector(config, logger);
}

export default MetricsCollector;
