# Integração FASE PRÉ-REQUISITO

## Visão Geral

A FASE PRÉ-REQUISITO implementa 4 sistemas de infraestrutura fundamentais que fornecem base arquitetural para todos os sistemas do roadmap:

1. **ComponentRegistry** - Registro e descoberta de componentes com Dependency Injection
2. **BaseSystem** - Interface base padronizada para todos os sistemas
3. **ConfigSchema** - Configuração extensível e type-safe
4. **ExecutionPipeline** - Pipeline de execução ordenada respeitando dependências

## Localização dos Arquivos

```
src/core/
├── ComponentRegistry.js    # Sistema de registro de componentes
├── BaseSystem.js           # Interface base para sistemas
├── ConfigSchema.js         # Sistema de configuração type-safe
├── ExecutionPipeline.js    # Pipeline de execução ordenada
└── index.js                # Exportações centralizadas
```

## Como Usar

### 1. ComponentRegistry

Registre componentes e resolva dependências automaticamente:

```javascript
import { ComponentRegistry } from '../src/core/index.js';

const registry = new ComponentRegistry({ logger, errorHandler });

// Registrar componente sem dependências
registry.register('logger', () => logger);

// Registrar componente com dependências
registry.register('service', (logger, config) => {
  return new MyService(logger, config);
}, ['logger', 'config']);

// Obter instância com dependências injetadas
const service = registry.get('service');
```

### 2. BaseSystem

Estenda BaseSystem para criar novos sistemas:

```javascript
import { BaseSystem } from '../src/core/index.js';

class MySystem extends BaseSystem {
  async onInitialize() {
    // Inicialização específica
  }

  async onExecute(context) {
    // Lógica de execução
    return { result: 'success' };
  }

  onValidate(context) {
    // Validação específica
    return { valid: true };
  }

  onGetDependencies() {
    return ['logger', 'config'];
  }
}
```

### 3. ConfigSchema

Defina schemas e valide configurações:

```javascript
import { ConfigSchema } from '../src/core/index.js';

const configSchema = new ConfigSchema({ logger, errorHandler });

// Definir schema
configSchema.defineSystem('database', {
  type: 'object',
  properties: {
    host: { type: 'string', required: true },
    port: { type: 'number', min: 1, max: 65535 }
  }
}, { port: 5432 });

// Validar configuração
const validation = configSchema.validate({ host: 'localhost' }, 'database');

// Mesclar com defaults
const merged = configSchema.mergeDefaults({ host: 'remote' }, 'database');
```

### 4. ExecutionPipeline

Execute sistemas em ordem respeitando dependências:

```javascript
import { ExecutionPipeline } from '../src/core/index.js';

const pipeline = new ExecutionPipeline(registry, { logger, errorHandler });

// Adicionar estágios
pipeline.addStage('init', ['SystemA'], []);
pipeline.addStage('setup', ['SystemB'], ['init']);
pipeline.addStage('final', ['SystemC'], ['setup']);

// Executar pipeline
const results = await pipeline.execute({ sessionId: '123' });
```

## Integração com Código Existente

### Opção 1: Migração Gradual (Recomendada)

Migrar sistemas existentes gradualmente para usar BaseSystem:

```javascript
// Antes
class MySystem {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
}

// Depois
class MySystem extends BaseSystem {
  constructor(config, logger, errorHandler) {
    super(config, logger, errorHandler);
  }
  
  async onExecute(context) {
    // Implementação
  }
}
```

### Opção 2: Registro no ComponentRegistry

Registrar sistemas existentes no ComponentRegistry:

```javascript
import { getUltraSystem } from './systems/UltraSystem.js';

registry.register('UltraSystem', (config, logger, errorHandler) => {
  return getUltraSystem(config, logger, errorHandler);
}, ['config', 'logger', 'errorHandler']);
```

## Próximos Passos

1. Migrar sistemas existentes para estender BaseSystem
2. Registrar todos os sistemas no ComponentRegistry
3. Definir schemas de configuração para cada sistema
4. Criar pipelines de execução para fluxos complexos

## Testes

Todos os sistemas têm testes unitários completos:

```bash
npm test -- tests/unit/ComponentRegistry.test.js
npm test -- tests/unit/BaseSystem.test.js
npm test -- tests/unit/ConfigSchema.test.js
npm test -- tests/unit/ExecutionPipeline.test.js
```

## Métricas de Sucesso

- ✅ 100% dos componentes registrados corretamente
- ✅ 100% das dependências resolvidas automaticamente
- ✅ 100% dos sistemas seguem contrato BaseSystem
- ✅ 100% das configurações validadas antes de uso
- ✅ 100% dos sistemas executados na ordem correta
