/**
 * API v1 Routes
 * 
 * Endpoints versionados da API v1
 */

import express from 'express';
import { getUltraSystem } from '../../systems/UltraSystem.js';
import { loadConfig } from '../../utils/ConfigLoader.js';
import { getLogger } from '../../utils/Logger.js';
import { 
  generateRequestSchema, 
  indexRequestSchema, 
  historyParamsSchema,
  validateAndSanitize,
  validate
} from '../validators/requestValidators.js';

const router = express.Router();
const config = loadConfig().get();
const logger = getLogger(config);
const ultraSystem = getUltraSystem(config, logger);

// POST /api/v1/generate
router.post('/generate', async (req, res) => {
  try {
    const validation = validateAndSanitize(generateRequestSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: 'Erro de validação', details: validation.errors });
    }
    const result = await ultraSystem.process(validation.data.prompt, validation.data);
    res.json({ success: result.success, ...result });
  } catch (error) {
    logger?.error('Erro ao gerar código', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/health
router.get('/health', (req, res) => {
  try {
    const stats = ultraSystem.getStats();
    const configLoader = loadConfig();
    const configValidation = configLoader.validateRuntime();
    res.json({ status: configValidation.valid ? 'healthy' : 'degraded', stats, config: configValidation });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// GET /api/v1/stats
router.get('/stats', (req, res) => {
  try {
    res.json({ success: true, stats: ultraSystem.getStats() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
