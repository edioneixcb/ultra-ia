# Integração Completa FASE 0

## Visão Geral

A FASE 0 foi completamente integrada com os sistemas de infraestrutura (ComponentRegistry e ConfigSchema), permitindo uso padronizado e configuração type-safe de todos os sistemas.

## Arquivos de Integração

### `src/systems/fase0/registry-integration.js`

Módulo central de integração que fornece:

1. **`registerFase0Systems(registry, dependencies)`**
   - Registra todos os 6 sistemas da FASE 0 no ComponentRegistry
   - Resolve dependências automaticamente (config, logger, errorHandler)

2. **`defineFase0Schemas(configSchema)`**
   - Define schemas de configuração type-safe para todos os sistemas
   - Inclui validações e defaults apropriados

3. **`initializeFase0Integration(registry, configSchema, dependencies)`**
   - Função de conveniência que inicializa tudo de uma vez
   - Retorna lista de sistemas registrados e schemas definidos

## Configuração

A seção `fase0` foi adicionada ao `config/config.json` com configurações para cada sistema:

```json
{
  "fase0": {
    "baselineManager": { ... },
    "antiSkipMechanism": { ... },
    "threeERuleValidator": { ... },
    "absoluteCertaintyAnalyzer": { ... },
    "completeContractAnalyzer": { ... },
    "checkpointManager": { ... }
  }
}
```

## Como Usar

### Exemplo Básico

```javascript
import { createComponentRegistry, createConfigSchema } from '../src/core/index.js';
import { initializeFase0Integration } from '../src/systems/fase0/registry-integration.js';
import { loadConfig } from '../src/utils/ConfigLoader.js';
import { getLogger } from '../src/utils/Logger.js';
import { getErrorHandler } from '../src/utils/ErrorHandler.js';

// Carregar dependências
const config = loadConfig().get();
const logger = getLogger(config);
const errorHandler = getErrorHandler(config, logger);

// Criar registry e schema
const registry = createComponentRegistry({ logger, errorHandler });
const configSchema = createConfigSchema({ logger, errorHandler });

// Registrar dependências primeiro
registry.register('config', () => config);
registry.register('logger', () => logger);
registry.register('errorHandler', () => errorHandler);

// Inicializar integração FASE 0
const integration = initializeFase0Integration(registry, configSchema, {
  config,
  logger,
  errorHandler
});

// Usar sistemas
const baselineManager = registry.get('BaselineManager');
await baselineManager.initialize();

const baseline = await baselineManager.execute({
  systemName: 'my-system',
  options: {}
});
```

### Validação de Configuração

```javascript
// Validar configuração usando schema
const baselineConfig = {
  enabled: true,
  autoDetect: true
};

const validation = configSchema.validate(baselineConfig, 'baselineManager');
if (!validation.valid) {
  console.error('Erros:', validation.errors);
}

// Mesclar com defaults
const merged = configSchema.mergeDefaults({ enabled: true }, 'baselineManager');
```

## Sistemas Integrados

### 1. BaselineManager
- **Registry ID:** `BaselineManager`
- **Schema ID:** `baselineManager`
- **Dependências:** config, logger, errorHandler

### 2. AntiSkipMechanism
- **Registry ID:** `AntiSkipMechanism`
- **Schema ID:** `antiSkipMechanism`
- **Dependências:** config, logger, errorHandler

### 3. ThreeERuleValidator
- **Registry ID:** `ThreeERuleValidator`
- **Schema ID:** `threeERuleValidator`
- **Dependências:** config, logger, errorHandler

### 4. AbsoluteCertaintyAnalyzer
- **Registry ID:** `AbsoluteCertaintyAnalyzer`
- **Schema ID:** `absoluteCertaintyAnalyzer`
- **Dependências:** config, logger, errorHandler

### 5. CompleteContractAnalyzer
- **Registry ID:** `CompleteContractAnalyzer`
- **Schema ID:** `completeContractAnalyzer`
- **Dependências:** config, logger, errorHandler

### 6. CheckpointManager
- **Registry ID:** `CheckpointManager`
- **Schema ID:** `checkpointManager`
- **Dependências:** config, logger, errorHandler

## Benefícios da Integração

1. **Dependency Injection Automática**
   - Dependências resolvidas automaticamente pelo ComponentRegistry
   - Não precisa passar dependências manualmente

2. **Configuração Type-Safe**
   - Schemas garantem que configurações são válidas
   - Validação automática antes de usar sistemas

3. **Defaults Automáticos**
   - Merge automático de defaults com configuração fornecida
   - Reduz necessidade de configuração manual

4. **Padronização**
   - Todos os sistemas seguem mesmo padrão de uso
   - Facilita manutenção e extensão

## Próximos Passos

1. **FASE 1: Prevenção Proativa**
   - Implementar 13 sistemas de prevenção
   - Integrar com ComponentRegistry e ConfigSchema

2. **Migração Gradual**
   - Migrar sistemas existentes para usar BaseSystem
   - Registrar no ComponentRegistry

3. **ExecutionPipeline**
   - Criar pipelines de execução usando sistemas da FASE 0
   - Orquestrar fluxos complexos

## Exemplo Completo

Ver `examples/fase0-integration-example.js` para exemplo completo de uso.
