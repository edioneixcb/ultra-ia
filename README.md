# Sistema Ultra - IA Offline para Geração de Código

Sistema completo de geração de código usando IA offline, com integração nativa ao Cursor IDE via MCP (Model Context Protocol).

## 🚀 Características Principais

- ✅ **IA Offline Completa** - Funciona sem internet usando Ollama local
- ✅ **Integração Cursor IDE** - Via MCP para uso direto no editor
- ✅ **API REST Completa** - Interface web e API para integração
- ✅ **Validação Multi-Camadas** - Sintaxe, estrutura, segurança, boas práticas
- ✅ **Execução Isolada** - Docker sandbox para execução segura
- ✅ **Knowledge Base Dinâmica** - Aprende com seu código
- ✅ **Context Manager** - Mantém contexto entre sessões
- ✅ **Prevenção de Alucinações** - RAG e validação cruzada multi-modelo
- ✅ **Camada Proativa** - Interceptação e análise antes da execução
- ✅ **Guardiões Preditivos** - Detecção de regressões e riscos

## 📁 Estrutura do Projeto

```
ultra-ia/
├── src/
│   ├── api/              # API REST e interface web
│   ├── components/       # Componentes principais
│   ├── cognitive/         # Motor cognitivo e knowledge graph
│   ├── guardians/         # Guardiões preditivos
│   ├── healing/           # Self-healing e mutações
│   ├── infrastructure/    # Infraestrutura proativa
│   ├── memory/            # Memória persistente de agentes
│   ├── proactive/         # Interceptação e monitoramento
│   ├── systems/          # Sistemas de integração
│   ├── utils/            # Utilitários
│   └── mcp/              # Servidor MCP para Cursor
├── config/               # Configurações
├── data/                 # Dados (Knowledge Base, Context)
├── tests/                # Testes
├── scripts/              # Scripts utilitários
└── examples/             # Exemplos de uso
```

## 🛠️ Instalação

```bash
# Clonar repositório
git clone https://github.com/edioneixcb/ultra-ia.git
cd ultra-ia

# Instalar dependências
npm install

# Configurar (editar config/config.json se necessário)
cp config/config.json.example config/config.json
```

## 🚀 Uso

### Interface Web

```bash
npm run api
# Acesse http://localhost:3000
```

### Cursor IDE (Recomendado)

1. O servidor MCP já está configurado em `~/.cursor/mcp.json`
2. Reinicie o Cursor
3. Use comandos normais - o sistema detecta automaticamente

### API REST

```bash
# Gerar código
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Criar função para validar email", "language": "javascript"}'
```

## 📚 Documentação

- [COMO_USAR.md](./COMO_USAR.md) - Guia prático completo
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Documentação da API
- [docs/PROACTIVE_LAYER.md](./docs/PROACTIVE_LAYER.md) - Camada proativa e MCP inteligente
- [docs/guias/GUIA_ACESSO_USUARIO.md](./docs/guias/GUIA_ACESSO_USUARIO.md) - Como acessar e usar
- [docs/validacoes/VALIDACAO_MCP.md](./docs/validacoes/VALIDACAO_MCP.md) - Validação do servidor MCP

## 🧪 Testes

```bash
# Todos os testes
npm test

# Testes de integração
npm run test:integration

# Testar servidor MCP
node scripts/test-mcp-server.js
```

## 🔧 Configuração

### Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
# Edite .env com suas configurações
```

Variáveis principais:
- `NODE_ENV` - Ambiente (development/production)
- `PORT` - Porta do servidor API
- `OLLAMA_URL` - URL do servidor Ollama
- `API_AUTH_ENABLED` - Habilitar autenticação (recomendado em produção)
- `API_KEY` - Chave de API para autenticação

### Arquivo de Configuração

Edite `config/config.json` para:
- Configurar modelos Ollama
- Ajustar timeouts
- Configurar Docker
- Definir paths
- Configurar rate limiting
- E mais...

## 📦 Componentes Principais

- **RequirementAnalyzer** - Analisa e valida requisitos
- **DynamicKnowledgeBase** - Indexa e busca código
- **PersistentContextManager** - Gerencia contexto hierárquico
- **HallucinationPreventionGenerator** - Gera código com RAG
- **MultiLayerValidator** - Valida em múltiplas camadas
- **ExecutionFeedbackSystem** - Executa em sandbox Docker
- **UltraSystem** - Orquestrador principal

## 🔒 Segurança

- Execução isolada em Docker
- Validação de segurança antes de executar
- Rate limiting na API
- Autenticação via API Key (opcional)
- Sanitização de entrada

## 📊 Status

✅ **Todas as funcionalidades implementadas e testadas**

- ✅ Fase 1: Correções críticas (4/4)
- ✅ Fase 2: Robustez (4/4)
- ✅ Fase 3: Segurança (4/4)
- ✅ Fase 4: Performance (4/4)
- ✅ Integração MCP (8 ferramentas)
- ✅ API REST completa
- ✅ Interface web

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas!

## 📄 Licença

MIT

## 🙏 Agradecimentos

- Ollama - Modelos LLM locais
- Cursor IDE - Suporte a MCP
- Comunidade open source

---

**Desenvolvido com ❤️ para desenvolvimento offline produtivo**
