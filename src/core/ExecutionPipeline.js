/**
 * ExecutionPipeline - Sistema de Pipeline de Execução Ordenada
 * 
 * Executa sistemas em ordem correta respeitando dependências.
 * 
 * Funcionalidades:
 * - Resolução automática de ordem de execução baseada em dependências
 * - Execução ordenada de sistemas
 * - Validação de pré-condições antes de execução
 * - Tratamento robusto de erros durante execução
 * - Detecção de dependências circulares
 * 
 * Princípios Arquiteturais:
 * - Dependency Resolution: Resolve ordem automaticamente baseada em dependências
 * - Fail Fast: Valida dependências antes de executar
 * - Error Handling: Tratamento robusto de erros com contexto completo
 * - Single Responsibility: Responsável apenas por orquestração de execução
 * 
 * @module ExecutionPipeline
 */

/**
 * Estágio de execução
 * @typedef {Object} ExecutionStage
 * @property {string} name - Nome do estágio
 * @property {string[]} systems - Array de nomes de sistemas a executar
 * @property {string[]} dependencies - Array de nomes de estágios dos quais este depende
 * @property {boolean} completed - Se o estágio foi completado
 */

/**
 * ExecutionPipeline - Orquestrador de execução ordenada de sistemas
 */
class ExecutionPipeline {
  /**
   * Cria uma nova instância do ExecutionPipeline
   * 
   * @param {Object} registry - ComponentRegistry para obter instâncias de sistemas
   * @param {Object} [options={}] - Opções de configuração
   * @param {Object} [options.logger] - Logger para registro de eventos
   * @param {Object} [options.errorHandler] - Error handler para tratamento de erros
   */
  constructor(registry, options = {}) {
    if (!registry) {
      throw new Error('ComponentRegistry é obrigatório');
    }

    const { logger = null, errorHandler = null } = options;
    
    this.registry = registry;
    this.logger = logger;
    this.errorHandler = errorHandler;
    
    // Array de estágios de execução
    this.stages = [];
    
    this.logger?.info('ExecutionPipeline inicializado');
  }

  /**
   * Adiciona um estágio ao pipeline
   * 
   * @param {string} stageName - Nome único do estágio
   * @param {string[]} systemNames - Array de nomes de sistemas a executar neste estágio
   * @param {string[]} [dependencies=[]] - Array de nomes de estágios dos quais este depende
   * @throws {Error} Se estágio já existe
   * @throws {Error} Se sistemas não estão registrados no registry
   * 
   * @example
   * pipeline.addStage('init', ['ConfigLoader', 'Logger'], []);
   * pipeline.addStage('setup', ['Database', 'Cache'], ['init']);
   */
  addStage(stageName, systemNames, dependencies = []) {
    // Validação de entrada
    this.validateStageInput(stageName, systemNames, dependencies);

    // Verificar se estágio já existe
    if (this.stages.some(s => s.name === stageName)) {
      const error = new Error(`Estágio '${stageName}' já existe`);
      this.errorHandler?.handleError(error, {
        component: 'ExecutionPipeline',
        operation: 'addStage',
        stageName
      });
      throw error;
    }

    // Validar que sistemas estão registrados
    this.validateSystemsExist(systemNames);

    // Criar estágio
    const stage = {
      name: stageName,
      systems: systemNames,
      dependencies: dependencies || [],
      completed: false
    };

    this.stages.push(stage);

    this.logger?.info(`Estágio '${stageName}' adicionado`, {
      systems: systemNames.length,
      dependencies: dependencies.length
    });
  }

  /**
   * Executa todos os estágios na ordem correta
   * 
   * @param {Object} [context={}] - Contexto a passar para sistemas
   * @returns {Promise<Object>} Objeto com resultados de cada sistema: { systemName: result }
   * @throws {Error} Se há dependência circular
   * @throws {Error} Se pré-condições não são atendidas
   * @throws {Error} Se execução de sistema falha
   * 
   * @example
   * const results = await pipeline.execute({ sessionId: '123' });
   * // { ConfigLoader: {...}, Logger: {...}, Database: {...}, ... }
   */
  async execute(context = {}) {
    // Validar dependências antes de executar
    this.validateDependencies();

    // Calcular ordem de execução
    const executionOrder = this.calculateExecutionOrder();
    
    if (executionOrder.length === 0) {
      this.logger?.warn('Nenhum estágio para executar');
      return {};
    }

    this.logger?.info(`Iniciando execução de ${executionOrder.length} estágio(s)`);

    const results = {};

    // Executar cada estágio na ordem
    for (const stage of executionOrder) {
      try {
        await this.executeStage(stage, context, results);
      } catch (error) {
        this.errorHandler?.handleError(error, {
          component: 'ExecutionPipeline',
          operation: 'execute',
          stage: stage.name,
          completedStages: this.stages.filter(s => s.completed).map(s => s.name)
        });
        throw error;
      }
    }

    this.logger?.info('Execução de pipeline concluída', {
      stagesCompleted: this.stages.filter(s => s.completed).length,
      systemsExecuted: Object.keys(results).length
    });

    return results;
  }

  /**
   * Executa um estágio específico
   * 
   * @param {ExecutionStage} stage - Estágio a executar
   * @param {Object} context - Contexto de execução
   * @param {Object} results - Objeto de resultados (modificado in-place)
   * @returns {Promise<void>}
   * @private
   */
  async executeStage(stage, context, results) {
    this.logger?.info(`Executando estágio: ${stage.name}`, {
      systems: stage.systems,
      dependencies: stage.dependencies
    });

    // Validar pré-condições
    await this.validatePreconditions(stage);

    // Executar sistemas do estágio
    for (const systemName of stage.systems) {
      try {
        // Obter instância do sistema do registry
        const system = this.registry.get(systemName, context);

        // Verificar se sistema segue contrato BaseSystem
        if (typeof system.execute !== 'function') {
          throw new Error(
            `Sistema '${systemName}' não implementa método execute(). ` +
            'Sistemas devem estender BaseSystem ou implementar contrato compatível.'
          );
        }

        // Executar sistema
        const result = await system.execute(context);
        results[systemName] = result;

        this.logger?.debug(`Sistema '${systemName}' executado com sucesso`);

      } catch (error) {
        this.errorHandler?.handleError(error, {
          component: 'ExecutionPipeline',
          operation: 'executeStage',
          system: systemName,
          stage: stage.name
        });
        throw error;
      }
    }

    // Marcar estágio como completado
    stage.completed = true;
    this.logger?.info(`Estágio '${stage.name}' completado`);
  }

  /**
   * Calcula ordem de execução baseada em dependências (Topological Sort)
   * 
   * @returns {ExecutionStage[]} Array de estágios em ordem de execução
   * @throws {Error} Se há dependência circular
   */
  calculateExecutionOrder() {
    const ordered = [];
    const visited = new Set();
    const visiting = new Set();

    /**
     * Visita um estágio recursivamente (DFS)
     * @param {ExecutionStage} stage - Estágio a visitar
     */
    const visit = (stage) => {
      // Detectar dependência circular
      if (visiting.has(stage.name)) {
        const cycle = Array.from(visiting).concat(stage.name);
        const error = new Error(
          `Dependência circular detectada envolvendo '${stage.name}': ${cycle.join(' -> ')}`
        );
        this.errorHandler?.handleError(error, {
          component: 'ExecutionPipeline',
          operation: 'calculateExecutionOrder',
          cycle
        });
        throw error;
      }

      // Se já foi visitado, pular
      if (visited.has(stage.name)) {
        return;
      }

      // Marcar como visitando
      visiting.add(stage.name);

      // Visitar dependências primeiro
      for (const depName of stage.dependencies) {
        const depStage = this.stages.find(s => s.name === depName);
        if (!depStage) {
          const error = new Error(
            `Dependência '${depName}' do estágio '${stage.name}' não encontrada`
          );
          this.errorHandler?.handleError(error, {
            component: 'ExecutionPipeline',
            operation: 'calculateExecutionOrder',
            stage: stage.name,
            missingDependency: depName,
            availableStages: this.stages.map(s => s.name)
          });
          throw error;
        }
        visit(depStage);
      }

      // Marcar como visitado e adicionar à ordem
      visiting.delete(stage.name);
      visited.add(stage.name);
      ordered.push(stage);
    };

    // Visitar todos os estágios
    for (const stage of this.stages) {
      if (!visited.has(stage.name)) {
        visit(stage);
      }
    }

    return ordered;
  }

  /**
   * Valida que pré-condições (dependências) são atendidas
   * 
   * @param {ExecutionStage} stage - Estágio a validar
   * @returns {Promise<void>}
   * @throws {Error} Se pré-condições não são atendidas
   * @private
   */
  async validatePreconditions(stage) {
    for (const depName of stage.dependencies) {
      const depStage = this.stages.find(s => s.name === depName);
      
      if (!depStage) {
        const error = new Error(
          `Pré-condição não atendida: estágio '${depName}' não encontrado`
        );
        this.errorHandler?.handleError(error, {
          component: 'ExecutionPipeline',
          operation: 'validatePreconditions',
          stage: stage.name,
          missingDependency: depName
        });
        throw error;
      }

      if (!depStage.completed) {
        const error = new Error(
          `Pré-condição não atendida: estágio '${depName}' não foi completado`
        );
        this.errorHandler?.handleError(error, {
          component: 'ExecutionPipeline',
          operation: 'validatePreconditions',
          stage: stage.name,
          incompleteDependency: depName
        });
        throw error;
      }
    }
  }

  /**
   * Valida que todas as dependências de estágios existem
   * 
   * @throws {Error} Se alguma dependência não existe
   * @private
   */
  validateDependencies() {
    const stageNames = new Set(this.stages.map(s => s.name));
    
    for (const stage of this.stages) {
      for (const depName of stage.dependencies) {
        if (!stageNames.has(depName)) {
          const error = new Error(
            `Dependência '${depName}' do estágio '${stage.name}' não existe`
          );
          this.errorHandler?.handleError(error, {
            component: 'ExecutionPipeline',
            operation: 'validateDependencies',
            stage: stage.name,
            missingDependency: depName,
            availableStages: Array.from(stageNames)
          });
          throw error;
        }
      }
    }
  }

  /**
   * Valida entrada para addStage
   * 
   * @param {string} stageName - Nome do estágio
   * @param {string[]} systemNames - Nomes de sistemas
   * @param {string[]} dependencies - Dependências
   * @private
   */
  validateStageInput(stageName, systemNames, dependencies) {
    if (typeof stageName !== 'string' || stageName.trim() === '') {
      throw new Error('Nome do estágio deve ser uma string não vazia');
    }

    if (!Array.isArray(systemNames) || systemNames.length === 0) {
      throw new Error('systemNames deve ser um array não vazio de strings');
    }

    const invalidSystems = systemNames.filter(s => typeof s !== 'string' || s.trim() === '');
    if (invalidSystems.length > 0) {
      throw new Error(`Nomes de sistemas inválidos: ${invalidSystems.join(', ')}`);
    }

    if (!Array.isArray(dependencies)) {
      throw new Error('Dependências deve ser um array de strings');
    }

    const invalidDeps = dependencies.filter(d => typeof d !== 'string' || d.trim() === '');
    if (invalidDeps.length > 0) {
      throw new Error(`Dependências inválidas: ${invalidDeps.join(', ')}`);
    }
  }

  /**
   * Valida que sistemas estão registrados no registry
   * 
   * @param {string[]} systemNames - Nomes de sistemas
   * @private
   */
  validateSystemsExist(systemNames) {
    const missing = systemNames.filter(name => !this.registry.has(name));
    if (missing.length > 0) {
      const error = new Error(
        `Sistemas não registrados: ${missing.join(', ')}. ` +
        `Registre os sistemas no ComponentRegistry antes de adicionar ao pipeline.`
      );
      this.errorHandler?.handleError(error, {
        component: 'ExecutionPipeline',
        operation: 'validateSystemsExist',
        missingSystems: missing,
        availableSystems: this.registry.getAllRegistered()
      });
      throw error;
    }
  }

  /**
   * Reseta pipeline (marca todos os estágios como não completados)
   */
  reset() {
    this.stages.forEach(stage => {
      stage.completed = false;
    });
    this.logger?.info('Pipeline resetado');
  }

  /**
   * Retorna todos os estágios
   * 
   * @returns {ExecutionStage[]} Array de estágios
   */
  getStages() {
    return [...this.stages];
  }

  /**
   * Retorna estágio por nome
   * 
   * @param {string} stageName - Nome do estágio
   * @returns {ExecutionStage|undefined} Estágio ou undefined se não encontrado
   */
  getStage(stageName) {
    return this.stages.find(s => s.name === stageName);
  }
}

export default ExecutionPipeline;
