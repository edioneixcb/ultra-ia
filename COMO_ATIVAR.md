# 🚀 Como Ativar o Ultra-IA no Cursor

## ✅ Status Atual

Verificação realizada:
- ✅ Servidor MCP configurado em `~/.cursor/mcp.json`
- ✅ Arquivos do Ultra-IA presentes
- ✅ Ollama rodando com modelos disponíveis
- ✅ Docker habilitado na configuração

## 🎯 Passos para Ativar

### Passo 1: Verificar Pré-requisitos

```bash
# 1. Verificar se Ollama está rodando
curl http://localhost:11434/api/tags

# Se não estiver rodando, inicie:
ollama serve
```

### Passo 2: Reiniciar o Cursor

**IMPORTANTE:** O Cursor precisa ser reiniciado completamente para carregar a configuração MCP.

1. **Feche TODAS as janelas do Cursor**
   - Não apenas minimizar
   - Feche completamente o aplicativo

2. **Reabra o Cursor**

### Passo 3: Verificar Conexão MCP

1. No Cursor, vá em: **View > Output**
2. No dropdown, selecione: **"MCP"**
3. Procure por: **"Sistema Ultra MCP Server conectado ao Cursor"**

Se aparecer essa mensagem, está funcionando! ✅

### Passo 4: Testar Funcionalidade

No Cursor, digite um comando simples:

```
Gere uma função para validar email em JavaScript
```

Se o Ultra-IA estiver ativo, ele:
- Analisará o requisito
- Gerará código validado
- Executará em sandbox
- Retornará código pronto

## 🔧 Se Não Funcionar

### Problema: Não aparece "Sistema Ultra MCP Server conectado"

**Solução 1: Verificar configuração**

```bash
# Verificar se caminhos estão corretos
cat ~/.cursor/mcp.json | grep ultra-system -A 5

# Deve mostrar:
# "ultra-system": {
#   "command": "node",
#   "args": [
#     "/caminho/para/seu/projeto/ultra-ia/src/mcp/ultra-mcp-server.js"
#   ],
```

**Solução 2: Atualizar configuração**

```bash
cd /caminho/para/seu/projeto/ultra-ia
chmod +x scripts/atualizar-cursor-mcp.sh
./scripts/atualizar-cursor-mcp.sh
```

Depois reinicie o Cursor novamente.

**Solução 3: Testar servidor MCP manualmente**

```bash
cd /caminho/para/seu/projeto/ultra-ia
node src/mcp/ultra-mcp-server.js
```

Se aparecer erro, verifique:
- Dependências instaladas: `npm install`
- Node.js versão: `node --version` (deve ser 18+)

### Problema: Erro "Cannot find module"

```bash
cd /caminho/para/seu/projeto/ultra-ia
npm install
```

### Problema: Ollama não está rodando

```bash
# Iniciar Ollama
ollama serve

# Em outro terminal, verificar modelos
ollama list

# Se não tiver os modelos necessários:
ollama pull deepseek-coder:6.7b
ollama pull llama3.1:8b
```

## 📋 Checklist Rápido

- [ ] Ollama rodando (`curl http://localhost:11434/api/tags`)
- [ ] Dependências instaladas (`npm install` no diretório do projeto)
- [ ] Configuração MCP atualizada (`./scripts/atualizar-cursor-mcp.sh`)
- [ ] Cursor reiniciado completamente
- [ ] Conexão MCP verificada (`View > Output > MCP`)
- [ ] Teste básico realizado

## 🎉 Pronto!

Uma vez ativado, o Ultra-IA estará disponível em **todos os projetos** abertos no Cursor.

### Comandos Úteis para Testar

```
# Gerar código simples
Gere uma função para validar CPF em JavaScript

# Indexar projeto atual
Indexe este projeto para a Knowledge Base

# Buscar padrões
Busque exemplos de função para validar email

# Ver estatísticas
Mostre estatísticas do sistema Ultra
```

## 📚 Mais Informações

- [GUIA_INTEGRACAO_CURSOR.md](./GUIA_INTEGRACAO_CURSOR.md) - Guia completo de integração
- [COMO_USAR.md](./COMO_USAR.md) - Guia de uso geral

---

**Dica:** Se ainda tiver problemas, verifique os logs do Cursor em `View > Output > MCP` para ver mensagens de erro detalhadas.
