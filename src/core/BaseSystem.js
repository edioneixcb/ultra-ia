/**
 * BaseSystem - Interface Base para Sistemas
 * 
 * Define contrato padronizado para todos os sistemas do roadmap.
 * 
 * Funcionalidades:
 * - Inicialização padronizada (initialize)
 * - Execução padronizada (execute)
 * - Validação padronizada (validate)
 * - Declaração de dependências (getDependencies)
 * - Validação de contexto antes de execução
 * 
 * Princípios Arquiteturais:
 * - Template Method Pattern: Define estrutura, subclasses implementam detalhes
 * - Dependency Injection: Config, logger e errorHandler injetados
 * - Single Responsibility: Responsável apenas por contrato base
 * - Open/Closed: Aberto para extensão (subclasses), fechado para modificação
 * 
 * @module BaseSystem
 */

/**
 * Contexto passado para métodos execute e validate
 * @typedef {Object} SystemContext
 * @property {*} [sessionId] - ID da sessão
 * @property {*} [projectId] - ID do projeto
 * @property {*} [data] - Dados específicos do sistema
 * @property {Object} [options] - Opções adicionais
 */

/**
 * Resultado de validação
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Se a validação passou
 * @property {string[]} [errors] - Array de mensagens de erro
 * @property {string[]} [warnings] - Array de mensagens de aviso
 */

/**
 * BaseSystem - Classe base para todos os sistemas do roadmap
 * 
 * Todos os sistemas devem estender esta classe e implementar os métodos abstratos:
 * - onInitialize(): Inicialização específica do sistema
 * - onExecute(context): Execução específica do sistema
 * - onValidate(context): Validação específica do sistema (opcional)
 * - onGetDependencies(): Retorna array de nomes de dependências (opcional)
 */
class BaseSystem {
  /**
   * Cria uma nova instância do BaseSystem
   * 
   * @param {Object} [config=null] - Configuração do sistema
   * @param {Object} [logger=null] - Logger para registro de eventos
   * @param {Object} [errorHandler=null] - Error handler para tratamento de erros
   */
  constructor(config = null, logger = null, errorHandler = null) {
    this.config = config;
    this.logger = logger;
    this.errorHandler = errorHandler;
    this.initialized = false;
    this.systemName = this.constructor.name;
  }

  /**
   * Inicializa o sistema (Template Method)
   * 
   * Garante que o sistema só é inicializado uma vez e chama onInitialize() da subclasse.
   * 
   * @returns {Promise<void>}
   * @throws {Error} Se inicialização falhar
   */
  async initialize() {
    if (this.initialized) {
      this.logger?.warn('Sistema já inicializado', { 
        system: this.systemName 
      });
      return;
    }

    try {
      this.logger?.info(`Inicializando sistema: ${this.systemName}`);
      await this.onInitialize();
      this.initialized = true;
      this.logger?.info(`Sistema inicializado: ${this.systemName}`);
    } catch (error) {
      this.errorHandler?.handleError(error, {
        component: 'BaseSystem',
        operation: 'initialize',
        system: this.systemName
      });
      throw error;
    }
  }

  /**
   * Executa o sistema (Template Method)
   * 
   * Garante que o sistema está inicializado, valida o contexto e chama onExecute() da subclasse.
   * 
   * @param {SystemContext} context - Contexto de execução
   * @returns {Promise<*>} Resultado da execução
   * @throws {Error} Se sistema não está inicializado
   * @throws {Error} Se contexto é inválido
   * @throws {Error} Se execução falhar
   */
  async execute(context) {
    // Garantir inicialização
    if (!this.initialized) {
      await this.initialize();
    }

    // Validar contexto
    const contextValidation = this.validateContext(context);
    if (!contextValidation.valid) {
      const error = new Error(contextValidation.errors[0] || 'Contexto inválido');
      this.errorHandler?.handleError(error, {
        component: 'BaseSystem',
        operation: 'execute',
        system: this.systemName,
        contextValidation
      });
      throw error;
    }

    try {
      this.logger?.debug(`Executando sistema: ${this.systemName}`, {
        contextKeys: Object.keys(context || {})
      });
      
      const result = await this.onExecute(context);
      
      this.logger?.debug(`Sistema executado com sucesso: ${this.systemName}`);
      return result;
    } catch (error) {
      this.errorHandler?.handleError(error, {
        component: 'BaseSystem',
        operation: 'execute',
        system: this.systemName,
        context: context
      });
      throw error;
    }
  }

  /**
   * Valida o contexto de execução (Template Method)
   * 
   * Valida o contexto básico e chama onValidate() da subclasse para validação específica.
   * 
   * @param {SystemContext} context - Contexto a validar
   * @returns {ValidationResult} Resultado da validação
   */
  validate(context) {
    // Validação básica de contexto
    const basicValidation = this.validateContext(context);
    if (!basicValidation.valid) {
      return basicValidation;
    }

    // Validação específica da subclasse
    return this.onValidate(context);
  }

  /**
   * Retorna dependências do sistema
   * 
   * @returns {string[]} Array de nomes de componentes dos quais este sistema depende
   */
  getDependencies() {
    return this.onGetDependencies();
  }

  /**
   * Valida contexto básico (objeto não nulo)
   * 
   * @param {SystemContext} context - Contexto a validar
   * @returns {ValidationResult} Resultado da validação
   * @protected
   */
  validateContext(context) {
    if (!context || typeof context !== 'object') {
      const error = {
        valid: false,
        errors: ['Context deve ser um objeto não nulo']
      };
      this.logger?.error('Contexto inválido', {
        system: this.systemName,
        contextType: typeof context
      });
      return error;
    }

    return { valid: true };
  }

  /**
   * Verifica se o sistema está inicializado
   * 
   * @returns {boolean} True se inicializado, false caso contrário
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Retorna nome do sistema
   * 
   * @returns {string} Nome do sistema
   */
  getName() {
    return this.systemName;
  }

  // ========== Métodos Abstratos (a serem implementados por subclasses) ==========

  /**
   * Inicialização específica do sistema
   * 
   * Implementado por subclasses para realizar inicialização específica.
   * Chamado automaticamente por initialize() antes de marcar como inicializado.
   * 
   * @returns {Promise<void>}
   * @protected
   * @abstract
   */
  async onInitialize() {
    // Implementação padrão vazia - subclasses podem sobrescrever
  }

  /**
   * Execução específica do sistema
   * 
   * Implementado por subclasses para realizar lógica específica do sistema.
   * Chamado automaticamente por execute() após validação de contexto.
   * 
   * @param {SystemContext} context - Contexto de execução
   * @returns {Promise<*>} Resultado da execução
   * @protected
   * @abstract
   * @throws {Error} Deve ser implementado por subclasses
   */
  async onExecute(context) {
    throw new Error(
      `onExecute() deve ser implementado por ${this.systemName}. ` +
      'Este é um método abstrato.'
    );
  }

  /**
   * Validação específica do sistema
   * 
   * Implementado por subclasses para realizar validação específica do contexto.
   * Chamado automaticamente por validate() após validação básica.
   * 
   * @param {SystemContext} context - Contexto a validar
   * @returns {ValidationResult} Resultado da validação
   * @protected
   */
  onValidate(context) {
    // Implementação padrão: sempre válido
    return { valid: true };
  }

  /**
   * Retorna dependências do sistema
   * 
   * Implementado por subclasses para declarar dependências.
   * Usado pelo ComponentRegistry para resolução automática de dependências.
   * 
   * @returns {string[]} Array de nomes de componentes dos quais este sistema depende
   * @protected
   */
  onGetDependencies() {
    // Implementação padrão: sem dependências
    return [];
  }
}

export default BaseSystem;
