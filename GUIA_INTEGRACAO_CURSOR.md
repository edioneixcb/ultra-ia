# 🚀 Guia Completo: Usando Ultra-IA em Outros Sistemas com Cursor

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Como Funciona a Integração](#como-funciona-a-integração)
3. [Configuração Inicial](#configuração-inicial)
4. [Usando em Outros Projetos](#usando-em-outros-projetos)
5. [Configuração para Sistemas Diferentes](#configuração-para-sistemas-diferentes)
6. [Ferramentas Disponíveis](#ferramentas-disponíveis)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **Ultra-IA** é um sistema de geração de código usando IA offline que se integra ao **Cursor IDE** via **MCP (Model Context Protocol)**. Ele funciona como um servidor MCP que expõe ferramentas que o Cursor pode usar automaticamente.

### Características Principais

- ✅ **Offline Completo** - Funciona sem internet usando Ollama local
- ✅ **Integração Nativa** - Código inserido automaticamente no Cursor
- ✅ **Contexto Inteligente** - Conhece seu projeto e aprende padrões
- ✅ **Validação Multi-Camadas** - Sintaxe, estrutura, segurança, boas práticas
- ✅ **Execução Isolada** - Docker sandbox para segurança
- ✅ **Knowledge Base Dinâmica** - Aprende com seu código

---

## 🔄 Como Funciona a Integração

### Arquitetura

```
┌─────────────────┐
│   Cursor IDE    │
│  (Editor)       │
└────────┬────────┘
         │
         │ Comando do usuário
         │ (ex: "Gere função para validar email")
         ↓
┌─────────────────────────────────────┐
│   Servidor MCP                      │
│   (ultra-mcp-server.js)             │
│   - Recebe requisições do Cursor    │
│   - Expõe 8 ferramentas MCP        │
└────────┬────────────────────────────┘
         │
         │ Chama UltraSystem
         ↓
┌─────────────────────────────────────┐
│   UltraSystem                       │
│   - RequirementAnalyzer             │
│   - KnowledgeBase                   │
│   - ContextManager                  │
│   - Generator (com RAG)             │
│   - MultiLayerValidator             │
│   - ExecutionSystem (Docker)       │
└────────┬────────────────────────────┘
         │
         │ Retorna código validado
         ↓
┌─────────────────┐
│   Cursor IDE    │
│  (Insere código)│
└─────────────────┘
```

### Fluxo de Execução

1. **Usuário digita comando no Cursor**
   - Exemplo: "Crie uma função para validar CPF em JavaScript"

2. **Cursor detecta necessidade de gerar código**
   - Identifica que precisa usar ferramenta MCP

3. **Cursor chama `ultra_generate_code` via MCP**
   - Envia prompt, linguagem, sessão, etc.

4. **Ultra-IA processa:**
   - Analisa requisitos (`RequirementAnalyzer`)
   - Busca contexto na Knowledge Base (`KnowledgeBase`)
   - Recupera histórico da sessão (`ContextManager`)
   - Gera código com RAG (`HallucinationPreventionGenerator`)
   - Valida em múltiplas camadas (`MultiLayerValidator`)
   - Executa em Docker sandbox (`ExecutionFeedbackSystem`)
   - Refina iterativamente se necessário

5. **Código validado retornado ao Cursor**
   - Cursor insere automaticamente no arquivo

---

## ⚙️ Configuração Inicial

### Passo 1: Instalar Dependências

```bash
cd /home/edioneixcb/projetos/ultra-ia
npm install
```

### Passo 2: Configurar MCP no Cursor

#### Opção A: Usar Script Automático (Recomendado)

```bash
cd /home/edioneixcb/projetos/ultra-ia
chmod +x scripts/atualizar-cursor-mcp.sh
./scripts/atualizar-cursor-mcp.sh
```

O script:
- Detecta automaticamente o caminho do projeto
- Cria/atualiza `~/.cursor/mcp.json`
- Preserva outros servidores MCP existentes
- Valida JSON gerado

#### Opção B: Configuração Manual

Edite `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ultra-system": {
      "command": "node",
      "args": [
        "/home/edioneixcb/projetos/ultra-ia/src/mcp/ultra-mcp-server.js"
      ],
      "env": {
        "ULTRA_CONFIG_PATH": "/home/edioneixcb/projetos/ultra-ia/config/config.json"
      }
    }
  }
}
```

**Importante:** Use caminhos **absolutos** completos!

### Passo 3: Verificar Configuração

```bash
# Verificar se arquivos existem
ls -la /home/edioneixcb/projetos/ultra-ia/src/mcp/ultra-mcp-server.js
ls -la /home/edioneixcb/projetos/ultra-ia/config/config.json

# Testar servidor MCP manualmente
cd /home/edioneixcb/projetos/ultra-ia
node src/mcp/ultra-mcp-server.js
# Deve aparecer: "Sistema Ultra MCP Server conectado ao Cursor"
```

### Passo 4: Reiniciar Cursor

1. **Feche COMPLETAMENTE o Cursor** (não apenas a janela)
2. **Reabra o Cursor**
3. **Verifique conexão:**
   - `View > Output`
   - Selecione "MCP" no dropdown
   - Procure por: "Sistema Ultra MCP Server conectado"

---

## 📁 Usando em Outros Projetos

### Cenário: Trabalhar em Projeto Diferente

O Ultra-IA pode ser usado em **qualquer projeto** aberto no Cursor. Ele funciona de forma **global** - uma vez configurado, está disponível em todos os projetos.

### Como Funciona

1. **Ultra-IA é um servidor MCP global**
   - Configurado uma vez em `~/.cursor/mcp.json`
   - Disponível em todos os projetos abertos no Cursor

2. **Knowledge Base por projeto (opcional)**
   - Você pode indexar cada projeto separadamente
   - Use `ultra_index_codebase` com o caminho do projeto
   - Cada projeto terá sua própria Knowledge Base

3. **Contexto por sessão**
   - Cada projeto pode ter sua própria sessão
   - Use `sessionId` diferente para cada projeto
   - Padrão: `cursor-session` (compartilhado)

### Exemplo: Trabalhar em Múltiplos Projetos

```javascript
// Projeto A: Frontend React
// No Cursor, digite:
"Indexe este projeto para a Knowledge Base"
// Sistema indexa: /home/usuario/projetos/frontend-react

// Projeto B: Backend Node.js
// No Cursor, digite:
"Indexe este projeto para a Knowledge Base"
// Sistema indexa: /home/usuario/projetos/backend-node

// Agora ao gerar código:
// Sistema busca padrões do projeto atual automaticamente
```

---

## 🔧 Configuração para Sistemas Diferentes

### Como o Ultra-IA se Adapta a Diferentes Sistemas

O Ultra-IA é **genérico** e se adapta automaticamente a diferentes sistemas através de:

#### 1. **Knowledge Base Dinâmica**

Cada projeto pode ter sua própria Knowledge Base:

```bash
# Indexar projeto específico
"Indexe o codebase atual para a Knowledge Base"

# O sistema:
# - Escaneia todos os arquivos do projeto
# - Extrai funções, classes, padrões
# - Armazena na Knowledge Base
# - Usa como referência para geração futura
```

#### 2. **Context Manager por Sessão**

Contexto é mantido por sessão:

```javascript
// Sessão "projeto-frontend"
sessionId: "projeto-frontend"
// Mantém contexto específico do frontend

// Sessão "projeto-backend"
sessionId: "projeto-backend"
// Mantém contexto específico do backend
```

#### 3. **Configuração Flexível**

O arquivo `config/config.json` permite configurar:

```json
{
  "paths": {
    "knowledgeBase": "/caminho/personalizado/knowledge-base",
    "context": "/caminho/personalizado/context"
  },
  "models": {
    "primary": "deepseek-coder:6.7b",
    "secondary": "llama3.1:8b"
  },
  "execution": {
    "docker": {
      "enabled": true,
      "image": "node:18-alpine"  // Pode mudar para python, etc.
    }
  }
}
```

#### 4. **Detecção Automática de Linguagem**

O sistema detecta automaticamente:
- Linguagem do arquivo atual no Cursor
- Padrões do projeto (arquitetura, estilo)
- Convenções de nomenclatura
- Estrutura de pastas

### Configuração para Projetos Específicos

#### Projeto Python

```json
{
  "execution": {
    "docker": {
      "image": "python:3.11-alpine"
    }
  },
  "models": {
    "primary": "deepseek-coder:6.7b"
  }
}
```

#### Projeto TypeScript/React

```json
{
  "execution": {
    "docker": {
      "image": "node:18-alpine"
    }
  },
  "models": {
    "primary": "deepseek-coder:6.7b"
  }
}
```

#### Projeto Go

```json
{
  "execution": {
    "docker": {
      "image": "golang:1.21-alpine"
    }
  }
}
```

---

## 🛠️ Ferramentas Disponíveis

O Ultra-IA expõe **8 ferramentas MCP** que o Cursor pode usar:

### 1. `ultra_generate_code`

**Descrição:** Gera código completo (análise, geração, validação, execução)

**Parâmetros:**
- `prompt` (obrigatório): Descrição do código
- `language` (opcional): javascript, python, typescript (padrão: javascript)
- `sessionId` (opcional): ID da sessão (padrão: "cursor-session")
- `expectedOutput` (opcional): Output esperado para validação
- `maxIterations` (opcional): Máximo de iterações (padrão: 10)

**Exemplo de uso no Cursor:**
```
"Crie uma função para validar email em JavaScript"
```

### 2. `ultra_analyze_requirements`

**Descrição:** Analisa requisitos e identifica ambiguidades

**Parâmetros:**
- `requirements` (obrigatório): Texto dos requisitos

**Exemplo:**
```
"Analise estes requisitos: Criar API REST para gerenciar usuários com autenticação JWT"
```

### 3. `ultra_index_codebase`

**Descrição:** Indexa codebase para Knowledge Base

**Parâmetros:**
- `codebasePath` (obrigatório): Caminho do codebase

**Exemplo:**
```
"Indexe o codebase atual para a Knowledge Base"
```

### 4. `ultra_search_knowledge`

**Descrição:** Busca funções, classes ou padrões na Knowledge Base

**Parâmetros:**
- `query` (obrigatório): Query de busca
- `topK` (opcional): Número máximo de resultados (padrão: 5)

**Exemplo:**
```
"Busque exemplos de função para validar CPF"
```

### 5. `ultra_validate_code`

**Descrição:** Valida código em múltiplas camadas

**Parâmetros:**
- `code` (obrigatório): Código a validar
- `language` (obrigatório): Linguagem do código

**Exemplo:**
```
"Valide este código: [código selecionado]"
```

### 6. `ultra_execute_code`

**Descrição:** Executa código em sandbox isolado (Docker)

**Parâmetros:**
- `code` (obrigatório): Código a executar
- `language` (obrigatório): Linguagem do código
- `expectedOutput` (opcional): Output esperado

**Exemplo:**
```
"Execute este código e verifique o output"
```

### 7. `ultra_get_context`

**Descrição:** Obtém contexto persistente de uma sessão

**Parâmetros:**
- `sessionId` (opcional): ID da sessão (padrão: "cursor-session")
- `maxTokens` (opcional): Máximo de tokens (padrão: 5000)

**Exemplo:**
```
"Mostre o contexto da sessão atual"
```

### 8. `ultra_get_stats`

**Descrição:** Obtém estatísticas do sistema

**Parâmetros:** Nenhum

**Exemplo:**
```
"Mostre estatísticas do sistema Ultra"
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Gerar Função Simples

**No Cursor:**
```
Crie uma função para validar CPF em JavaScript que retorna boolean
```

**O que acontece:**
1. Cursor chama `ultra_generate_code`
2. Ultra-IA gera código validado
3. Executa em Docker sandbox
4. Retorna código pronto
5. Cursor insere no arquivo

**Resultado:**
```javascript
function validateCPF(cpf) {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}
```

### Exemplo 2: Gerar Código com Contexto do Projeto

**No Cursor:**
```
Crie um endpoint REST POST /api/users seguindo os padrões do projeto
```

**O que acontece:**
1. Sistema busca padrões do projeto na Knowledge Base
2. Analisa arquitetura existente
3. Gera código alinhado com padrões
4. Valida segurança e boas práticas
5. Retorna código pronto

### Exemplo 3: Indexar Projeto e Usar Padrões

**Passo 1 - Indexar:**
```
Indexe o codebase atual para a Knowledge Base
```

**Passo 2 - Gerar código:**
```
Crie uma função para buscar usuários seguindo os padrões do projeto
```

**Resultado:** Código gerado segue padrões do projeto indexado

### Exemplo 4: Melhorar Código Existente

**Selecione função no código e digite:**
```
Melhore esta função adicionando tratamento de erros e validação
```

**O que acontece:**
1. Sistema analisa função selecionada
2. Busca padrões similares
3. Gera versão melhorada
4. Valida e testa
5. Substitui função

---

## 🔍 Troubleshooting

### Problema: Cursor não encontra servidor MCP

**Solução:**
1. Verificar se arquivo existe:
   ```bash
   ls -la /home/edioneixcb/projetos/ultra-ia/src/mcp/ultra-mcp-server.js
   ```

2. Verificar `~/.cursor/mcp.json`:
   ```bash
   cat ~/.cursor/mcp.json
   ```

3. Verificar logs do Cursor:
   - `View > Output > MCP`
   - Procurar erros

4. Reiniciar Cursor completamente

### Problema: Erro "Cannot find module"

**Solução:**
```bash
cd /home/edioneixcb/projetos/ultra-ia
npm install
```

### Problema: Docker não disponível

**Solução:**
O sistema usa fallback automático. Para habilitar Docker:

```bash
# Verificar Docker
docker --version

# Se não instalado
sudo apt-get install docker.io
sudo usermod -aG docker $USER
# Reiniciar sessão
```

### Problema: Ollama não está rodando

**Solução:**
```bash
# Verificar Ollama
curl http://localhost:11434/api/tags

# Se não estiver rodando
ollama serve
```

### Problema: Caminhos incorretos após mover projeto

**Solução:**
```bash
# Usar script automático
cd /NOVO/CAMINHO/ultra-ia
./scripts/atualizar-cursor-mcp.sh

# Ou atualizar manualmente ~/.cursor/mcp.json
```

---

## 📚 Recursos Adicionais

- [COMO_USAR.md](./COMO_USAR.md) - Guia prático completo
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Documentação da API REST
- [docs/guias/GUIA_ACESSO_USUARIO.md](./docs/guias/GUIA_ACESSO_USUARIO.md) - Guia de acesso
- [docs/guias/GUIA_ATUALIZACAO_CURSOR.md](./docs/guias/GUIA_ATUALIZACAO_CURSOR.md) - Atualização do Cursor

---

## ✅ Checklist de Configuração

- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor MCP configurado em `~/.cursor/mcp.json`
- [ ] Caminhos absolutos corretos no `mcp.json`
- [ ] Ollama rodando (`ollama serve`)
- [ ] Docker disponível (opcional, mas recomendado)
- [ ] Cursor reiniciado completamente
- [ ] Conexão MCP verificada (`View > Output > MCP`)
- [ ] Teste básico realizado ("Gere função simples")

---

**Pronto para usar! 🚀**

O Ultra-IA está configurado e pronto para ser usado em qualquer projeto no Cursor. Basta digitar comandos normais e o sistema detectará automaticamente quando usar as ferramentas MCP.
