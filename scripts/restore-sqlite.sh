#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_PATH="${CONFIG_PATH:-$ROOT_DIR/config/config.json}"
BACKUP_DIR="${1:-}"

if [[ -z "$BACKUP_DIR" ]]; then
  echo "Uso: $0 <diretorio_backup>"
  exit 1
fi

resolve_paths() {
  if [[ -f "$CONFIG_PATH" ]]; then
    node -e "const fs=require('fs');const path=require('path');const cfg=JSON.parse(fs.readFileSync(process.env.CONFIG_PATH,'utf8'));const projectRoot=process.env.PROJECT_ROOT||process.cwd();const expand=v=>{if(typeof v!=='string')return'';let p=v.replace(/\$\{PROJECT_ROOT\}/g,projectRoot);p=p.replace(/^\~/,process.env.HOME||'');p=p.replace(/\$HOME/g,process.env.HOME||'');p=p.replace(/\$\{HOME\}/g,process.env.HOME||'');return p;};const kb=expand(cfg.paths?.knowledgeBase||'');const ctx=expand(cfg.paths?.context||'');const logs=expand(cfg.paths?.logs||'');console.log([kb,ctx,logs].join('|'));" \
      CONFIG_PATH="$CONFIG_PATH" PROJECT_ROOT="$ROOT_DIR"
  else
    echo "||"
  fi
}

IFS='|' read -r KB_PATH CTX_PATH LOGS_PATH <<< "$(resolve_paths)"
KB_PATH="${KB_PATH_OVERRIDE:-${KB_PATH:-}}"
CTX_PATH="${CTX_PATH_OVERRIDE:-${CTX_PATH:-}}"
LOGS_PATH="${LOGS_PATH_OVERRIDE:-${LOGS_PATH:-}}"

copy_if_exists() {
  local source="$1"
  local target="$2"
  if [[ -e "$source" ]]; then
    mkdir -p "$(dirname "$target")"
    cp -a "$source" "$target"
    echo "Restore: $source -> $target"
  else
    echo "Aviso: arquivo não encontrado no backup: $source"
  fi
}

copy_if_exists "$BACKUP_DIR/knowledge-base.db" "${KB_PATH%/}/knowledge-base.db"
copy_if_exists "$BACKUP_DIR/context.db" "${CTX_PATH%/}/context.db"

if [[ -d "$BACKUP_DIR/logs" && -n "$LOGS_PATH" ]]; then
  mkdir -p "$LOGS_PATH"
  cp -a "$BACKUP_DIR/logs/." "$LOGS_PATH/"
  echo "Restore: $BACKUP_DIR/logs -> $LOGS_PATH"
else
  echo "Aviso: logs não encontrados no backup ou destino inválido"
fi

echo "Restore concluído."
