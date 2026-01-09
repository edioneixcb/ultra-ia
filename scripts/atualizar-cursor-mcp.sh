#!/bin/bash
# Script para atualizar configuração MCP do Cursor automaticamente
# Uso: ./scripts/atualizar-cursor-mcp.sh

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔄 Atualizando Configuração MCP do Cursor"
echo "=========================================="
echo ""

# Obter caminho do projeto (diretório onde está o script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_PATH="$(cd "$SCRIPT_DIR/.." && pwd)"

MCP_SERVER="$PROJECT_PATH/src/mcp/ultra-mcp-server.js"
CONFIG_FILE="$PROJECT_PATH/config/config.json"
CURSOR_MCP_CONFIG="$HOME/.cursor/mcp.json"
CURSOR_DIR="$HOME/.cursor"

# Verificar se está no diretório correto
if [ ! -f "$MCP_SERVER" ]; then
    echo -e "${RED}❌ Erro: Arquivo servidor MCP não encontrado${NC}"
    echo "   Esperado em: $MCP_SERVER"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Erro: Arquivo de configuração não encontrado${NC}"
    echo "   Esperado em: $CONFIG_FILE"
    exit 1
fi

echo -e "${GREEN}✅ Arquivos encontrados:${NC}"
echo "   Projeto: $PROJECT_PATH"
echo "   Servidor MCP: $MCP_SERVER"
echo "   Config: $CONFIG_FILE"
echo ""

# Criar diretório .cursor se não existir
if [ ! -d "$CURSOR_DIR" ]; then
    echo -e "${YELLOW}📁 Criando diretório ~/.cursor${NC}"
    mkdir -p "$CURSOR_DIR"
fi

# Backup da configuração atual se existir
if [ -f "$CURSOR_MCP_CONFIG" ]; then
    BACKUP_FILE="${CURSOR_MCP_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}💾 Fazendo backup: $BACKUP_FILE${NC}"
    cp "$CURSOR_MCP_CONFIG" "$BACKUP_FILE"
fi

# Ler configuração existente ou criar nova
if [ -f "$CURSOR_MCP_CONFIG" ]; then
    # Tentar preservar outros servidores MCP
    echo -e "${YELLOW}📝 Atualizando configuração existente${NC}"
    
    # Usar Node.js para atualizar JSON (mais seguro)
    node << EOF
const fs = require('fs');
const path = require('path');

const configPath = '$CURSOR_MCP_CONFIG';
const mcpServerPath = '$MCP_SERVER';
const configFilePath = '$CONFIG_FILE';

let config = {};
if (fs.existsSync(configPath)) {
    try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
        console.error('Erro ao ler config existente, criando nova');
        config = { mcpServers: {} };
    }
} else {
    config = { mcpServers: {} };
}

// Atualizar ou adicionar ultra-system
config.mcpServers['ultra-system'] = {
    command: 'node',
    args: [mcpServerPath],
    env: {
        ULTRA_CONFIG_PATH: configFilePath
    }
};

// Salvar
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ Configuração atualizada com sucesso');
EOF

else
    # Criar nova configuração
    echo -e "${YELLOW}📝 Criando nova configuração${NC}"
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
fi

echo ""
echo -e "${GREEN}✅ Configuração MCP atualizada!${NC}"
echo ""
echo "📋 Detalhes:"
echo "   Servidor: $MCP_SERVER"
echo "   Config: $CONFIG_FILE"
echo "   Arquivo MCP: $CURSOR_MCP_CONFIG"
echo ""
echo -e "${YELLOW}🔄 PRÓXIMO PASSO:${NC}"
echo "   1. Feche COMPLETAMENTE o Cursor"
echo "   2. Reabra o Cursor"
echo "   3. Verifique: View > Output > MCP"
echo "   4. Procure por: 'Sistema Ultra MCP Server conectado'"
echo ""

# Validar JSON
if command -v python3 &> /dev/null; then
    if python3 -m json.tool "$CURSOR_MCP_CONFIG" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ JSON válido${NC}"
    else
        echo -e "${RED}❌ Erro: JSON inválido${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✨ Pronto! Reinicie o Cursor para aplicar mudanças.${NC}"
