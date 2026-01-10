# 🔄 Resumo: Atualizar Cursor após Mudanças no Projeto

## ⚡ Resposta Rápida

**Quando você atualizar o projeto (mover, clonar, etc.), precisa atualizar o arquivo:**

```
~/.cursor/mcp.json
```

**Com os novos caminhos absolutos do projeto.**

---

## 🎯 Método Mais Fácil: Script Automático

```bash
cd /caminho/para/ultra-ia
./scripts/atualizar-cursor-mcp.sh
```

**Pronto!** O script atualiza automaticamente. Depois é só reiniciar o Cursor.

---

## 📝 Método Manual (3 Passos)

### 1. Descobrir Caminho do Projeto
```bash
cd /caminho/para/seu/projeto/ultra-ia
pwd
# Copie o caminho completo
```

### 2. Atualizar ~/.cursor/mcp.json

Edite o arquivo e atualize os caminhos:

```json
{
  "mcpServers": {
    "ultra-system": {
      "command": "node",
      "args": [
        "/SEU/CAMINHO/COMPLETO/ultra-ia/src/mcp/ultra-mcp-server.js"
      ],
      "env": {
        "ULTRA_CONFIG_PATH": "/SEU/CAMINHO/COMPLETO/ultra-ia/config/config.json"
      }
    }
  }
}
```

### 3. Reiniciar Cursor

**IMPORTANTE:** Feche completamente e reabra!

---

## ✅ Verificação

Após reiniciar:
1. `View > Output > MCP`
2. Procure: "Sistema Ultra MCP Server conectado"

---

## 📚 Documentação Completa

Veja `GUIA_ATUALIZACAO_CURSOR.md` para detalhes completos.

---

**Lembre-se: Use sempre caminhos ABSOLUTOS!** ✅
