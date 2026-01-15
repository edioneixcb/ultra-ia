/**
 * Agent Orchestrator (O Maestro)
 * 
 * Coordena a execução dos 8 agentes especializados.
 * Gerencia ciclo de vida, paralelismo, timeouts e agregação de resultados.
 * Implementa padrão "Short-Circuit" para abortar cedo em caso de falhas críticas.
 */

import { getLogger } from '../utils/Logger.js';
import ConsensusSystem from './ConsensusSystem.js';
// Imports dos agentes serão feitos dinamicamente ou injetados para evitar ciclos

class AgentOrchestrator {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.consensusSystem = new ConsensusSystem(config, this.logger);
    
    // Registro de agentes instanciados
    this.agents = new Map();
    
    // Configurações de execução
    this.maxConcurrent = config?.multiAgent?.maxConcurrent || 4;
    this.timeout = config?.multiAgent?.timeout || 60000;
  }

  /**
   * Registra um agente no orquestrador
   * @param {string} name - Nome do agente
   * @param {Object} instance - Instância do agente (deve estender AgentBase)
   */
  registerAgent(name, instance) {
    if (this.agents.has(name)) {
      this.logger?.warn(`Agente ${name} já registrado. Substituindo.`);
    }
    this.agents.set(name, instance);
  }

  /**
   * Executa o fluxo completo do comitê de agentes
   * @param {Object} context - Contexto inicial (prompt, requisitos)
   * @returns {Promise<Object>} Resultado consolidado com veredicto
   */
  async runCommittee(context) {
    this.logger?.info('Iniciando comitê de agentes', { requestId: context.requestId });
    const results = {};
    const errors = [];

    try {
      // FASE 1: ARQUITETURA (Sequencial)
      // O Arquiteto define a estrutura antes de codar
      const architectResult = await this.runAgent('ArchitectAgent', context);
      results['ArchitectAgent'] = architectResult;

      if (!architectResult.approved) {
        return this.buildFinalResult(results, false, 'Rejeitado pelo Arquiteto');
      }

      // Enriquecer contexto com arquitetura
      const enrichedContext = { ...context, architecture: architectResult.data };

      // FASE 2: IMPLEMENTAÇÃO (Sequencial)
      // O Coder implementa baseado na arquitetura
      const coderResult = await this.runAgent('CoderAgent', enrichedContext);
      results['CoderAgent'] = coderResult;

      if (!coderResult.approved) {
        return this.buildFinalResult(results, false, 'Falha na implementação do Coder');
      }

      // Contexto final para validação (contém o código gerado)
      const validationContext = { ...enrichedContext, code: coderResult.data.code, language: coderResult.data.language };

      // FASE 3: VALIDAÇÃO PARALELA (Reviewer, Security, Performance, UX)
      const validationAgents = ['ReviewerAgent', 'SecurityAgent', 'PerformanceAgent', 'UXAgent'];
      const validationResults = await this.runParallel(validationAgents, validationContext);
      Object.assign(results, validationResults);

      // SHORT-CIRCUIT: Se Security vetar, parar tudo
      if (results['SecurityAgent'] && !results['SecurityAgent'].approved) {
        return this.buildFinalResult(results, false, 'VETO de Segurança (Short-Circuit)', true);
      }

      // FASE 4: VALIDAÇÃO ATIVA (Tester, Adversary) - Mais custosa, roda por último
      const activeAgents = ['TesterAgent', 'AdversaryAgent'];
      const activeResults = await this.runParallel(activeAgents, validationContext);
      Object.assign(results, activeResults);

      // FASE 5: CONSENSO FINAL
      const verdict = this.consensusSystem.evaluate(results);
      
      return {
        success: verdict.approved,
        score: verdict.score,
        verdict,
        agentResults: results,
        finalCode: coderResult.data.code,
        architecture: architectResult.data
      };

    } catch (error) {
      this.logger?.error('Erro fatal no orquestrador', { error: error.message });
      return {
        success: false,
        error: error.message,
        agentResults: results
      };
    }
  }

  /**
   * Executa um único agente com timeout e tratamento de erro
   */
  async runAgent(agentName, context) {
    const agent = this.agents.get(agentName);
    if (!agent) {
      this.logger?.warn(`Agente ${agentName} não registrado. Pulando.`);
      return { approved: true, reason: 'Agente não encontrado (skip)', score: 0.5 };
    }

    try {
      // Race entre execução do agente e timeout
      const result = await Promise.race([
        agent.analyze(context),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout ${agentName}`)), this.timeout))
      ]);
      
      return result;
    } catch (error) {
      this.logger?.error(`Erro no agente ${agentName}`, { error: error.message });
      return { approved: false, reason: `Erro técnico: ${error.message}`, score: 0 };
    }
  }

  /**
   * Executa lista de agentes em paralelo (com limite de concorrência se necessário)
   */
  async runParallel(agentNames, context) {
    const results = {};
    // Simples Promise.all por enquanto (pode ser melhorado com p-limit)
    const promises = agentNames.map(async (name) => {
      const result = await this.runAgent(name, context);
      results[name] = result;
    });

    await Promise.all(promises);
    return results;
  }

  buildFinalResult(results, success, reason, vetoed = false) {
    return {
      success,
      verdict: { approved: success, reasons: [reason], vetoed },
      agentResults: results
    };
  }
}

export default AgentOrchestrator;
