# 🔄 Guia de Atualização do Cursor após Mudanças no Projeto

## 📍 Situação

Quando você:
- Clona o projeto em outro diretório
- Move o projeto para outra pasta
- Atualiza o projeto do GitHub
- Trabalha em outra máquina

**O Cursor precisa saber onde está o servidor MCP!**

---

## 🔧 O Que Precisa Ser Atualizado

### Arquivo de Configuração MCP do Cursor

**Localização:**
```
~/.cursor/mcp.json
```

**O que precisa mudar:**
- Caminho do servidor MCP (`args[0]`)
- Caminho da configuração (`env.ULTRA_CONFIG_PATH`)

---

## 📋 Passo a Passo para Atualizar

### Passo 1: Identificar o Novo Caminho do Projeto

```bash
# Descobrir onde está o projeto agora
cd /caminho/para/seu/projeto/ultra-ia
pwd
# Exemplo de saída: /home/usuario/projetos/ultra-ia
```

### Passo 2: Abrir Arquivo de Configuração MCP

```bash
# Abrir no editor
nano ~/.cursor/mcp.json
# ou
code ~/.cursor/mcp.json
```

### Passo 3: Atualizar Caminhos

**ANTES (exemplo):**
```json
{
  "mcpServers": {
    "ultra-system": {
      "command": "node",
      "args": [
        "/home/usuario/projetos/ultra-ia/src/mcp/ultra-mcp-server.js"
      ],
      "env": {
        "ULTRA_CONFIG_PATH": "/home/usuario/projetos/ultra-ia/config/config.json"
      }
    }
  }
}
```

**DEPOIS (com novo caminho):**
```json
{
  "mcpServers": {
    "ultra-system": {
      "command": "node",
      "args": [
        "/NOVO/CAMINHO/COMPLETO/ultra-ia/src/mcp/ultra-mcp-server.js"
      ],
      "env": {
        "ULTRA_CONFIG_PATH": "/NOVO/CAMINHO/COMPLETO/ultra-ia/config/config.json"
      }
    }
  }
}
```

**Substitua `/NOVO/CAMINHO/COMPLETO/ultra-ia` pelo caminho real do seu projeto!**

### Passo 4: Validar Caminhos

```bash
# Verificar se arquivo existe
ls -la /NOVO/CAMINHO/COMPLETO/ultra-ia/src/mcp/ultra-mcp-server.js
ls -la /NOVO/CAMINHO/COMPLETO/ultra-ia/config/config.json

# Testar servidor MCP manualmente
cd /NOVO/CAMINHO/COMPLETO/ultra-ia
node src/mcp/ultra-mcp-server.js
# Deve aparecer: "Sistema Ultra MCP Server conectado ao Cursor"
```

### Passo 5: Reiniciar o Cursor

**IMPORTANTE:** Feche completamente o Cursor e reabra!

1. Feche todas as janelas do Cursor
2. Verifique processos: `ps aux | grep cursor` (se houver, mate-os)
3. Reabra o Cursor

### Passo 6: Verificar Conexão

1. No Cursor: `View > Output`
2. Selecione "MCP" no dropdown
3. Procure por: "Sistema Ultra MCP Server conectado ao Cursor"

---

## 🛠️ Script Automático de Atualização

Crie este script para facilitar:

```bash
#!/bin/bash
# atualizar-cursor-mcp.sh

PROJECT_PATH=$(pwd)
MCP_SERVER="$PROJECT_PATH/src/mcp/ultra-mcp-server.js"
CONFIG_FILE="$PROJECT_PATH/config/config.json"
CURSOR_MCP_CONFIG="$HOME/.cursor/mcp.json"

# Verificar se está no diretório correto
if [ ! -f "$MCP_SERVER" ]; then
    echo "❌ Erro: Execute este script dentro do diretório ultra-ia"
    exit 1
fi

# Backup da configuração atual
cp "$CURSOR_MCP_CONFIG" "$CURSOR_MCP_CONFIG.backup"

# Criar nova configuração
cat > "$CURSOR_MCP_CONFIG" << EOF
{
  "mcpServers": {
    "ultra-system": {
      "command": "node",
      "args": [
        "$MCP_SERVER"
      ],
      "env": {
        "ULTRA_CONFIG_PATH": "$CONFIG_FILE"
      }
    }
  }
}
EOF

echo "✅ Configuração MCP atualizada!"
echo "📁 Caminho do servidor: $MCP_SERVER"
echo "📁 Caminho da config: $CONFIG_FILE"
echo ""
echo "🔄 Próximo passo: REINICIE O CURSOR completamente"
```

**Como usar:**
```bash
cd /caminho/para/ultra-ia
chmod +x atualizar-cursor-mcp.sh
./atualizar-cursor-mcp.sh
```

---

## 🔍 Verificação Rápida

### Checklist de Validação

- [ ] Caminho do projeto identificado
- [ ] Arquivo `src/mcp/ultra-mcp-server.js` existe
- [ ] Arquivo `config/config.json` existe
- [ ] `~/.cursor/mcp.json` atualizado com caminhos corretos
- [ ] Cursor reiniciado completamente
- [ ] Logs MCP mostram "Sistema Ultra MCP Server conectado"

### Comando de Verificação Rápida

```bash
# Verificar configuração atual
cat ~/.cursor/mcp.json | grep -A 5 "ultra-system"

# Verificar se arquivos existem
PROJECT_PATH=$(cat ~/.cursor/mcp.json | grep "ultra-mcp-server.js" | cut -d'"' -f4 | xargs dirname | xargs dirname | xargs dirname)
echo "Caminho do projeto: $PROJECT_PATH"
ls -la "$PROJECT_PATH/src/mcp/ultra-mcp-server.js"
ls -la "$PROJECT_PATH/config/config.json"
```

---

## 🌐 Cenários Comuns

### Cenário 1: Clonou do GitHub em Outro Lugar

```bash
# 1. Clonar
cd ~/projetos
git clone https://github.com/edioneixcb/ultra-ia.git
cd ultra-ia
npm install

# 2. Atualizar configuração MCP
nano ~/.cursor/mcp.json
# Atualizar caminhos para: /home/usuario/projetos/ultra-ia

# 3. Reiniciar Cursor
```

### Cenário 2: Moveu o Projeto

```bash
# 1. Mover projeto
mv /caminho/antigo/ultra-ia /caminho/novo/ultra-ia

# 2. Atualizar configuração MCP
nano ~/.cursor/mcp.json
# Atualizar caminhos para: /caminho/para/seu/projeto/ultra-ia

# 3. Reiniciar Cursor
```

### Cenário 3: Trabalhando em Outra Máquina

```bash
# 1. Clonar do GitHub
git clone https://github.com/edioneixcb/ultra-ia.git
cd ultra-ia
npm install

# 2. Criar/atualizar configuração MCP
mkdir -p ~/.cursor
cat > ~/.cursor/mcp.json << EOF
{
  "mcpServers": {
    "ultra-system": {
      "command": "node",
      "args": [
        "$(pwd)/src/mcp/ultra-mcp-server.js"
      ],
      "env": {
        "ULTRA_CONFIG_PATH": "$(pwd)/config/config.json"
      }
    }
  }
}
EOF

# 3. Reiniciar Cursor
```

---

## ⚠️ Problemas Comuns

### Problema: Cursor não encontra servidor MCP

**Solução:**
1. Verificar caminhos absolutos (não relativos)
2. Verificar permissões: `chmod +x src/mcp/ultra-mcp-server.js`
3. Verificar se Node.js está no PATH
4. Verificar logs do Cursor: `View > Output > MCP`

### Problema: Erro "Cannot find module"

**Solução:**
```bash
cd /caminho/para/ultra-ia
npm install
```

### Problema: Configuração não atualiza

**Solução:**
1. Fechar Cursor completamente (verificar processos)
2. Verificar JSON válido: `cat ~/.cursor/mcp.json | python3 -m json.tool`
3. Reabrir Cursor

---

## 📝 Resumo Rápido

**Quando atualizar o projeto:**

1. ✅ Identificar novo caminho do projeto
2. ✅ Atualizar `~/.cursor/mcp.json` com caminhos absolutos
3. ✅ Validar que arquivos existem
4. ✅ **REINICIAR CURSOR COMPLETAMENTE**
5. ✅ Verificar logs MCP

**Fórmula:**
```
Novo Caminho do Projeto = /caminho/completo/ultra-ia
Servidor MCP = /caminho/completo/ultra-ia/src/mcp/ultra-mcp-server.js
Config = /caminho/completo/ultra-ia/config/config.json
```

---

## 🎯 Dica Pro

Use variáveis de ambiente ou script para automatizar:

```bash
# Adicionar ao .bashrc ou .zshrc
export ULTRA_IA_PATH="$HOME/projetos/ultra-ia"

# Usar no mcp.json (se Cursor suportar variáveis)
"args": ["${ULTRA_IA_PATH}/src/mcp/ultra-mcp-server.js"]
```

**Ou crie um script wrapper que sempre resolve o caminho corretamente!**

---

**Lembre-se: Sempre use caminhos ABSOLUTOS no mcp.json!** ✅
