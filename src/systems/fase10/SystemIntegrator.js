/**
 * SystemIntegrator - Integrador Completo de Sistemas
 * 
 * Integra todos os sistemas do Ultra-IA de forma completa e coordenada.
 * 
 * Funcionalidades:
 * - Integração Completa (integrar todos os sistemas)
 * - Orquestração de Sistemas (orquestrar execução de sistemas)
 * - Gerenciamento de Dependências (gerenciar dependências entre sistemas)
 * - Validação de Integração (validar integração completa)
 * 
 * Métricas de Sucesso:
 * - 100% dos sistemas são integrados corretamente
 * - 100% das dependências são resolvidas
 * - 100% da integração é validada
 */

import BaseSystem from '../../core/BaseSystem.js';
import { getComponentRegistry } from '../../core/index.js';

class SystemIntegrator extends BaseSystem {
  async onInitialize() {
    this.integrations = new Map();
    this.systemGraph = new Map();
    this.logger?.info('SystemIntegrator inicializado');
  }

  /**
   * Integra sistemas ou executa integração
   * 
   * @param {Object} context - Contexto com action e parâmetros
   * @returns {Promise<Object>} Resultado da integração
   */
  async onExecute(context) {
    const { action, systems = [], integrationId, options = {} } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'integrate') {
      return await this.integrateAllSystems(systems, options, integrationId);
    } else if (action === 'getIntegration') {
      if (!integrationId) {
        throw new Error('integrationId é obrigatório para getIntegration');
      }
      return this.getIntegration(integrationId);
    } else if (action === 'validateIntegration') {
      return await this.validateIntegration(integrationId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Integra todos os sistemas
   * 
   * @param {Array<string>} systems - Sistemas a integrar (opcional, todos se vazio)
   * @param {Object} options - Opções
   * @param {string} integrationId - ID da integração (opcional)
   * @returns {Promise<Object>} Resultado da integração
   */
  async integrateAllSystems(systems = [], options = {}, integrationId = null) {
    const id = integrationId || `integration-${Date.now()}`;
    const registry = getComponentRegistry();

    // Obter todos os sistemas registrados se não especificados
    const systemsToIntegrate = systems.length > 0 
      ? systems 
      : this.getAllRegisteredSystems(registry);

    // Construir grafo de dependências
    const dependencyGraph = await this.buildDependencyGraph(systemsToIntegrate, registry);

    // Validar dependências
    const dependencyValidation = await this.validateDependencies(dependencyGraph);

    if (!dependencyValidation.valid && options.strict !== false) {
      return {
        id,
        integrated: false,
        error: 'Dependências inválidas',
        dependencyValidation
      };
    }

    // Orquestrar inicialização
    const initializationOrder = this.calculateInitializationOrder(dependencyGraph);
    const initializationResults = await this.initializeInOrder(initializationOrder, registry);

    // Validar integração
    const integrationValidation = await this.validateIntegrationComplete(systemsToIntegrate, registry);

    const result = {
      id,
      integrated: true,
      systems: systemsToIntegrate,
      dependencyGraph,
      initializationOrder,
      initializationResults,
      integrationValidation,
      integratedAt: new Date().toISOString()
    };

    this.integrations.set(id, result);

    return result;
  }

  /**
   * Obtém todos os sistemas registrados
   * 
   * @param {Object} registry - ComponentRegistry
   * @returns {Array<string>} Nomes dos sistemas
   */
  getAllRegisteredSystems(registry) {
    const allRegistered = registry.getAllRegistered();
    return Array.from(allRegistered.keys()).filter(name => 
      !['config', 'logger', 'errorHandler'].includes(name)
    );
  }

  /**
   * Constrói grafo de dependências
   * 
   * @param {Array<string>} systems - Sistemas
   * @param {Object} registry - ComponentRegistry
   * @returns {Promise<Object>} Grafo de dependências
   */
  async buildDependencyGraph(systems, registry) {
    const graph = {
      nodes: [],
      edges: []
    };

    for (const systemName of systems) {
      try {
        const system = registry.get(systemName);
        if (system && typeof system.getDependencies === 'function') {
          const dependencies = system.getDependencies();
          
          graph.nodes.push({
            name: systemName,
            dependencies
          });

          for (const dep of dependencies) {
            if (systems.includes(dep) || ['config', 'logger', 'errorHandler'].includes(dep)) {
              graph.edges.push({
                from: dep,
                to: systemName
              });
            }
          }
        }
      } catch (error) {
        this.logger?.warn(`Erro ao obter dependências de ${systemName}`, { error });
      }
    }

    return graph;
  }

  /**
   * Valida dependências
   * 
   * @param {Object} dependencyGraph - Grafo de dependências
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateDependencies(dependencyGraph) {
    const issues = [];

    // Verificar se todas as dependências existem
    for (const node of dependencyGraph.nodes) {
      for (const dep of node.dependencies || []) {
        const depExists = dependencyGraph.nodes.some(n => n.name === dep) || 
                         ['config', 'logger', 'errorHandler'].includes(dep);
        
        if (!depExists) {
          issues.push({
            type: 'missing_dependency',
            system: node.name,
            dependency: dep,
            severity: 'high'
          });
        }
      }
    }

    // Verificar ciclos
    const cycles = this.detectCycles(dependencyGraph);
    if (cycles.length > 0) {
      issues.push({
        type: 'circular_dependency',
        cycles,
        severity: 'critical'
      });
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Detecta ciclos no grafo
   * 
   * @param {Object} graph - Grafo
   * @returns {Array<Array<string>>} Ciclos encontrados
   */
  detectCycles(graph) {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (nodeName) => {
      visited.add(nodeName);
      recursionStack.add(nodeName);

      const edges = graph.edges.filter(e => e.from === nodeName);
      for (const edge of edges) {
        if (!visited.has(edge.to)) {
          const subCycles = dfs(edge.to);
          if (subCycles.length > 0) {
            cycles.push(...subCycles);
          }
        } else if (recursionStack.has(edge.to)) {
          cycles.push([nodeName, edge.to]);
        }
      }

      recursionStack.delete(nodeName);
      return cycles;
    };

    for (const node of graph.nodes) {
      if (!visited.has(node.name)) {
        dfs(node.name);
      }
    }

    return cycles;
  }

  /**
   * Calcula ordem de inicialização
   * 
   * @param {Object} dependencyGraph - Grafo de dependências
   * @returns {Array<string>} Ordem de inicialização
   */
  calculateInitializationOrder(dependencyGraph) {
    // Ordenação topológica
    const inDegree = new Map();
    const order = [];

    // Inicializar graus de entrada
    for (const node of dependencyGraph.nodes) {
      inDegree.set(node.name, 0);
    }

    // Calcular graus de entrada
    for (const edge of dependencyGraph.edges) {
      const current = inDegree.get(edge.to) || 0;
      inDegree.set(edge.to, current + 1);
    }

    // Fila de nós sem dependências
    const queue = [];
    for (const node of dependencyGraph.nodes) {
      if (inDegree.get(node.name) === 0) {
        queue.push(node.name);
      }
    }

    // Processar fila
    while (queue.length > 0) {
      const node = queue.shift();
      order.push(node);

      const outgoingEdges = dependencyGraph.edges.filter(e => e.from === node);
      for (const edge of outgoingEdges) {
        const degree = inDegree.get(edge.to);
        inDegree.set(edge.to, degree - 1);
        
        if (inDegree.get(edge.to) === 0) {
          queue.push(edge.to);
        }
      }
    }

    return order;
  }

  /**
   * Inicializa sistemas em ordem
   * 
   * @param {Array<string>} order - Ordem de inicialização
   * @param {Object} registry - ComponentRegistry
   * @returns {Promise<Array<Object>>} Resultados da inicialização
   */
  async initializeInOrder(order, registry) {
    const results = [];

    for (const systemName of order) {
      try {
        const system = registry.get(systemName);
        if (system && typeof system.initialize === 'function') {
          await system.initialize();
          results.push({
            system: systemName,
            initialized: true,
            success: true
          });
        } else {
          results.push({
            system: systemName,
            initialized: false,
            success: false,
            error: 'Sistema não tem método initialize'
          });
        }
      } catch (error) {
        results.push({
          system: systemName,
          initialized: false,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Valida integração completa
   * 
   * @param {Array<string>} systems - Sistemas integrados
   * @param {Object} registry - ComponentRegistry
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateIntegrationComplete(systems, registry) {
    const validation = {
      allSystemsRegistered: true,
      allSystemsInitialized: true,
      issues: []
    };

    for (const systemName of systems) {
      try {
        const system = registry.get(systemName);
        if (!system) {
          validation.allSystemsRegistered = false;
          validation.issues.push({
            system: systemName,
            issue: 'Sistema não registrado'
          });
        } else if (typeof system.initialize !== 'function') {
          validation.issues.push({
            system: systemName,
            issue: 'Sistema não tem método initialize'
          });
        }
      } catch (error) {
        validation.issues.push({
          system: systemName,
          issue: `Erro ao validar: ${error.message}`
        });
      }
    }

    validation.valid = validation.allSystemsRegistered && validation.issues.length === 0;

    return validation;
  }

  /**
   * Valida integração específica
   * 
   * @param {string} integrationId - ID da integração
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateIntegration(integrationId) {
    const integration = this.integrations.get(integrationId);

    if (!integration) {
      throw new Error(`Integração não encontrada: ${integrationId}`);
    }

    return integration.integrationValidation;
  }

  /**
   * Obtém integração armazenada
   * 
   * @param {string} integrationId - ID da integração
   * @returns {Object|null} Integração ou null
   */
  getIntegration(integrationId) {
    return this.integrations.get(integrationId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.integrations.values());

    return {
      totalIntegrations: all.length,
      successfulIntegrations: all.filter(i => i.integrated).length,
      totalSystemsIntegrated: all.reduce((sum, i) => sum + (i.systems?.length || 0), 0)
    };
  }

  /**
   * Valida contexto
   * 
   * @param {Object} context - Contexto
   * @returns {Object} Resultado da validação
   */
  onValidate(context) {
    if (!context || typeof context !== 'object') {
      return { valid: false, errors: ['Context deve ser um objeto'] };
    }

    if (!context.action || typeof context.action !== 'string') {
      return { valid: false, errors: ['action é obrigatório e deve ser string'] };
    }

    return { valid: true };
  }

  /**
   * Retorna dependências do sistema
   * 
   * @returns {Array<string>} Dependências
   */
  onGetDependencies() {
    return ['logger', 'config'];
  }
}

export default SystemIntegrator;

export function createSystemIntegrator(config = null, logger = null, errorHandler = null) {
  return new SystemIntegrator(config, logger, errorHandler);
}
