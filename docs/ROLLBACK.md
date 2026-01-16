# Rollback e Backup

Este guia descreve como criar backups e restaurar dados locais do Ultra-IA.

## O que é incluído
- `knowledge-base.db` (base de conhecimento)
- `context.db` (contexto persistente)
- diretório de logs

## Backup

```bash
./scripts/backup-sqlite.sh
```

Saída padrão: `backups/<timestamp>/`.

### Variáveis opcionais
- `CONFIG_PATH`: caminho do `config.json` (padrão: `config/config.json`)
- `BACKUP_ROOT`: diretório de destino (padrão: `./backups`)
- `KB_PATH_OVERRIDE`, `CTX_PATH_OVERRIDE`, `LOGS_PATH_OVERRIDE`: sobrescreve paths do config

## Restore

```bash
./scripts/restore-sqlite.sh backups/20260115-120000
```

### Variáveis opcionais
- `CONFIG_PATH`: caminho do `config.json`
- `KB_PATH_OVERRIDE`, `CTX_PATH_OVERRIDE`, `LOGS_PATH_OVERRIDE`: sobrescreve paths do config

## Observações
- Execute restore com a aplicação parada.
- Faça backup antes de qualquer mudança crítica.
