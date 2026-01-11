#!/bin/bash
# Script para verificar se Ultra-IA está pronto para ativação

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Verificando Status do Ultra-IA"
echo "=================================="
echo ""

PROJECT_PATH="/home/edioneixcb/projetos/ultra-ia"
MCP_SERVER="$PROJECT_PATH/src/mcp/ultra-mcp-server.js"
CONFIG_FILE="$PROJECT_PATH/config/config.json"
CURSOR_MCP_CONFIG="$HOME/.cursor/mcp.json"

# Verificar arquivos
echo "📁 Verificando arquivos..."
if [ -f "$MCP_SERVER" ]; then
    echo -e "${GREEN}✅ Servidor MCP encontrado${NC}"
else
    echo -e "${RED}❌ Servidor MCP não encontrado${NC}"
    exit 1
fi

if [ -f "$CONFIG_FILE" ]; then
    echo -e "${GREEN}✅ Config encontrado${NC}"
else
    echo -e "${RED}❌ Config não encontrado${NC}"
    exit 1
fi

# Verificar configuração MCP
echo ""
echo "⚙️  Verificando configuração MCP..."
if [ -f "$CURSOR_MCP_CONFIG" ]; then
    if grep -q "ultra-system" "$CURSOR_MCP_CONFIG"; then
        echo -e "${GREEN}✅ Ultra-IA configurado no mcp.json${NC}"
        
        # Verificar caminhos
        if grep -q "$PROJECT_PATH" "$CURSOR_MCP_CONFIG"; then
            echo -e "${GREEN}✅ Caminhos corretos${NC}"
        else
            echo -e "${YELLOW}⚠️  Caminhos podem estar incorretos${NC}"
        fi
    else
        echo -e "${RED}❌ Ultra-IA não encontrado no mcp.json${NC}"
        echo "   Execute: ./scripts/atualizar-cursor-mcp.sh"
        exit 1
    fi
else
    echo -e "${RED}❌ Arquivo mcp.json não encontrado${NC}"
    echo "   Execute: ./scripts/atualizar-cursor-mcp.sh"
    exit 1
fi

# Verificar JSON válido
if python3 -m json.tool "$CURSOR_MCP_CONFIG" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ JSON válido${NC}"
else
    echo -e "${RED}❌ JSON inválido${NC}"
    exit 1
fi

# Verificar Ollama
echo ""
echo "🤖 Verificando Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Ollama rodando${NC}"
    
    # Verificar modelos
    MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | head -2)
    if echo "$MODELS" | grep -q "deepseek-coder"; then
        echo -e "${GREEN}✅ Modelo deepseek-coder disponível${NC}"
    else
        echo -e "${YELLOW}⚠️  Modelo deepseek-coder não encontrado${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Ollama não está rodando${NC}"
    echo "   Execute: ollama serve"
fi

# Verificar dependências
echo ""
echo "📦 Verificando dependências..."
cd "$PROJECT_PATH"
if [ -d "node_modules/@modelcontextprotocol" ]; then
    echo -e "${GREEN}✅ Dependências MCP instaladas${NC}"
else
    echo -e "${YELLOW}⚠️  Dependências podem estar faltando${NC}"
    echo "   Execute: npm install"
fi

# Testar servidor MCP
echo ""
echo "🧪 Testando servidor MCP..."
if timeout 2 node "$MCP_SERVER" < /dev/null 2>&1 | grep -q "Sistema Ultra MCP Server"; then
    echo -e "${GREEN}✅ Servidor MCP funciona${NC}"
else
    echo -e "${YELLOW}⚠️  Não foi possível testar servidor (normal se Cursor estiver usando)${NC}"
fi

echo ""
echo "════════════════════════════════════════"
echo -e "${GREEN}✅ VERIFICAÇÃO CONCLUÍDA${NC}"
echo "════════════════════════════════════════"
echo ""
echo "📋 Próximos passos:"
echo "  1. Reinicie o Cursor completamente"
echo "  2. Verifique: View > Output > MCP"
echo "  3. Procure: 'Sistema Ultra MCP Server conectado'"
echo ""
echo "🧪 Teste no Cursor:"
echo "  Digite: 'Gere uma função para validar email'"
echo ""
