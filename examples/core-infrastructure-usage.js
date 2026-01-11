/**
 * Exemplo de uso dos sistemas de infraestrutura da FASE PRÉ-REQUISITO
 * 
 * Demonstra como usar ComponentRegistry, BaseSystem, ConfigSchema e ExecutionPipeline
 */

import { ComponentRegistry, BaseSystem, ConfigSchema, ExecutionPipeline } from '../src/core/index.js';
import { getLogger } from '../src/utils/Logger.js';
import { getErrorHandler } from '../src/utils/ErrorHandler.js';
import { loadConfig } from '../src/utils/ConfigLoader.js';

// Carregar configuração
const configLoader = loadConfig();
const config = configLoader.get();
const logger = getLogger(config);
const errorHandler = getErrorHandler(config, logger);

// ========== EXEMPLO 1: ComponentRegistry ==========
console.log('\n=== EXEMPLO 1: ComponentRegistry ===\n');

const registry = new ComponentRegistry({ logger, errorHandler });

// Registrar componentes
registry.register('logger', () => logger);
registry.register('config', () => config);
registry.register('errorHandler', () => errorHandler);

// Componente com dependências
registry.register('service', (logger, config) => {
  return {
    name: 'MyService',
    logger,
    config,
    doSomething: () => {
      logger.info('Service executando ação');
      return 'done';
    }
  };
}, ['logger', 'config']);

// Obter instância com dependências injetadas
const service = registry.get('service');
console.log('Service criado:', service.doSomething());

// ========== EXEMPLO 2: BaseSystem ==========
console.log('\n=== EXEMPLO 2: BaseSystem ===\n');

class ExampleSystem extends BaseSystem {
  async onInitialize() {
    this.logger?.info('ExampleSystem inicializado');
    this.data = { initialized: true };
  }

  async onExecute(context) {
    return {
      system: 'ExampleSystem',
      context,
      data: this.data
    };
  }

  onValidate(context) {
    if (!context.sessionId) {
      return { valid: false, errors: ['sessionId é obrigatório'] };
    }
    return { valid: true };
  }

  onGetDependencies() {
    return ['logger', 'config'];
  }
}

const exampleSystem = new ExampleSystem(config, logger, errorHandler);
await exampleSystem.initialize();

const result = await exampleSystem.execute({ sessionId: '123', data: 'test' });
console.log('Resultado da execução:', result);

// ========== EXEMPLO 3: ConfigSchema ==========
console.log('\n=== EXEMPLO 3: ConfigSchema ===\n');

const configSchema = new ConfigSchema({ logger, errorHandler });

// Definir schema para um sistema
configSchema.defineSystem('database', {
  type: 'object',
  properties: {
    host: { type: 'string', required: true },
    port: { type: 'number', min: 1, max: 65535, default: 5432 },
    enabled: { type: 'boolean', default: true }
  }
}, {
  port: 5432,
  enabled: true
});

// Validar configuração
const dbConfig = { host: 'localhost', port: 3306 };
const validation = configSchema.validate(dbConfig, 'database');
console.log('Validação:', validation.valid ? '✅ Válida' : '❌ Inválida');
if (!validation.valid) {
  console.log('Erros:', validation.errors);
}

// Mesclar com defaults
const merged = configSchema.mergeDefaults({ host: 'remote' }, 'database');
console.log('Config mesclada:', merged);

// ========== EXEMPLO 4: ExecutionPipeline ==========
console.log('\n=== EXEMPLO 4: ExecutionPipeline ===\n');

// Criar sistemas de exemplo
class InitSystem extends BaseSystem {
  async onExecute() {
    return { stage: 'init', completed: true };
  }
}

class SetupSystem extends BaseSystem {
  async onExecute(context) {
    return { stage: 'setup', dependsOn: context.init };
  }
}

class FinalSystem extends BaseSystem {
  async onExecute(context) {
    return { stage: 'final', dependsOn: context.setup };
  }
}

// Registrar sistemas
registry.register('InitSystem', () => new InitSystem(config, logger, errorHandler));
registry.register('SetupSystem', () => new SetupSystem(config, logger, errorHandler));
registry.register('FinalSystem', () => new FinalSystem(config, logger, errorHandler));

// Criar pipeline
const pipeline = new ExecutionPipeline(registry, { logger, errorHandler });

// Adicionar estágios com dependências
pipeline.addStage('init', ['InitSystem'], []);
pipeline.addStage('setup', ['SetupSystem'], ['init']);
pipeline.addStage('final', ['FinalSystem'], ['setup']);

// Executar pipeline
const pipelineResults = await pipeline.execute();
console.log('Resultados do pipeline:', pipelineResults);

console.log('\n✅ Todos os exemplos executados com sucesso!\n');
