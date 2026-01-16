#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_PATH="${CONFIG_PATH:-$ROOT_DIR/config/config.json}"
BACKUP_ROOT="${BACKUP_ROOT:-$ROOT_DIR/backups}"

resolve_paths() {
  if [[ -f "$CONFIG_PATH" ]]; then
    node -e "const fs=require('fs');const cfg=JSON.parse(fs.readFileSync(process.env.CONFIG_PATH,'utf8'));const expand=v=>typeof v==='string'?v.replace('\$HOME',process.env.HOME):'';const kb=expand(cfg.paths?.knowledgeBase||'');const ctx=expand(cfg.paths?.context||'');const logs=expand(cfg.paths?.logs||'');console.log([kb,ctx,logs].join('|'));" \
      CONFIG_PATH="$CONFIG_PATH"
  else
    echo "||"
  fi
}

IFS='|' read -r KB_PATH CTX_PATH LOGS_PATH <<< "$(resolve_paths)"
KB_PATH="${KB_PATH_OVERRIDE:-${KB_PATH:-}}"
CTX_PATH="${CTX_PATH_OVERRIDE:-${CTX_PATH:-}}"
LOGS_PATH="${LOGS_PATH_OVERRIDE:-${LOGS_PATH:-}}"

TS="$(date +%Y%m%d-%H%M%S)"
DEST_DIR="$BACKUP_ROOT/$TS"
mkdir -p "$DEST_DIR"

copy_if_exists() {
  local source="$1"
  local target="$2"
  if [[ -n "$source" && -e "$source" ]]; then
    mkdir -p "$(dirname "$target")"
    cp -a "$source" "$target"
    echo "Backup: $source -> $target"
  else
    echo "Aviso: caminho não encontrado ou vazio: $source"
  fi
}

copy_if_exists "${KB_PATH%/}/knowledge-base.db" "$DEST_DIR/knowledge-base.db"
copy_if_exists "${CTX_PATH%/}/context.db" "$DEST_DIR/context.db"

if [[ -n "$LOGS_PATH" && -d "$LOGS_PATH" ]]; then
  mkdir -p "$DEST_DIR/logs"
  cp -a "$LOGS_PATH/." "$DEST_DIR/logs/"
  echo "Backup: $LOGS_PATH -> $DEST_DIR/logs"
else
  echo "Aviso: logs não encontrados: $LOGS_PATH"
fi

echo "Backup concluído em: $DEST_DIR"
