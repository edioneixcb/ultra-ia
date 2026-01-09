# Guia de Acesso e Uso do Sistema Ultra IA Offline

## 📱 ACESSO PELA WEB

### Como Acessar

1. **Iniciar o servidor da API:**
   ```bash
   cd /home/edioneixcb/sistema-ultra-ia
   npm run api
   ```

2. **Abrir no navegador:**
   ```
   http://localhost:3000
   ```

### Interface Web - Funcionalidades

A interface web (`src/public/index.html`) oferece:

#### 1. **Geração de Código**
- Campo de prompt para descrever o código desejado
- Seleção de linguagem (JavaScript, Python, TypeScript)
- ID de sessão para manter contexto
- Output esperado (opcional) para validação
- Botão "Gerar Código" que:
  - Valida entrada
  - Envia requisição para `/api/generate`
  - Exibe código gerado com formatação
  - Mostra estatísticas (iterações, duração, score de validação)
  - Exibe output da execução (se houver)

#### 2. **Estatísticas do Sistema**
- Funções indexadas na Knowledge Base
- Classes indexadas
- Taxa de sucesso das execuções
- Total de execuções realizadas
- Atualização automática após cada geração

### Melhorias Futuras da Interface Web

- Histórico de gerações por sessão
- Visualização de código com syntax highlighting
- Editor de código integrado
- Testes interativos
- Dashboard de métricas em tempo real
- Gerenciamento de projetos
- Exportação de código gerado

---

## 💻 USO NO CURSOR IDE (VIA MCP)

### O que é MCP?

MCP (Model Context Protocol) permite que o Cursor acesse ferramentas e serviços locais diretamente, sem necessidade de internet.

### Servidor MCP do Sistema Ultra

O Sistema Ultra será acessível no Cursor através de um servidor MCP que expõe todas as funcionalidades do sistema como ferramentas que o Cursor pode usar automaticamente.

### Ferramentas Disponíveis no Cursor

Quando o servidor MCP estiver configurado, você poderá usar comandos como:

1. **"Gere uma função para validar email em JavaScript"**
   - O Cursor usará automaticamente o Sistema Ultra
   - O código será gerado, validado e executado
   - O resultado será inserido no seu arquivo

2. **"Crie uma classe Python para gerenciar conexões de banco de dados"**
   - O sistema analisará requisitos
   - Buscará exemplos similares na Knowledge Base
   - Gerará código estruturado e validado
   - Executará testes básicos

3. **"Melhore esta função considerando o contexto do projeto"**
   - O sistema usará o contexto persistente
   - Buscará padrões do projeto na Knowledge Base
   - Gerará código alinhado com o estilo do projeto

### Como Funciona a Integração

```
Cursor IDE
    ↓ (comando do usuário)
Servidor MCP Sistema Ultra
    ↓
UltraSystem.process()
    ↓
1. RequirementAnalyzer → Analisa requisitos
2. KnowledgeBase → Busca contexto relevante
3. ContextManager → Recupera histórico da sessão
4. Generator → Gera código com RAG
5. Validator → Valida em múltiplas camadas
6. ExecutionSystem → Executa em Docker (isolado)
7. Refinement → Refina iterativamente se necessário
    ↓
Código validado e testado retornado ao Cursor
```

---

## 🔧 CONFIGURAÇÃO DO SERVIDOR MCP

### Arquivo de Configuração

O servidor MCP será adicionado ao `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ultra-system": {
      "command": "node",
      "args": [
        "/home/edioneixcb/sistema-ultra-ia/src/mcp/ultra-mcp-server.js"
      ],
      "env": {
        "ULTRA_CONFIG_PATH": "/home/edioneixcb/sistema-ultra-ia/config/config.json"
      }
    }
  }
}
```

### Ferramentas Expostas

O servidor MCP exporá as seguintes ferramentas:

1. **`ultra_generate_code`** - Gera código completo
2. **`ultra_analyze_requirements`** - Analisa requisitos
3. **`ultra_index_codebase`** - Indexa codebase para Knowledge Base
4. **`ultra_search_knowledge`** - Busca na Knowledge Base
5. **`ultra_validate_code`** - Valida código existente
6. **`ultra_execute_code`** - Executa código em sandbox
7. **`ultra_get_context`** - Obtém contexto da sessão
8. **`ultra_get_stats`** - Obtém estatísticas do sistema

---

## 📋 FLUXO DE USO TÍPICO

### Cenário 1: Geração Simples no Cursor

1. Você digita no Cursor: *"Crie uma função para validar CPF em JavaScript"*
2. O Cursor detecta que precisa gerar código
3. Chama automaticamente `ultra_generate_code` via MCP
4. O Sistema Ultra:
   - Analisa o requisito
   - Busca exemplos similares
   - Gera código validado
   - Executa e testa
   - Retorna código pronto
5. O Cursor insere o código no seu arquivo

### Cenário 2: Melhoria de Código Existente

1. Você seleciona uma função no código
2. Digita: *"Melhore esta função seguindo os padrões do projeto"*
3. O Sistema Ultra:
   - Indexa o codebase atual (se necessário)
   - Busca padrões similares
   - Analisa a função selecionada
   - Gera versão melhorada
   - Valida e testa
4. O Cursor substitui a função pela versão melhorada

### Cenário 3: Geração com Contexto

1. Você está trabalhando em um projeto
2. Digita: *"Crie um endpoint REST para listar usuários"*
3. O Sistema Ultra:
   - Usa contexto da sessão atual
   - Busca padrões do projeto (arquitetura, estilo)
   - Gera código alinhado com o projeto
   - Valida segurança e boas práticas
   - Executa testes básicos
4. Código gerado segue os padrões do seu projeto

---

## 🎯 VANTAGENS DO USO NO CURSOR

### 1. Integração Nativa
- Funciona diretamente no editor
- Sem necessidade de copiar/colar código
- Contexto automático do projeto

### 2. Offline Completo
- Funciona sem internet
- Usa modelos locais (Ollama)
- Processa tudo localmente

### 3. Contexto Inteligente
- Conhece seu código
- Aprende padrões do projeto
- Mantém histórico de sessões

### 4. Validação Automática
- Código validado antes de inserir
- Execução automática em sandbox
- Feedback imediato

### 5. Segurança
- Execução isolada em Docker
- Validação de segurança
- Sem risco de código malicioso

---

## 🚀 PRÓXIMOS PASSOS

1. **Criar servidor MCP** (`src/mcp/ultra-mcp-server.js`)
2. **Configurar no Cursor** (`~/.cursor/mcp.json`)
3. **Testar integração** no Cursor
4. **Melhorar interface web** com mais funcionalidades
5. **Documentar uso avançado**

---

## 📝 NOTAS IMPORTANTES

- A interface web é útil para testes e demonstrações
- O uso no Cursor é a forma principal de uso (mais produtiva)
- Ambos os métodos usam a mesma API REST interna
- O contexto é compartilhado entre sessões
- A Knowledge Base aprende continuamente
