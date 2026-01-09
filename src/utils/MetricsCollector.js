/**
 * Metrics Collector
 * 
 * Coleta métricas básicas do sistema:
 * - Requests por endpoint
 * - Latência
 * - Taxa de erros
 * - Métricas por componente
 */

import { getLogger } from './Logger.js';

class MetricsCollector {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger;
    this.metrics = {
      requests: {},
      errors: {},
      latency: {},
      components: {}
    };
  }

  recordRequest(endpoint, method, duration, statusCode) {
    const key = `${method} ${endpoint}`;
    if (!this.metrics.requests[key]) {
      this.metrics.requests[key] = { count: 0, totalDuration: 0 };
    }
    this.metrics.requests[key].count++;
    this.metrics.requests[key].totalDuration += duration;
  }

  recordError(endpoint, error) {
    const key = endpoint;
    if (!this.metrics.errors[key]) {
      this.metrics.errors[key] = 0;
    }
    this.metrics.errors[key]++;
  }

  getPrometheusFormat() {
    let output = '';
    for (const [key, value] of Object.entries(this.metrics.requests)) {
      output += `http_requests_total{endpoint="${key}"} ${value.count}\n`;
      output += `http_request_duration_ms{endpoint="${key}"} ${value.totalDuration / value.count}\n`;
    }
    for (const [key, value] of Object.entries(this.metrics.errors)) {
      output += `http_errors_total{endpoint="${key}"} ${value}\n`;
    }
    return output;
  }

  getStats() {
    return this.metrics;
  }
}

let instance = null;

export function getMetricsCollector(config = null, logger = null) {
  if (!instance) {
    instance = new MetricsCollector(config, logger);
  }
  return instance;
}

export default MetricsCollector;
