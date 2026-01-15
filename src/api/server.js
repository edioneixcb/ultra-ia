/**
 * API REST do Sistema Ultra
 * 
 * Endpoints:
 * - POST /api/generate - Gerar código
 * - GET /api/health - Status do sistema
 * - GET /api/stats - Estatísticas do sistema
 * - GET /api/models - Modelos disponíveis
 * - POST /api/index - Indexar codebase
 * - GET /api/history/:sessionId - Histórico de sessão
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { getUltraSystem } from '../systems/UltraSystem.js';
import { loadConfig } from '../utils/ConfigLoader.js';
import { getLogger } from '../utils/Logger.js';
import { getAsyncErrorHandler } from '../utils/AsyncErrorHandler.js';
import { authenticateApiKey } from './middleware/auth.js';
import v1Routes from './v1/routes.js';
import CorrelationId from '../utils/CorrelationId.js';
import { getMetricsCollector } from '../utils/MetricsCollector.js';
import { 
  generateRequestSchema, 
  indexRequestSchema, 
  historyParamsSchema,
  validateAndSanitize,
  validate
} from './validators/requestValidators.js';

const config = loadConfig().get();
const logger = getLogger(config);
const metricsCollector = getMetricsCollector(config, logger);

// Registrar handlers de erro assíncrono
const asyncErrorHandler = getAsyncErrorHandler(config, logger);
asyncErrorHandler.register();

const ultraSystem = getUltraSystem(config, logger);

const app = express();
const PORT = config.port || 3000;

// Configurar rate limiting
const rateLimitConfig = config.api?.rateLimit || {};
const generalLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs || 60000, // 1 minuto
  max: rateLimitConfig.max || 100, // máximo 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter específico para geração (mais restritivo)
const generateLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs || 60000,
  max: rateLimitConfig.perSession || 10, // máximo 10 por sessão
  keyGenerator: (req) => {
    // Usar sessionId se disponível, senão IP
    return req.body?.sessionId || req.ip;
  },
  message: 'Limite de gerações atingido para esta sessão, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(CorrelationId.middleware());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('src/public'));

// Middleware de métricas
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metricsCollector.recordRequest(req.path, req.method, duration, res.statusCode);
  });
  next();
});

// Aplicar rate limiting geral
app.use('/api/', generalLimiter);

// Aplicar autenticação (se habilitada)
app.use('/api/', authenticateApiKey);

// Rotas versionadas
app.use('/api/v1', v1Routes);

// Middleware de logging
app.use((req, res, next) => {
  logger?.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  logger?.error('Erro na API', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: err.message
  });
});

/**
 * POST /api/generate
 * Gera código baseado em prompt
 */
app.post('/api/generate', generateLimiter, async (req, res) => {
  try {
    // Validar e sanitizar entrada
    const validation = validateAndSanitize(generateRequestSchema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: validation.errors
      });
    }

    const {
      prompt,
      sessionId,
      projectId,
      language,
      expectedOutput,
      maxIterations,
      enableRefinement
    } = validation.data;

    const result = await ultraSystem.process(prompt, {
      sessionId,
      projectId,
      language,
      expectedOutput,
      maxIterations,
      enableRefinement
    });

    res.json({
      success: result.success,
      requestId: result.requestId,
      result: result.result ? {
        code: result.result.code,
        language: result.result.language,
        validation: {
          valid: result.result.validation.valid,
          score: result.result.validation.score
        },
        execution: {
          success: result.result.execution.success,
          stdout: result.result.execution.stdout,
          matchesExpected: result.result.execution.matchesExpected
        }
      } : null,
      iterations: result.iterations,
      duration: result.duration,
      error: result.error,
      requirements: result.requirements
    });

  } catch (error) {
    logger?.error('Erro ao gerar código', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar código',
      message: error.message
    });
  }
});

/**
 * GET /api/health
 * Status de saúde do sistema
 */
app.get('/api/health', async (req, res) => {
  try {
    const stats = ultraSystem.getStats();
    const configLoader = loadConfig();
    const configValidation = configLoader.validateRuntime();
    
    // Verificar saúde do Ollama
    const generator = ultraSystem.generator;
    let ollamaHealth = { available: false };
    if (generator && typeof generator.checkOllamaHealth === 'function') {
      ollamaHealth = await generator.checkOllamaHealth();
    }
    
    // Determinar status geral
    let status = 'healthy';
    if (!configValidation.valid || !ollamaHealth.available) {
      status = 'degraded';
    }
    if (stats.execution.total > 0 && stats.execution.successRate < 50) {
      status = 'degraded';
    }
    
    res.json({
      status,
      timestamp: new Date().toISOString(),
      config: {
        valid: configValidation.valid,
        errors: configValidation.errors,
        warnings: configValidation.warnings
      },
      ollama: ollamaHealth,
      components: {
        knowledgeBase: stats.knowledgeBase.functions > 0 || stats.knowledgeBase.classes > 0,
        context: stats.context.sessions >= 0,
        execution: stats.execution.total >= 0
      },
      stats: {
        knowledgeBase: {
          functions: stats.knowledgeBase.functions,
          classes: stats.knowledgeBase.classes,
          files: stats.knowledgeBase.files
        },
        execution: {
          total: stats.execution.total,
          successRate: stats.execution.successRate
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * GET /api/stats
 * Estatísticas detalhadas do sistema
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = ultraSystem.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/models
 * Lista modelos disponíveis
 */
app.get('/api/models', (req, res) => {
  try {
    const ollamaUrl = config.services?.ollama?.url || 'http://localhost:11434';
    const primaryModel = config.services?.ollama?.defaultModel || config.models?.primary || 'deepseek-coder:6.7b';
    const secondaryModel = config.models?.secondary || 'llama3.1:8b';

    res.json({
      success: true,
      ollamaUrl,
      models: {
        primary: primaryModel,
        secondary: secondaryModel
      },
      note: 'Modelos configurados no sistema. Verifique Ollama para modelos instalados.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/index
 * Indexa codebase para knowledge base
 */
app.post('/api/index', async (req, res) => {
  try {
    // Validar entrada
    const validation = validateAndSanitize(indexRequestSchema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: validation.errors
      });
    }

    const { codebasePath } = validation.data;

    const stats = await ultraSystem.indexCodebase(codebasePath);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger?.error('Erro ao indexar codebase', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro ao indexar codebase',
      message: error.message
    });
  }
});

/**
 * GET /api/history/:sessionId
 * Obtém histórico de uma sessão
 */
app.get('/api/history/:sessionId', (req, res) => {
  try {
    // Validar parâmetros
    const validation = validate(historyParamsSchema, req.params);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: validation.errors
      });
    }

    const { sessionId } = validation.data;
    const executionSystem = ultraSystem.executionSystem;
    const history = executionSystem.getHistory(sessionId);
    const stats = executionSystem.getStats(sessionId);

    res.json({
      success: true,
      sessionId,
      history,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/metrics
 * Métricas em formato Prometheus
 */
app.get('/api/metrics', (req, res) => {
  try {
    res.set('Content-Type', 'text/plain');
    res.send(metricsCollector.getPrometheusFormat());
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /
 * Serve interface web
 */
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'src/public' });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  logger?.info(`🚀 API REST do Sistema Ultra rodando na porta ${PORT}`);
  logger?.info(`📡 Endpoints disponíveis:`);
  logger?.info(`   POST /api/generate - Gerar código`);
  logger?.info(`   GET  /api/health - Status do sistema`);
  logger?.info(`   GET  /api/stats - Estatísticas`);
  logger?.info(`   GET  /api/models - Modelos disponíveis`);
  logger?.info(`   POST /api/index - Indexar codebase`);
  logger?.info(`   GET  /api/history/:sessionId - Histórico`);
  logger?.info(`🌐 Interface web: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger?.info('Encerrando servidor...');
  server.close(() => {
    logger?.info('Servidor encerrado');
    process.exit(0);
  });
});

export default app;
