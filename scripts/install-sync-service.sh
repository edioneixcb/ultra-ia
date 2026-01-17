#!/usr/bin/env bash
# ==============================================================================
# Ultra-IA Sync Service - Instalador
# ==============================================================================
#
# Instala e configura o serviço de sincronização automática do Ultra-IA.
#
# Uso:
#   ./install-sync-service.sh           # Instalar e iniciar serviço
#   ./install-sync-service.sh --remove  # Remover serviço
#   ./install-sync-service.sh --status  # Ver status do serviço
#
# ==============================================================================

set -euo pipefail

# ==============================================================================
# Configuração
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SERVICE_NAME="ultra-ia-sync"
SERVICE_FILE="$SCRIPT_DIR/ultra-ia-sync.service"
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
SYSTEMD_SERVICE="$SYSTEMD_USER_DIR/$SERVICE_NAME.service"
CACHE_DIR="$HOME/.cache/ultra-ia"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================================================
# Funções de Log
# ==============================================================================

log_info() { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $*"; }

# ==============================================================================
# Verificação de Dependências
# ==============================================================================

check_dependencies() {
    log_step "Verificando dependências..."
    
    local missing=()
    local install_cmd=""
    
    # Detectar gerenciador de pacotes
    if command -v apt &> /dev/null; then
        install_cmd="sudo apt install"
    elif command -v dnf &> /dev/null; then
        install_cmd="sudo dnf install"
    elif command -v pacman &> /dev/null; then
        install_cmd="sudo pacman -S"
    fi
    
    # Verificar inotify-tools
    if ! command -v inotifywait &> /dev/null; then
        missing+=("inotify-tools")
    fi
    
    # Verificar bc
    if ! command -v bc &> /dev/null; then
        missing+=("bc")
    fi
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        # Tentar carregar via nvm
        if [[ -f "$HOME/.nvm/nvm.sh" ]]; then
            source "$HOME/.nvm/nvm.sh"
            nvm use 18 &> /dev/null || true
        fi
        
        if ! command -v node &> /dev/null; then
            missing+=("nodejs (ou use nvm)")
        fi
    fi
    
    # Verificar systemd user instance
    if ! systemctl --user status &> /dev/null; then
        log_error "Systemd user instance não está disponível"
        log_error "Verifique se você está logado via sessão gráfica ou SSH com suporte a systemd user"
        exit 1
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Dependências faltando: ${missing[*]}"
        if [[ -n "$install_cmd" ]]; then
            log_info "Instalar com: $install_cmd ${missing[*]}"
        fi
        exit 1
    fi
    
    log_info "Todas as dependências estão instaladas"
}

# ==============================================================================
# Verificação de Arquivos
# ==============================================================================

check_files() {
    log_step "Verificando arquivos necessários..."
    
    local files=(
        "$PROJECT_ROOT/scripts/ultra-ia-sync.sh"
        "$PROJECT_ROOT/scripts/ultra-ia-sync-core.js"
        "$PROJECT_ROOT/scripts/ultra-ia-sync.service"
        "$PROJECT_ROOT/config/sync-config.json"
        "$PROJECT_ROOT/scripts/atualizar-cursor-mcp.sh"
    )
    
    for file in "${files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Arquivo não encontrado: $file"
            exit 1
        fi
    done
    
    log_info "Todos os arquivos necessários encontrados"
}

# ==============================================================================
# Configurar Permissões
# ==============================================================================

setup_permissions() {
    log_step "Configurando permissões de execução..."
    
    chmod +x "$PROJECT_ROOT/scripts/ultra-ia-sync.sh"
    chmod +x "$PROJECT_ROOT/scripts/ultra-ia-sync-core.js"
    chmod +x "$PROJECT_ROOT/scripts/atualizar-cursor-mcp.sh"
    
    log_info "Permissões configuradas"
}

# ==============================================================================
# Criar Diretórios
# ==============================================================================

create_directories() {
    log_step "Criando diretórios necessários..."
    
    mkdir -p "$SYSTEMD_USER_DIR"
    mkdir -p "$CACHE_DIR"
    mkdir -p "$PROJECT_ROOT/data"
    mkdir -p "$PROJECT_ROOT/logs"
    
    log_info "Diretórios criados"
}

# ==============================================================================
# Instalar Serviço
# ==============================================================================

install_service() {
    log_step "Instalando serviço systemd..."
    
    # Atualizar caminhos no arquivo de serviço
    local node_path=""
    
    if command -v node &> /dev/null; then
        node_path="$(dirname "$(which node)")"
    elif [[ -f "$HOME/.nvm/nvm.sh" ]]; then
        source "$HOME/.nvm/nvm.sh"
        nvm use 18 &> /dev/null || true
        if command -v node &> /dev/null; then
            node_path="$(dirname "$(which node)")"
        fi
    fi
    
    if [[ -z "$node_path" ]]; then
        node_path="/usr/local/bin:/usr/bin"
    fi
    
    # Criar arquivo de serviço com caminhos corretos
    cat > "$SYSTEMD_SERVICE" << EOF
[Unit]
Description=Ultra-IA Sync Monitor - Automatic project synchronization and indexing
Documentation=https://github.com/edioneixcb/ultra-ia
After=default.target

[Service]
Type=simple
ExecStart=$PROJECT_ROOT/scripts/ultra-ia-sync.sh
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10
TimeoutStartSec=30
TimeoutStopSec=30

# Ambiente
Environment=NODE_ENV=production
Environment=PATH=$node_path:/usr/local/bin:/usr/bin:/bin
Environment=HOME=$HOME

# Limites de recursos
MemoryMax=256M
CPUQuota=20%

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ultra-ia-sync

[Install]
WantedBy=default.target
EOF
    
    log_info "Arquivo de serviço instalado: $SYSTEMD_SERVICE"
}

# ==============================================================================
# Habilitar e Iniciar Serviço
# ==============================================================================

enable_service() {
    log_step "Habilitando serviço..."
    
    # Recarregar configurações do systemd
    systemctl --user daemon-reload
    
    # Habilitar serviço para iniciar no boot
    systemctl --user enable "$SERVICE_NAME"
    
    log_info "Serviço habilitado para iniciar automaticamente"
}

start_service() {
    log_step "Iniciando serviço..."
    
    # Parar se já estiver rodando
    systemctl --user stop "$SERVICE_NAME" 2>/dev/null || true
    
    # Iniciar serviço
    systemctl --user start "$SERVICE_NAME"
    
    # Aguardar um pouco
    sleep 2
    
    # Verificar status
    if systemctl --user is-active --quiet "$SERVICE_NAME"; then
        log_info "Serviço iniciado com sucesso"
    else
        log_error "Falha ao iniciar serviço"
        log_error "Ver logs com: journalctl --user -u $SERVICE_NAME -f"
        exit 1
    fi
}

# ==============================================================================
# Remover Serviço
# ==============================================================================

remove_service() {
    log_step "Removendo serviço..."
    
    # Parar serviço
    systemctl --user stop "$SERVICE_NAME" 2>/dev/null || true
    
    # Desabilitar serviço
    systemctl --user disable "$SERVICE_NAME" 2>/dev/null || true
    
    # Remover arquivo
    rm -f "$SYSTEMD_SERVICE"
    
    # Recarregar configurações
    systemctl --user daemon-reload
    
    log_info "Serviço removido com sucesso"
}

# ==============================================================================
# Mostrar Status
# ==============================================================================

show_status() {
    echo ""
    echo "=== Ultra-IA Sync Service Status ==="
    echo ""
    
    if systemctl --user is-active --quiet "$SERVICE_NAME"; then
        echo -e "Status: ${GREEN}ATIVO${NC}"
    else
        echo -e "Status: ${RED}INATIVO${NC}"
    fi
    
    echo ""
    systemctl --user status "$SERVICE_NAME" --no-pager || true
    
    echo ""
    echo "=== Últimas Linhas do Log ==="
    echo ""
    journalctl --user -u "$SERVICE_NAME" --no-pager -n 10 || true
    
    echo ""
    echo "=== Comandos Úteis ==="
    echo ""
    echo "  Ver logs em tempo real:"
    echo "    journalctl --user -u $SERVICE_NAME -f"
    echo ""
    echo "  Reiniciar serviço:"
    echo "    systemctl --user restart $SERVICE_NAME"
    echo ""
    echo "  Parar serviço:"
    echo "    systemctl --user stop $SERVICE_NAME"
    echo ""
}

# ==============================================================================
# Mostrar Ajuda
# ==============================================================================

show_help() {
    cat << EOF
Ultra-IA Sync Service - Instalador

Uso: $0 [opção]

Opções:
  (sem opção)    Instalar e iniciar o serviço
  --remove       Remover o serviço
  --status       Mostrar status do serviço
  --help         Mostrar esta ajuda

Descrição:
  Este script instala um serviço systemd user que monitora:
  
  1. Mudanças no projeto ultra-ia
     - Atualiza automaticamente a configuração MCP do Cursor
  
  2. Novos projetos em /home/edioneixcb/projetos
     - Detecta e indexa automaticamente projetos ativos
  
  3. Projetos ativos (com mudanças recentes)
     - Reindexa automaticamente quando necessário

Requisitos:
  - inotify-tools: sudo apt install inotify-tools
  - Node.js 18+
  - bc: sudo apt install bc

Após instalação:
  - O serviço inicia automaticamente no login
  - Logs podem ser vistos com: journalctl --user -u ultra-ia-sync -f
  - Configuração em: $PROJECT_ROOT/config/sync-config.json

EOF
}

# ==============================================================================
# Main
# ==============================================================================

main() {
    echo ""
    echo "=============================================="
    echo "  Ultra-IA Sync Service - Instalador"
    echo "=============================================="
    echo ""
    
    case "${1:-}" in
        --remove)
            remove_service
            ;;
        --status)
            show_status
            ;;
        --help|-h)
            show_help
            ;;
        "")
            check_dependencies
            check_files
            setup_permissions
            create_directories
            install_service
            enable_service
            start_service
            
            echo ""
            echo "=============================================="
            echo "  Instalação Concluída!"
            echo "=============================================="
            echo ""
            echo "O serviço Ultra-IA Sync está rodando."
            echo ""
            echo "Comandos úteis:"
            echo "  Ver status:    systemctl --user status $SERVICE_NAME"
            echo "  Ver logs:      journalctl --user -u $SERVICE_NAME -f"
            echo "  Reiniciar:     systemctl --user restart $SERVICE_NAME"
            echo "  Parar:         systemctl --user stop $SERVICE_NAME"
            echo "  Desinstalar:   $0 --remove"
            echo ""
            ;;
        *)
            log_error "Opção desconhecida: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
