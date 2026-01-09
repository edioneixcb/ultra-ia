/**
 * Sistema Ultra - Orquestrador Principal
 * 
 * Integra todos os componentes do sistema para processar requisições completas:
 * 
 * Fluxo:
 * 1. Análise de Requisitos (RequirementAnalyzer)
 * 2. Busca de Contexto (KnowledgeBase + ContextManager)
 * 3. Geração de Código (HallucinationPreventionGenerator)
 * 4. Validação Multi-Camadas (MultiLayerValidator)
 * 5. Execução e Feedback (ExecutionFeedbackSystem)
 * 6. Refinamento Iterativo (se necessário)
 * 7. Aprendizado (KnowledgeBase)
 * 
 * Funcionalidades:
 * - Processamento end-to-end de requisições
 * - Refinamento iterativo automático
 * - Manutenção de contexto persistente
 * - Aprendizado contínuo
 * - Tratamento robusto de erros
 */

import { getConfigLoader } from '../utils/ConfigLoader.js';
import { getLogger } from '../utils/Logger.js';
import { getErrorHandler } from '../utils/ErrorHandler.js';
import { getRequirementAnalyzer } from '../components/RequirementAnalyzer.js';
import { getKnowledgeBase } from '../components/DynamicKnowledgeBase.js';
import { getContextManager } from '../components/PersistentContextManager.js';
import { getGenerator } from '../components/HallucinationPreventionGenerator.js';
import { getValidator } from '../components/MultiLayerValidator.js';
import { getExecutionFeedbackSystem } from './ExecutionFeedbackSystem.js';

class UltraSystem {
  constructor(config = null, logger = null, errorHandler = null) {
    // Carregar config se não fornecido
    if (!config) {
      const configLoader = getConfigLoader();
      if (configLoader.config) {
        config = configLoader.get();
      } else {
        configLoader.load();
        config = configLoader.get();
      }
    }

    // Criar logger se não fornecido
    if (!logger) {
      logger = getLogger(config);
    }

    // Criar error handler se não fornecido
    if (!errorHandler) {
      errorHandler = getErrorHandler(config, logger);
    }

    this.config = config;
    this.logger = logger;
    this.errorHandler = errorHandler;

    // Inicializar todos os componentes
    this.requirementAnalyzer = getRequirementAnalyzer(config, logger);
    this.knowledgeBase = getKnowledgeBase(config, logger);
    this.contextManager = getContextManager(config, logger);
    this.generator = getGenerator(config, logger, errorHandler, this.knowledgeBase);
    this.validator = getValidator(config, logger, errorHandler);
    this.executionSystem = getExecutionFeedbackSystem(config, logger, errorHandler);

    // Configurações
    this.maxIterations = config.validation?.maxIterations || 10;
    this.enableRefinement = config.system?.enableRefinement !== false;
    this.enableLearning = config.system?.enableLearning !== false;
  }

  /**
   * Processa requisição completa end-to-end
   * @param {string} prompt - Prompt do usuário
   * @param {object} options - Opções de processamento
   * @returns {Promise<object>} Resultado completo
   */
  async process(prompt, options = {}) {
    const {
      sessionId = 'default',
      projectId = null,
      language = 'javascript',
      expectedOutput = null,
      maxIterations = this.maxIterations,
      enableRefinement = this.enableRefinement
    } = options;

    const requestId = `${sessionId}-${Date.now()}`;
    const startTime = Date.now();

    this.logger?.info('Iniciando processamento de requisição', {
      requestId,
      sessionId,
      prompt: prompt.substring(0, 100) + '...'
    });

    try {
      // 1. Análise de Requisitos
      const requirements = await this.analyzeRequirements(prompt, sessionId);

      // 2. Buscar Contexto Persistente
      const context = await this.getContext(sessionId, projectId, prompt);

      // 3. Loop de Geração e Refinamento
      let iteration = 0;
      let bestResult = null;
      let lastError = null;

      while (iteration < maxIterations) {
        iteration++;

        this.logger?.info(`Iteração ${iteration}/${maxIterations}`, { requestId });

        try {
          // 3.1. Gerar Código
          const generated = await this.generateCode(prompt, {
            language,
            requirements,
            context,
            previousError: lastError
          });

          // 3.2. Validar Código
          const validation = await this.validateCode(generated.code, {
            language,
            requirements
          });

          // 3.3. Se validação passou, executar
          if (validation.valid && validation.score >= 70) {
            const execution = await this.executeCode(generated.code, {
              language,
              sessionId,
              expectedOutput
            });

            // Se execução foi bem-sucedida, temos resultado válido
            if (execution.success) {
              bestResult = {
                code: generated.code,
                language,
                validation,
                execution,
                iteration,
                metadata: {
                  requestId,
                  sessionId,
                  projectId,
                  requirements,
                  contextUsed: context.length
                }
              };

              // Se output corresponde ao esperado, parar
              if (expectedOutput === null || execution.matchesExpected) {
                break;
              }
            } else {
              // Execução falhou, coletar erro para refinamento
              lastError = {
                type: 'execution',
                message: execution.stderr || 'Execução falhou',
                suggestions: execution.suggestions || []
              };
            }
          } else {
            // Validação falhou, coletar erros para refinamento
            lastError = {
              type: 'validation',
              message: 'Validação falhou',
              errors: validation.errors,
              warnings: validation.warnings,
              suggestions: validation.suggestions
            };
          }

          // Se não habilitado refinamento e houve erro, parar
          if (!enableRefinement && lastError) {
            break;
          }

        } catch (error) {
          this.errorHandler?.handleError(error, {
            component: 'UltraSystem',
            operation: 'process',
            requestId,
            iteration
          });

          lastError = {
            type: 'exception',
            message: error.message
          };

          if (!enableRefinement) {
            break;
          }
        }
      }

      // 4. Preparar resultado final
      const result = {
        success: bestResult !== null,
        requestId,
        sessionId,
        projectId,
        duration: Date.now() - startTime,
        iterations: iteration,
        result: bestResult,
        requirements,
        error: lastError && !bestResult ? lastError : null
      };

      // 5. Aprender do resultado
      if (this.enableLearning && bestResult) {
        await this.learnFromResult(prompt, bestResult.code, {
          accepted: true,
          language,
          sessionId
        });
      } else if (this.enableLearning && lastError) {
        await this.learnFromResult(prompt, null, {
          accepted: false,
          error: lastError,
          language,
          sessionId
        });
      }

      // 6. Salvar no contexto
      await this.saveToContext(sessionId, projectId, {
        prompt,
        result: bestResult,
        requirements
      });

      this.logger?.info('Processamento concluído', {
        requestId,
        success: result.success,
        iterations: result.iterations,
        duration: result.duration
      });

      return result;

    } catch (error) {
      this.errorHandler?.handleError(error, {
        component: 'UltraSystem',
        operation: 'process',
        requestId
      }, true);

      return {
        success: false,
        requestId,
        sessionId,
        projectId,
        duration: Date.now() - startTime,
        error: {
          type: 'system',
          message: error.message
        }
      };
    }
  }

  /**
   * Analisa requisitos do prompt
   * @param {string} prompt - Prompt do usuário
   * @param {string} sessionId - ID da sessão
   * @returns {Promise<object>} Análise de requisitos
   */
  async analyzeRequirements(prompt, sessionId) {
    try {
      const analysis = this.requirementAnalyzer.analyze(prompt, {
        sessionId
      });

      if (!analysis.valid && analysis.errors.length > 0) {
        this.logger?.warn('Problemas detectados nos requisitos', {
          sessionId,
          errors: analysis.errors.length,
          warnings: analysis.warnings.length
        });
      }

      return analysis;
    } catch (error) {
      this.logger?.warn('Erro na análise de requisitos', { error: error.message });
      return {
        valid: true,
        completeness: 0.5,
        errors: [],
        warnings: []
      };
    }
  }

  /**
   * Busca contexto relevante
   * @param {string} sessionId - ID da sessão
   * @param {string} projectId - ID do projeto
   * @param {string} prompt - Prompt atual
   * @returns {Promise<Array<object>>} Contexto formatado
   */
  async getContext(sessionId, projectId, prompt) {
    try {
      // Buscar contexto persistente (agora é async)
      const persistentContext = await this.contextManager.getFormattedContext(sessionId, 5000);

      // Buscar contexto relevante na knowledge base
      const kbContext = await this.knowledgeBase.search(prompt, 5);

      return {
        persistent: persistentContext,
        knowledgeBase: kbContext
      };
    } catch (error) {
      this.logger?.warn('Erro ao buscar contexto', { error: error.message });
      return {
        persistent: [],
        knowledgeBase: []
      };
    }
  }

  /**
   * Gera código usando gerador
   * @param {string} prompt - Prompt do usuário
   * @param {object} options - Opções
   * @returns {Promise<object>} Código gerado
   */
  async generateCode(prompt, options = {}) {
    const {
      language,
      requirements,
      context,
      previousError = null
    } = options;

    // Construir prompt enriquecido
    let enrichedPrompt = prompt;

    // Adicionar informações de erro anterior se houver
    if (previousError) {
      enrichedPrompt += `\n\nErro anterior: ${previousError.message}`;
      if (previousError.suggestions && previousError.suggestions.length > 0) {
        enrichedPrompt += `\nSugestões: ${previousError.suggestions.join(', ')}`;
      }
      enrichedPrompt += '\nPor favor, corrija o código considerando o erro acima.';
    }

    // Adicionar requisitos se houver problemas
    if (requirements && !requirements.valid) {
      enrichedPrompt += `\n\nNota: ${requirements.errors.join('; ')}`;
    }

    return await this.generator.generate(enrichedPrompt, {
      language,
      useRAG: true,
      useMultiModel: false, // Desabilitar por padrão para performance
      context: context
    });
  }

  /**
   * Valida código gerado
   * @param {string} code - Código a validar
   * @param {object} options - Opções
   * @returns {Promise<object>} Resultado da validação
   */
  async validateCode(code, options = {}) {
    const { language, requirements } = options;

    return await this.validator.validate(code, {
      language,
      layers: ['syntax', 'structure', 'security', 'bestPractices']
    });
  }

  /**
   * Executa código gerado
   * @param {string} code - Código a executar
   * @param {object} options - Opções
   * @returns {Promise<object>} Resultado da execução
   */
  async executeCode(code, options = {}) {
    const {
      language,
      sessionId,
      expectedOutput = null
    } = options;

    return await this.executionSystem.execute(code, {
      language,
      sessionId,
      expectedOutput
    });
  }

  /**
   * Aprende do resultado (adiciona à knowledge base)
   * @param {string} prompt - Prompt original
   * @param {string} code - Código gerado (ou null se falhou)
   * @param {object} feedback - Feedback
   * @returns {Promise<void>}
   */
  async learnFromResult(prompt, code, feedback) {
    try {
      if (code) {
        await this.knowledgeBase.learnFromUsage(prompt, code, {
          accepted: feedback.accepted,
          rejected: !feedback.accepted
        });
      }
    } catch (error) {
      this.logger?.warn('Erro ao aprender do resultado', { error: error.message });
    }
  }

  /**
   * Salva interação no contexto persistente
   * @param {string} sessionId - ID da sessão
   * @param {string} projectId - ID do projeto
   * @param {object} interaction - Interação
   * @returns {Promise<void>}
   */
  async saveToContext(sessionId, projectId, interaction) {
    try {
      // Criar/recuperar sessão
      this.contextManager.getOrCreateSession(sessionId, projectId);

      // Adicionar prompt
      this.contextManager.addMessage(sessionId, 'user', interaction.prompt, 7);

      // Adicionar resultado se houver
      if (interaction.result) {
        const resultMessage = `Código gerado:\n\`\`\`${interaction.result.language}\n${interaction.result.code}\n\`\`\``;
        this.contextManager.addMessage(sessionId, 'assistant', resultMessage, 8);
      }
    } catch (error) {
      this.logger?.warn('Erro ao salvar no contexto', { error: error.message });
    }
  }

  /**
   * Obtém estatísticas do sistema
   * @returns {object} Estatísticas
   */
  getStats() {
    return {
      knowledgeBase: this.knowledgeBase.getStats(),
      execution: this.executionSystem.getStats(),
      context: {
        sessions: this.contextManager.db?.prepare('SELECT COUNT(*) as count FROM sessions').get()?.count || 0
      }
    };
  }

  /**
   * Indexa codebase para knowledge base
   * @param {string} codebasePath - Caminho do codebase
   * @returns {Promise<object>} Estatísticas da indexação
   */
  async indexCodebase(codebasePath) {
    return await this.knowledgeBase.indexCodebase(codebasePath);
  }

  /**
   * Limpa contexto antigo
   * @returns {object} Estatísticas da limpeza
   */
  cleanupOldContext() {
    return this.contextManager.cleanupOldContext();
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do UltraSystem
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @param {object} errorHandler - ErrorHandler (opcional)
 * @returns {UltraSystem} Instância
 */
export function getUltraSystem(config = null, logger = null, errorHandler = null) {
  if (!instance) {
    instance = new UltraSystem(config, logger, errorHandler);
  }
  return instance;
}

/**
 * Cria nova instância do UltraSystem
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @param {object} errorHandler - ErrorHandler
 * @returns {UltraSystem} Nova instância
 */
export function createUltraSystem(config = null, logger = null, errorHandler = null) {
  return new UltraSystem(config, logger, errorHandler);
}

export default UltraSystem;
