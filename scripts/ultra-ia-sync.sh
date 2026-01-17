#!/usr/bin/env bash
# ==============================================================================
# Ultra-IA Sync Monitor
# ==============================================================================
# 
# Monitora mudanças no ultra-ia e novos projetos em /home/edioneixcb/projetos
# Atualiza automaticamente a configuração MCP e reindexa projetos ativos.
#
# Uso:
#   ./ultra-ia-sync.sh           # Executar em foreground
#   ./ultra-ia-sync.sh --daemon  # Executar em background (não recomendado, use systemd)
#
# Requisitos:
#   - inotify-tools: sudo apt install inotify-tools
#   - Node.js 18+
#
# ==============================================================================

set -euo pipefail

# ==============================================================================
# Configuração
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Carregar configuração do JSON
CONFIG_FILE="$PROJECT_ROOT/config/sync-config.json"

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "[ERROR] Config não encontrado: $CONFIG_FILE"
    exit 1
fi

# Extrair valores do JSON usando Node.js (mais seguro que jq para garantir compatibilidade)
read_config() {
    node -e "console.log(require('$CONFIG_FILE').$1 || '')"
}

ULTRA_ROOT=$(read_config ultraRoot)
PROJECTS_ROOT=$(read_config projectsRoot)
DEBOUNCE_MS=$(read_config debounceMs)
CACHE_DIR=$(read_config cacheDir | sed "s|^~|$HOME|")

# Arquivos de controle
LOCK_FILE="/tmp/ultra-ia-sync.lock"
PID_FILE="/tmp/ultra-ia-sync.pid"
CORE_SCRIPT="$SCRIPT_DIR/ultra-ia-sync-core.js"

# Debounce em segundos (converter de ms)
DEBOUNCE_SECS=$(echo "scale=1; $DEBOUNCE_MS / 1000" | bc)

# PIDs dos processos inotifywait
ULTRA_WATCH_PID=""
PROJECTS_WATCH_PID=""

# ==============================================================================
# Funções de Log
# ==============================================================================

log() {
    local level="$1"
    shift
    echo "[$(date -Is)] [$level] $*"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }
log_debug() { 
    if [[ "${DEBUG:-0}" == "1" ]]; then
        log "DEBUG" "$@"
    fi
}

# ==============================================================================
# Verificação de Dependências
# ==============================================================================

check_dependencies() {
    local missing=()
    
    if ! command -v inotifywait &> /dev/null; then
        missing+=("inotify-tools")
    fi
    
    if ! command -v node &> /dev/null; then
        # Tentar carregar via nvm
        if [[ -f "$HOME/.nvm/nvm.sh" ]]; then
            source "$HOME/.nvm/nvm.sh"
            nvm use 18 &> /dev/null || true
        fi
        
        if ! command -v node &> /dev/null; then
            missing+=("nodejs")
        fi
    fi
    
    if ! command -v bc &> /dev/null; then
        missing+=("bc")
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Dependências faltando: ${missing[*]}"
        log_error "Instalar com: sudo apt install ${missing[*]}"
        exit 1
    fi
    
    log_info "Dependências verificadas: OK"
}

# ==============================================================================
# Gerenciamento de Lock
# ==============================================================================

acquire_lock() {
    # Usar flock para garantir execução única
    exec 9>"$LOCK_FILE"
    if ! flock -n 9; then
        log_error "Outra instância já está em execução"
        exit 1
    fi
    
    echo $$ > "$PID_FILE"
    log_info "Lock adquirido (PID: $$)"
}

release_lock() {
    flock -u 9 2>/dev/null || true
    rm -f "$PID_FILE" "$LOCK_FILE" 2>/dev/null || true
}

# ==============================================================================
# Cleanup
# ==============================================================================

cleanup() {
    log_info "Encerrando..."
    
    # Matar processos inotifywait
    if [[ -n "$ULTRA_WATCH_PID" ]] && kill -0 "$ULTRA_WATCH_PID" 2>/dev/null; then
        kill "$ULTRA_WATCH_PID" 2>/dev/null || true
    fi
    
    if [[ -n "$PROJECTS_WATCH_PID" ]] && kill -0 "$PROJECTS_WATCH_PID" 2>/dev/null; then
        kill "$PROJECTS_WATCH_PID" 2>/dev/null || true
    fi
    
    # Matar todos os processos filhos
    pkill -P $$ 2>/dev/null || true
    
    release_lock
    log_info "Encerrado com sucesso"
    exit 0
}

# Registrar handlers de sinal
trap cleanup SIGTERM SIGINT SIGHUP EXIT

# ==============================================================================
# Processamento de Eventos
# ==============================================================================

# Debounce map (path -> timestamp)
declare -A LAST_EVENT_TIME

should_process() {
    local path="$1"
    local now=$(date +%s%N)
    local last="${LAST_EVENT_TIME[$path]:-0}"
    local diff_ns=$((now - last))
    local debounce_ns=$((DEBOUNCE_MS * 1000000))
    
    if [[ $diff_ns -lt $debounce_ns ]]; then
        log_debug "Debounce: ignorando $path (${diff_ns}ns < ${debounce_ns}ns)"
        return 1
    fi
    
    LAST_EVENT_TIME[$path]=$now
    return 0
}

process_ultra_event() {
    local path="$1"
    local action="$2"
    
    if ! should_process "$path"; then
        return
    fi
    
    log_info "Ultra-IA mudou: $action $path"
    
    # Chamar core script
    node "$CORE_SCRIPT" ultra_changed "$path" "$action" || {
        log_warn "Erro ao processar evento ultra_changed"
    }
}

process_project_event() {
    local path="$1"
    local action="$2"
    local name="$3"
    
    local full_path="$path$name"
    
    if ! should_process "$full_path"; then
        return
    fi
    
    # Verificar se é um diretório novo
    if [[ -d "$full_path" ]]; then
        log_info "Novo projeto detectado: $name"
        
        # Aguardar um pouco para arquivos serem copiados
        sleep 2
        
        # Chamar core script
        node "$CORE_SCRIPT" new_project "$full_path" || {
            log_warn "Erro ao processar evento new_project"
        }
    fi
}

# ==============================================================================
# Watchers
# ==============================================================================

start_ultra_watcher() {
    log_info "Iniciando watcher para ultra-ia: $ULTRA_ROOT"
    
    # Construir padrões de exclusão para inotifywait
    local excludes="node_modules|/\.git/|/data/|/logs/|/coverage/|/dist/|/build/"
    
    inotifywait -m -r \
        --format '%w %e %f' \
        -e close_write,create,delete,move \
        --exclude "$excludes" \
        "$ULTRA_ROOT" 2>/dev/null | while read -r dir events file; do
        
        local full_path="${dir}${file}"
        process_ultra_event "$full_path" "$events"
    done &
    
    ULTRA_WATCH_PID=$!
    log_info "Ultra watcher iniciado (PID: $ULTRA_WATCH_PID)"
}

start_projects_watcher() {
    log_info "Iniciando watcher para projetos: $PROJECTS_ROOT"
    
    # Monitorar apenas criação de diretórios no nível raiz
    inotifywait -m \
        --format '%w %e %f' \
        -e create,moved_to \
        "$PROJECTS_ROOT" 2>/dev/null | while read -r dir events name; do
        
        # Ignorar ultra-ia e diretórios ocultos
        if [[ "$name" == "ultra-ia" ]] || [[ "$name" == .* ]]; then
            continue
        fi
        
        process_project_event "$dir" "$events" "$name"
    done &
    
    PROJECTS_WATCH_PID=$!
    log_info "Projects watcher iniciado (PID: $PROJECTS_WATCH_PID)"
}

# ==============================================================================
# Verificação de Saúde
# ==============================================================================

health_check() {
    while true; do
        sleep 60
        
        # Verificar se watchers ainda estão rodando
        if [[ -n "$ULTRA_WATCH_PID" ]] && ! kill -0 "$ULTRA_WATCH_PID" 2>/dev/null; then
            log_warn "Ultra watcher morreu, reiniciando..."
            start_ultra_watcher
        fi
        
        if [[ -n "$PROJECTS_WATCH_PID" ]] && ! kill -0 "$PROJECTS_WATCH_PID" 2>/dev/null; then
            log_warn "Projects watcher morreu, reiniciando..."
            start_projects_watcher
        fi
        
        log_debug "Health check: watchers OK"
    done
}

# ==============================================================================
# Main
# ==============================================================================

main() {
    log_info "=========================================="
    log_info "Ultra-IA Sync Monitor"
    log_info "=========================================="
    log_info "Ultra Root: $ULTRA_ROOT"
    log_info "Projects Root: $PROJECTS_ROOT"
    log_info "Debounce: ${DEBOUNCE_SECS}s"
    log_info "Core Script: $CORE_SCRIPT"
    log_info "=========================================="
    
    # Verificar dependências
    check_dependencies
    
    # Garantir diretório de cache existe
    mkdir -p "$CACHE_DIR"
    
    # Adquirir lock
    acquire_lock
    
    # Verificar se core script existe
    if [[ ! -f "$CORE_SCRIPT" ]]; then
        log_error "Core script não encontrado: $CORE_SCRIPT"
        exit 1
    fi
    
    # Verificar se diretórios existem
    if [[ ! -d "$ULTRA_ROOT" ]]; then
        log_error "Ultra root não encontrado: $ULTRA_ROOT"
        exit 1
    fi
    
    if [[ ! -d "$PROJECTS_ROOT" ]]; then
        log_error "Projects root não encontrado: $PROJECTS_ROOT"
        exit 1
    fi
    
    # Iniciar watchers
    start_ultra_watcher
    start_projects_watcher
    
    # Iniciar health check em background
    health_check &
    
    log_info "Monitoramento iniciado. Pressione Ctrl+C para parar."
    
    # Aguardar indefinidamente
    wait
}

# Executar
main "$@"
