# ADR-006: Escolha do LiteLLM sobre OpenRouter

## Status
Aceita

## Contexto
Precisamos de gateway unificado para acessar multiplos provedores de IA (OpenAI, Anthropic, Gemini, Ollama, etc).

## Decisao
Escolhemos LiteLLM como gateway de IA.

## Justificativa

### Self-hosted
- Controle total sobre dados
- Sem dependencia de servico externo
- Compliance e privacidade
- Customizavel

### Multi-provider
- Suporta 100+ provedores
- API OpenAI-compativel
- Facil adicionar novos provedores
- Routing e fallback inteligente

### Features
- Rate limiting
- Budget tracking
- Observability
- Caching

## Alternativas Consideradas

1. **OpenRouter**
   - Pros: Hosted, sem manutencao, facil setup
   - Contras: Dados passam por servico externo, menos controle
   - Decisao: Rejeitado por privacidade e controle

2. **Portkey**
   - Pros: Hosted, features enterprise
   - Contras: Dados externos, menos controle
   - Decisao: Rejeitado por privacidade

## Consequencias

### Positivas
- Controle total
- Privacidade garantida
- Customizavel
- Sem dependencia externa

### Negativas
- Requer manutencao propria
- Precisa hospedar servico
- Setup inicial mais complexo

## Reversibilidade
ALTA - Gateway e isolado, pode trocar implementacao facilmente.

## Referencias
- [LiteLLM](https://docs.litellm.ai/)
- [OpenRouter](https://openrouter.ai/)
- [Portkey](https://docs.portkey.ai/)
