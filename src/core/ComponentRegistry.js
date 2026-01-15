/**
 * ComponentRegistry - Sistema de Registro e Descoberta de Componentes
 * 
 * Permite registro, descoberta e resolução automática de dependências entre componentes.
 * 
 * Funcionalidades:
 * - Registro de componentes com factory e dependências
 * - Descoberta automática de componentes disponíveis
 * - Resolução automática de dependências (Dependency Injection)
 * - Validação de dependências (detecta faltantes e circulares)
 * - Factory Pattern para criação de instâncias
 * 
 * Princípios Arquiteturais:
 * - Dependency Injection: Dependências injetadas automaticamente
 * - Single Responsibility: Responsável apenas por registro e resolução
 * - Open/Closed: Aberto para extensão (novos componentes), fechado para modificação
 * 
 * @module ComponentRegistry
 */

/**
 * Factory function para criar componente
 * @typedef {Function} ComponentFactory
 * @param {...*} dependencies - Dependências do componente (resolvidas automaticamente)
 * @returns {*} Instância do componente
 */

/**
 * ComponentRegistry - Registro centralizado de componentes com resolução automática de dependências
 */
class ComponentRegistry {
  /**
   * Cria uma nova instância do ComponentRegistry
   * @param {Object} options - Opções de configuração
   * @param {Object} [options.logger] - Logger para registro de eventos
   * @param {Object} [options.errorHandler] - Error handler para tratamento de erros
   */
  constructor(options = {}) {
    const { logger = null, errorHandler = null } = options;
    
    this.logger = logger;
    this.errorHandler = errorHandler;
    
    // Map de componentes: nome -> factory function
    this.components = new Map();
    
    // Map de dependências: nome -> array de nomes de dependências
    this.dependencies = new Map();
    
    // Cache de instâncias singleton (opcional, pode ser implementado)
    this.instances = new Map();
    
    this.logger?.info('ComponentRegistry inicializado');
  }

  /**
   * Registra um componente no registry
   * 
   * @param {string} name - Nome único do componente
   * @param {ComponentFactory} factory - Função factory que cria o componente
   * @param {string[]} [dependencies=[]] - Array de nomes de componentes dos quais este depende
   * @throws {Error} Se componente já está registrado
   * @throws {Error} Se dependências não existem
   * 
   * @example
   * registry.register('logger', () => new Logger(), []);
   * registry.register('service', (logger) => new Service(logger), ['logger']);
   */
  register(name, factory, dependencies = []) {
    // Validação de entrada
    this.validateRegistrationInput(name, factory, dependencies);

    // Verificar se já está registrado
    if (this.components.has(name)) {
      const error = new Error(`Componente '${name}' já está registrado`);
      this.errorHandler?.handleError(error, {
        component: 'ComponentRegistry',
        operation: 'register',
        componentName: name
      });
      throw error;
    }

    // Validar que dependências existem (exceto se estamos registrando as próprias dependências)
    this.validateDependencies(name, dependencies);

    // Registrar componente
    this.components.set(name, factory);
    this.dependencies.set(name, dependencies);

    this.logger?.info(`Componente '${name}' registrado`, {
      dependencies: dependencies.length > 0 ? dependencies : 'nenhuma'
    });
  }

  /**
   * Obtém uma instância do componente, resolvendo dependências automaticamente
   * 
   * @param {string} name - Nome do componente
   * @param {Object} [context={}] - Contexto adicional para injeção (sobrescreve dependências resolvidas)
   * @returns {*} Instância do componente com dependências injetadas
   * @throws {Error} Se componente não está registrado
   * @throws {Error} Se há dependência circular
   * 
   * @example
   * const logger = registry.get('logger');
   * const service = registry.get('service'); // logger injetado automaticamente
   */
  get(name, context = {}) {
    // Validação de entrada
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error('Nome do componente deve ser uma string não vazia');
    }

    if (!this.components.has(name)) {
      const error = new Error(`Componente '${name}' não está registrado`);
      this.errorHandler?.handleError(error, {
        component: 'ComponentRegistry',
        operation: 'get',
        componentName: name,
        availableComponents: Array.from(this.components.keys())
      });
      throw error;
    }

    // Se já existe no contexto, usar do contexto
    if (context[name]) {
      return context[name];
    }

    // Resolver dependências
    const deps = this.dependencies.get(name) || [];
    const resolvedDeps = deps.map(dep => {
      const isOptional = dep.startsWith('?');
      const depName = isOptional ? dep.substring(1) : dep;

      // Verificar se está no contexto primeiro
      if (context[depName]) {
        return context[depName];
      }

      // Se for opcional e não existir, retornar null
      if (isOptional && !this.components.has(depName)) {
        return null;
      }

      // Resolver recursivamente
      return this.get(depName, context);
    });

    // Obter factory e criar instância
    const factory = this.components.get(name);
    
    try {
      const instance = factory(...resolvedDeps);
      this.logger?.debug(`Componente '${name}' criado`, {
        dependenciesResolved: deps.length
      });
      return instance;
    } catch (error) {
      this.errorHandler?.handleError(error, {
        component: 'ComponentRegistry',
        operation: 'get',
        componentName: name,
        dependencies: deps
      });
      throw error;
    }
  }

  /**
   * Resolve todas as dependências de um componente (incluindo dependências transitivas)
   * 
   * @param {string} name - Nome do componente
   * @returns {string[]} Array ordenado de nomes de componentes (dependências primeiro)
   * @throws {Error} Se há dependência circular
   * 
   * @example
   * const order = registry.resolveDependencies('service');
   * // ['logger', 'config', 'service']
   */
  resolveDependencies(name) {
    if (!this.components.has(name)) {
      throw new Error(`Componente '${name}' não está registrado`);
    }

    const resolved = new Set();
    const visiting = new Set();
    const order = [];

    const visit = (compName) => {
      // Detectar dependência circular
      if (visiting.has(compName)) {
        const cycle = Array.from(visiting).concat(compName);
        const error = new Error(
          `Dependência circular detectada: ${cycle.join(' -> ')} -> ${compName}`
        );
        this.errorHandler?.handleError(error, {
          component: 'ComponentRegistry',
          operation: 'resolveDependencies',
          componentName: name,
          cycle
        });
        throw error;
      }

      // Se já foi resolvido, pular
      if (resolved.has(compName)) {
        return;
      }

      // Marcar como visitando
      visiting.add(compName);

      // Visitar dependências primeiro
      const deps = this.dependencies.get(compName) || [];
      for (const dep of deps) {
        if (!this.components.has(dep)) {
          throw new Error(`Dependência '${dep}' de '${compName}' não está registrada`);
        }
        visit(dep);
      }

      // Marcar como resolvido e adicionar à ordem
      visiting.delete(compName);
      resolved.add(compName);
      order.push(compName);
    };

    visit(name);
    return order;
  }

  /**
   * Valida que todas as dependências de um componente estão registradas
   * 
   * @param {string} name - Nome do componente
   * @param {string[]} dependencies - Array de nomes de dependências
   * @throws {Error} Se alguma dependência não está registrada
   * @private
   */
  validateDependencies(name, dependencies) {
    const mandatoryDeps = dependencies.filter(dep => !dep.startsWith('?'));
    const missing = mandatoryDeps.filter(dep => !this.components.has(dep));

    if (missing.length > 0) {
      const error = new Error(
        `Dependências faltando para '${name}': ${missing.join(', ')}. ` +
        `Registre as dependências antes de registrar '${name}'`
      );
      this.errorHandler?.handleError(error, {
        component: 'ComponentRegistry',
        operation: 'validateDependencies',
        componentName: name,
        missingDependencies: missing,
        availableComponents: Array.from(this.components.keys())
      });
      throw error;
    }
  }

  /**
   * Valida entrada para registro
   * 
   * @param {string} name - Nome do componente
   * @param {Function} factory - Factory function
   * @param {string[]} dependencies - Array de dependências
   * @throws {Error} Se entrada é inválida
   * @private
   */
  validateRegistrationInput(name, factory, dependencies) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error('Nome do componente deve ser uma string não vazia');
    }

    if (typeof factory !== 'function') {
      throw new Error('Factory deve ser uma função');
    }

    if (!Array.isArray(dependencies)) {
      throw new Error('Dependências devem ser um array de strings');
    }

    // Validar que todas as dependências são strings
    const invalidDeps = dependencies.filter(dep => typeof dep !== 'string' || dep.trim() === '');
    if (invalidDeps.length > 0) {
      throw new Error(`Dependências inválidas: ${invalidDeps.join(', ')}. Todas devem ser strings não vazias`);
    }
  }

  /**
   * Retorna todos os componentes registrados
   * 
   * @returns {string[]} Array de nomes de componentes registrados
   */
  getAllRegistered() {
    return Array.from(this.components.keys());
  }

  /**
   * Verifica se um componente está registrado
   * 
   * @param {string} name - Nome do componente
   * @returns {boolean} True se está registrado, false caso contrário
   */
  has(name) {
    return this.components.has(name);
  }

  /**
   * Remove um componente do registry
   * 
   * @param {string} name - Nome do componente a remover
   * @returns {boolean} True se foi removido, false se não existia
   */
  unregister(name) {
    if (!this.components.has(name)) {
      return false;
    }

    // Verificar se algum componente depende deste
    const dependents = Array.from(this.dependencies.entries())
      .filter(([_, deps]) => deps.includes(name))
      .map(([compName]) => compName);

    if (dependents.length > 0) {
      const error = new Error(
        `Não é possível remover '${name}': outros componentes dependem dele: ${dependents.join(', ')}`
      );
      this.errorHandler?.handleError(error, {
        component: 'ComponentRegistry',
        operation: 'unregister',
        componentName: name,
        dependents
      });
      throw error;
    }

    this.components.delete(name);
    this.dependencies.delete(name);
    this.instances.delete(name);

    this.logger?.info(`Componente '${name}' removido`);
    return true;
  }

  /**
   * Limpa todos os componentes registrados
   */
  clear() {
    const count = this.components.size;
    this.components.clear();
    this.dependencies.clear();
    this.instances.clear();
    this.logger?.info(`Registry limpo: ${count} componente(s) removido(s)`);
  }
}

/**
 * Singleton global do ComponentRegistry (opcional)
 * @type {ComponentRegistry|null}
 */
let globalRegistry = null;

/**
 * Obtém ou cria instância global do ComponentRegistry
 * 
 * @param {Object} [options={}] - Opções de configuração
 * @returns {ComponentRegistry} Instância do ComponentRegistry
 */
export function getComponentRegistry(options = {}) {
  if (!globalRegistry) {
    globalRegistry = new ComponentRegistry(options);
  }
  return globalRegistry;
}

/**
 * Cria uma nova instância do ComponentRegistry
 * 
 * @param {Object} [options={}] - Opções de configuração
 * @returns {ComponentRegistry} Nova instância do ComponentRegistry
 */
export function createComponentRegistry(options = {}) {
  return new ComponentRegistry(options);
}

export default ComponentRegistry;
