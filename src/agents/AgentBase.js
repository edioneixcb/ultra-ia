/**
 * Agent Base Class
 * 
 * Classe base abstrata para todos os agentes do sistema Multi-Agente.
 * Define o contrato padrão de comunicação, ciclo de vida e validação de saída.
 * 
 * Funcionalidades:
 * - Ciclo de vida: initialize -> analyze -> process -> shutdown
 * - Validação de schema de saída (garante JSON válido)
 * - Gestão de estado e memória de curto prazo
 * - Interface padrão para o Orquestrador
 */

import { getLogger } from '../utils/Logger.js';

class AgentBase {
  constructor(config = null, logger = null) {
    if (this.constructor === AgentBase) {
      throw new Error("AgentBase é uma classe abstrata e não pode ser instanciada diretamente.");
    }
    
    this.config = config;
    this.logger = logger || getLogger(config);
    this.name = this.constructor.name;
    this.state = 'idle'; // idle, working, error
    this.memory = new Map();
  }

  /**
   * Inicializa o agente
   */
  async initialize() {
    this.logger?.info(`Inicializando agente ${this.name}`);
    this.state = 'idle';
    await this.onInitialize();
  }

  /**
   * Hook para inicialização específica (sobrescrever)
   */
  async onInitialize() {}

  /**
   * Ponto de entrada principal para análise
   * @param {object} context - Contexto da tarefa (código, prompt, requisitos)
   * @returns {Promise<object>} Resultado estruturado
   */
  async analyze(context) {
    if (this.state === 'working') {
      throw new Error(`Agente ${this.name} já está ocupado.`);
    }

    try {
      this.state = 'working';
      this.logger?.debug(`Agente ${this.name} iniciando análise`);
      
      const result = await this.process(context);
      
      // Validação de saída (garantir formato esperado)
      const validatedResult = this.validateOutput(result);
      
      this.state = 'idle';
      return validatedResult;

    } catch (error) {
      this.state = 'error';
      this.logger?.error(`Erro no agente ${this.name}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Lógica principal do agente (DEVE ser implementado)
   * @param {object} context 
   */
  async process(context) {
    throw new Error(`Método process() não implementado em ${this.name}`);
  }

  /**
   * Valida o formato da saída do agente
   * @param {object} output 
   * @returns {object} Output validado
   */
  validateOutput(output) {
    // Implementação padrão: verifica se é objeto e tem campos mínimos
    // Subclasses podem sobrescrever para validação Zod/Schema específica
    if (!output || typeof output !== 'object') {
      throw new Error(`Saída inválida do agente ${this.name}: deve ser um objeto.`);
    }
    return output;
  }

  /**
   * Encerra o agente
   */
  async shutdown() {
    this.logger?.info(`Encerrando agente ${this.name}`);
    this.memory.clear();
    await this.onShutdown();
  }

  /**
   * Hook para encerramento específico (sobrescrever)
   */
  async onShutdown() {}
}

export default AgentBase;
