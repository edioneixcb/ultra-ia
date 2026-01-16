# Guia: Adicionar Novo Provedor de IA

## Pre-requisitos

- API key do provedor
- Conhecimento basico de LiteLLM
- Acesso ao arquivo de configuracao

## Resultado Final

Novo provedor de IA disponivel para uso no Ultra-IDE.

## Passo 1: Configurar LiteLLM

### config/litellm.yaml

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
      
  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-3-5-sonnet
      api_key: os.environ/ANTHROPIC_API_KEY
      
  # Novo provedor
  - model_name: novo-provedor-modelo
    litellm_params:
      model: novo-provedor/modelo
      api_key: os.environ/NOVO_PROVEDOR_API_KEY
      api_base: https://api.novo-provedor.com/v1
```

## Passo 2: Adicionar ao Frontend

### packages/ui/src/ai/providers.ts

```typescript
export const AI_PROVIDERS = {
  'gpt-4o': {
    name: 'GPT-4o',
    provider: 'openai'
  },
  'claude-sonnet': {
    name: 'Claude Sonnet',
    provider: 'anthropic'
  },
  'novo-provedor-modelo': {
    name: 'Novo Provedor',
    provider: 'novo-provedor'
  }
} as const;
```

## Passo 3: Configurar Variavel de Ambiente

### .env

```bash
NOVO_PROVEDOR_API_KEY=your-api-key-here
```

## Passo 4: Testar

1. Iniciar LiteLLM proxy
2. Abrir chat no Ultra-IDE
3. Selecionar novo provedor
4. Enviar mensagem
5. Verificar resposta

## Checklist de Validacao

- [ ] LiteLLM configurado corretamente
- [ ] API key configurada
- [ ] Provedor aparece na lista
- [ ] Requisicoes funcionam
- [ ] Respostas sao recebidas
- [ ] Erros tratados adequadamente

## Troubleshooting

### Problema: Provedor nao aparece

**Verificar**: Configuracao do LiteLLM esta correta

**Solucao**: Verificar logs do LiteLLM proxy

### Problema: Erro de autenticacao

**Verificar**: API key esta correta e variavel de ambiente configurada

**Solucao**: Verificar .env e reiniciar servico

### Problema: Timeout

**Verificar**: API base URL esta correta

**Solucao**: Verificar conectividade e URL do provedor
