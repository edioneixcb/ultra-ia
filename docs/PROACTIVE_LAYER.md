# Camada Proativa (MCP Inteligente)

## Visão Geral

A Camada Proativa transforma o Ultra-IA de reativo para preventivo. Ela monitora mudanças, intercepta ações antes da execução, enriquece contexto com conhecimento do projeto e executa guardiões preditivos.

## Componentes Principais

- `EventBus` - Barramento de eventos interno.
- `FileWatcher` - Monitoramento de arquivos com debounce.
- `InterceptorLayer` - Intercepta chamadas MCP e bloqueia código inválido.
- `CognitiveContextEngine` - Grafo de conhecimento, análise de impacto e padrões de estilo.
- `AgentMemoryBridge` - Memória persistente por agente.
- `MutationSelfHealing` - Auto-correção via mutações testadas em sandbox.
- Guardiões - Detectores de regressão, drift semântico e dependências vulneráveis.

## Fluxo Proativo

1. `FileWatcher` detecta mudanças.
2. `EventBus` propaga eventos.
3. `CognitiveContextEngine` atualiza o grafo e calcula impacto.
4. `InterceptorLayer` valida código antes de executar.
5. Guardiões executam validações adicionais.
6. Self-healing tenta corrigir falhas simples.

## Configuração

Exemplos de flags em `config/config.json`:

```json
{
  "features": {
    "enableProactiveLayer": true
  },
  "proactive": {
    "eventBus": { "maxListeners": 50 },
    "configWatcher": { "enabled": true, "debounceMs": 500 },
    "fileWatcher": {
      "rootPath": ".",
      "ignore": ["**/node_modules/**", "**/.git/**", "**/data/**", "**/logs/**"],
      "debounceMs": 300
    },
    "interceptor": {
      "minScore": 70,
      "layers": ["syntax", "structure", "security", "bestPractices"]
    },
    "guardians": { "enabled": true },
    "memory": { "limit": 10 },
    "selfHealing": { "maxMutations": 5 }
  }
}
```

## Ferramentas MCP Proativas

- `ultra_analyze_impact` - Retorna impacto de mudanças.
- `ultra_get_agent_memory` - Recupera memórias persistidas de agentes.
- `ultra_run_guardians` - Executa guardiões sobre um código.
- `ultra_self_heal` - Tenta autocorreção com mutações.

## Observabilidade

Todos os componentes registram eventos via `Logger` e enviam sinais para o `EventBus`:

- `file:created`
- `file:changed`
- `file:deleted`
- `validation:failed`
- `config:changed`

## Segurança

- Interceptação pré-execução bloqueia padrões críticos.
- Sandbox isolado limita CPU, memória e rede.
- Guardiões detectam regressões e dependências vulneráveis.
