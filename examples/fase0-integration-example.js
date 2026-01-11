/**
 * Exemplo de integração dos sistemas da FASE 0 com ComponentRegistry e ConfigSchema
 */

import { ComponentRegistry, createComponentRegistry, ConfigSchema, createConfigSchema } from '../src/core/index.js';
import { initializeFase0Integration } from '../src/systems/fase0/registry-integration.js';
import { loadConfig } from '../src/utils/ConfigLoader.js';
import { getLogger } from '../src/utils/Logger.js';
import { getErrorHandler } from '../src/utils/ErrorHandler.js';

// Carregar configuração
const configLoader = loadConfig();
const config = configLoader.get();
const logger = getLogger(config);
const errorHandler = getErrorHandler(config, logger);

// Criar registry e schema
const registry = createComponentRegistry({ logger, errorHandler });
const configSchema = createConfigSchema({ logger, errorHandler });

// Registrar dependências primeiro
registry.register('config', () => config);
registry.register('logger', () => logger);
registry.register('errorHandler', () => errorHandler);

// Inicializar integração da FASE 0
console.log('\n=== Inicializando Integração FASE 0 ===\n');

const integration = initializeFase0Integration(registry, configSchema, {
  config,
  logger,
  errorHandler
});

console.log('✅ Sistemas registrados:', integration.registered);
console.log('✅ Schemas definidos:', integration.schemas);

// Validar configuração usando schemas
console.log('\n=== Validando Configuração ===\n');

const baselineConfig = {
  enabled: true,
  autoDetect: true,
  checkServices: false
};

const baselineValidation = configSchema.validate(baselineConfig, 'baselineManager');
console.log('BaselineManager config:', baselineValidation.valid ? '✅ Válida' : '❌ Inválida');
if (!baselineValidation.valid) {
  console.log('Erros:', baselineValidation.errors);
}

// Mesclar com defaults
const mergedConfig = configSchema.mergeDefaults({ enabled: true }, 'baselineManager');
console.log('\nConfig mesclada:', JSON.stringify(mergedConfig, null, 2));

// Obter sistemas do registry
console.log('\n=== Obtendo Sistemas do Registry ===\n');

const baselineManager = registry.get('BaselineManager');
await baselineManager.initialize();

const antiSkipMechanism = registry.get('AntiSkipMechanism');
await antiSkipMechanism.initialize();

const threeERuleValidator = registry.get('ThreeERuleValidator');
await threeERuleValidator.initialize();

const checkpointManager = registry.get('CheckpointManager');
await checkpointManager.initialize();

console.log('✅ Todos os sistemas inicializados via ComponentRegistry');

// Testar uso dos sistemas
console.log('\n=== Testando Sistemas ===\n');

// Testar BaselineManager
const baseline = await baselineManager.execute({
  systemName: 'test-system',
  options: {}
});
console.log('Baseline criado:', baseline.system);

// Testar AntiSkipMechanism
await antiSkipMechanism.execute({
  checkId: 'check-1',
  required: true,
  action: 'register'
});
await antiSkipMechanism.execute({
  checkId: 'check-1',
  action: 'markExecuted'
});
const stats = antiSkipMechanism.getStats();
console.log('AntiSkipMechanism stats:', stats);

// Testar ThreeERuleValidator
const checkValidation = await threeERuleValidator.execute({
  check: {
    id: 'check-1',
    especificacao: 'Verificar função',
    execucao: 'grep -r "function" src/',
    evidencia: 'output.txt'
  }
});
console.log('Check validado:', checkValidation.valid ? '✅' : '❌');

// Testar CheckpointManager
const checkpointList = await checkpointManager.execute({ action: 'list' });
console.log('Checkpoints disponíveis:', checkpointList.length);

console.log('\n✅ Integração FASE 0 completa e funcionando!\n');
