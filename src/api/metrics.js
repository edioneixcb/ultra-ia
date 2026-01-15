/**
 * Metrics API Routes
 * 
 * Endpoints para exposição de métricas do sistema:
 * - /api/metrics - Métricas em formato JSON
 * - /api/metrics/prometheus - Métricas em formato Prometheus
 * - /api/metrics/history - Histórico de métricas
 */

import express from 'express';
import { getMetricsCollector } from '../utils/MetricsCollector.js';
import { loadConfig } from '../utils/ConfigLoader.js';
import { getLogger } from '../utils/Logger.js';

const router = express.Router();

const config = loadConfig().get();
const logger = getLogger(config);
const metricsCollector = getMetricsCollector(config, logger);

/**
 * GET /api/metrics
 * Retorna todas as métricas em formato JSON
 */
router.get('/', (req, res) => {
  try {
    const stats = metricsCollector.getStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro ao obter métricas', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/metrics/prometheus
 * Retorna métricas em formato Prometheus
 */
router.get('/prometheus', (req, res) => {
  try {
    const prometheusMetrics = metricsCollector.getPrometheusFormat();
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(prometheusMetrics);
  } catch (error) {
    logger.error('Erro ao obter métricas Prometheus', { error: error.message });
    res.status(500).send(`# ERROR: ${error.message}`);
  }
});

/**
 * GET /api/metrics/history
 * Retorna histórico de métricas com filtros opcionais
 * Query params: type, endpoint, since (timestamp)
 */
router.get('/history', (req, res) => {
  try {
    const { type, endpoint, since } = req.query;
    
    const filters = {};
    if (type) filters.type = type;
    if (endpoint) filters.endpoint = endpoint;
    if (since) filters.since = parseInt(since, 10);
    
    const history = metricsCollector.getHistory(filters);
    
    res.json({
      success: true,
      data: history,
      count: history.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro ao obter histórico de métricas', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/metrics/system
 * Retorna métricas do sistema (CPU, memória, etc)
 */
router.get('/system', (req, res) => {
  try {
    const systemMetrics = metricsCollector.collectSystemMetrics();
    res.json({
      success: true,
      data: systemMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro ao obter métricas do sistema', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/metrics/reset
 * Reseta todas as métricas (apenas para admin)
 */
router.post('/reset', (req, res) => {
  try {
    metricsCollector.reset();
    logger.info('Métricas resetadas');
    res.json({
      success: true,
      message: 'Métricas resetadas com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro ao resetar métricas', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
