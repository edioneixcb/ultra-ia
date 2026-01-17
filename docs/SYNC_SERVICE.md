# Ultra-IA Sync Service - Documentação Completa

Serviço de sincronização automática que monitora o projeto ultra-ia e outros projetos, mantendo a configuração MCP e a Knowledge Base sempre atualizadas.

## Visão Geral

O Ultra-IA Sync Service é um daemon que roda em background e:

1. **Monitora mudanças no ultra-ia** - Qualquer alteração no código do ultra-ia atualiza automaticamente a configuração MCP do Cursor
2. **Detecta novos projetos** - Quando um novo projeto é adicionado em `/home/edioneixcb/projetos`, ele é automaticamente detectado
3. **Indexa projetos ativos** - Projetos com atividade recente (últimos 7 dias) são automaticamente indexados na Knowledge Base
4. **Logs estruturados** - Todos os eventos são registrados em formato JSON para fácil análise

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  Systemd User Service (ultra-ia-sync.service)               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ultra-ia-sync.sh (script principal)                    │ │
│  │  ├─ Monitor ultra-ia (inotifywait)                    │ │
│  │  ├─ Monitor projetos/ (inotifywait)                  │ │
│  │  └─ ultra-ia-sync-core.js (lógica Node.js)           │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────┐        ┌──────────────────────┐
│ ~/.cursor/       │        │ Knowledge Base       │
│ mcp.json         │        │ (proactive.db)       │
└──────────────────┘        └──────────────────────┘
```

## Instalação

### Pré-requisitos

1. **inotify-tools** - Para monitoramento de filesystem
   ```bash
   sudo apt install inotify-tools
   ```

2. **Node.js 18+** - Para execução dos scripts
   ```bash
   # Se usando nvm:
   nvm install 18
   nvm use 18
   ```

3. **bc** - Para cálculos no bash
   ```bash
   sudo apt install bc
   ```

### Instalação Automática

```bash
cd /home/edioneixcb/projetos/ultra-ia

# Dar permissão de execução
chmod +x scripts/install-sync-service.sh

# Instalar e iniciar serviço
./scripts/install-sync-service.sh
```

O instalador irá:
- Verificar todas as dependências
- Criar diretórios necessários
- Configurar permissões
- Instalar serviço systemd
- Iniciar o serviço automaticamente

### Verificar Instalação

```bash
# Ver status do serviço
systemctl --user status ultra-ia-sync

# Ver logs em tempo real
journalctl --user -u ultra-ia-sync -f
```

## Configuração

O arquivo de configuração está em `config/sync-config.json`:

```json
{
  "ultraRoot": "/home/edioneixcb/projetos/ultra-ia",
  "projectsRoot": "/home/edioneixcb/projetos",
  "cacheDir": "~/.cache/ultra-ia",
  "logFile": "~/.cache/ultra-ia/sync.log",
  "lastIndexedFile": "~/.cache/ultra-ia/last-indexed.json",
  "activeProjectThresholdDays": 7,
  "debounceMs": 2000,
  "excludePatterns": [
    "node_modules",
    ".git",
    "data",
    "logs"
  ],
  "projectIndicators": [
    "package.json",
    ".git",
    "pyproject.toml",
    "go.mod"
  ]
}
```

### Parâmetros

| Parâmetro | Descrição | Padrão |
|-----------|-----------|--------|
| `ultraRoot` | Caminho do projeto ultra-ia | `/home/edioneixcb/projetos/ultra-ia` |
| `projectsRoot` | Diretório com todos os projetos | `/home/edioneixcb/projetos` |
| `activeProjectThresholdDays` | Dias para considerar projeto ativo | 7 |
| `debounceMs` | Tempo de debounce entre eventos | 2000 |
| `excludePatterns` | Padrões de arquivos/pastas a ignorar | `node_modules`, `.git`, etc |
| `projectIndicators` | Arquivos que indicam raiz de projeto | `package.json`, `.git`, etc |

## Uso

### Comandos do Serviço

```bash
# Iniciar serviço
systemctl --user start ultra-ia-sync

# Parar serviço
systemctl --user stop ultra-ia-sync

# Reiniciar serviço
systemctl --user restart ultra-ia-sync

# Ver status
systemctl --user status ultra-ia-sync

# Ver logs em tempo real
journalctl --user -u ultra-ia-sync -f

# Ver últimas 50 linhas de log
journalctl --user -u ultra-ia-sync -n 50
```

### Script Core (Manual)

O script core pode ser executado manualmente para operações específicas:

```bash
cd /home/edioneixcb/projetos/ultra-ia

# Ver ajuda
node scripts/ultra-ia-sync-core.js

# Listar todos os projetos
node scripts/ultra-ia-sync-core.js list_projects

# Ver status do sistema
node scripts/ultra-ia-sync-core.js status

# Reindexar todos os projetos ativos
node scripts/ultra-ia-sync-core.js reindex_all

# Simular evento de novo projeto
node scripts/ultra-ia-sync-core.js new_project /path/to/project
```

## Logs

### Localização dos Logs

- **Systemd Journal**: `journalctl --user -u ultra-ia-sync`
- **Log Estruturado**: `~/.cache/ultra-ia/sync.log`

### Formato do Log Estruturado (JSONL)

```json
{"timestamp":"2026-01-15T10:30:45.123Z","level":"info","event":"ultra_changed","data":{"path":"/path/to/file.js","action":"MODIFY"},"pid":12345}
{"timestamp":"2026-01-15T10:31:00.456Z","level":"info","event":"new_project_detected","data":{"project":"novo-projeto","path":"/home/edioneixcb/projetos/novo-projeto"},"pid":12345}
```

### Eventos Registrados

| Evento | Descrição |
|--------|-----------|
| `ultra_changed` | Arquivo no ultra-ia foi modificado |
| `new_project_detected` | Novo diretório de projeto detectado |
| `active_project_indexing` | Iniciando indexação de projeto ativo |
| `index_started` | Indexação iniciada |
| `index_success` | Indexação concluída com sucesso |
| `index_failed` | Falha na indexação |
| `mcp_update_started` | Atualização do MCP iniciada |
| `mcp_update_success` | MCP atualizado com sucesso |

## Desinstalação

```bash
# Remover serviço
./scripts/install-sync-service.sh --remove

# Limpar cache (opcional)
rm -rf ~/.cache/ultra-ia
```

## Troubleshooting

### Serviço não inicia

1. Verificar dependências:
   ```bash
   which inotifywait node bc
   ```

2. Verificar logs de erro:
   ```bash
   journalctl --user -u ultra-ia-sync -n 50 --no-pager
   ```

3. Testar execução manual:
   ```bash
   ./scripts/ultra-ia-sync.sh
   ```

### Eventos não são detectados

1. Verificar se inotifywait está funcionando:
   ```bash
   inotifywait -m /home/edioneixcb/projetos/ultra-ia
   ```

2. Verificar limites do inotify:
   ```bash
   cat /proc/sys/fs/inotify/max_user_watches
   # Se muito baixo, aumentar:
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

### Projetos não são indexados

1. Verificar se projeto é detectado como raiz:
   ```bash
   node scripts/ultra-ia-sync-core.js list_projects
   ```

2. Verificar se projeto é considerado ativo:
   ```bash
   # Projeto deve ter arquivos modificados nos últimos 7 dias
   find /path/to/project -type f -mtime -7 | head -5
   ```

3. Forçar reindexação:
   ```bash
   node scripts/ultra-ia-sync-core.js reindex_all
   ```

### Consumo alto de recursos

1. Verificar limites do serviço (configurados no arquivo .service):
   - MemoryMax=256M
   - CPUQuota=20%

2. Aumentar debounce se houver muitos eventos:
   ```json
   // Em config/sync-config.json
   "debounceMs": 5000
   ```

## Segurança

- O serviço roda como usuário, sem privilégios de root
- Lock file previne execuções concorrentes
- Caminhos são validados para evitar path traversal
- Padrões de exclusão previnem monitoramento desnecessário

## Performance

- **Debouncing**: Eventos próximos são agrupados (padrão 2s)
- **Projetos ativos**: Apenas projetos com atividade recente são indexados
- **Exclusões**: node_modules, .git e outros são ignorados
- **Limite de recursos**: Systemd limita uso de CPU e memória

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `scripts/ultra-ia-sync.sh` | Script principal (bash) |
| `scripts/ultra-ia-sync-core.js` | Lógica de processamento (Node.js) |
| `scripts/ultra-ia-sync.service` | Template do serviço systemd |
| `scripts/install-sync-service.sh` | Instalador |
| `config/sync-config.json` | Configuração |
| `~/.cache/ultra-ia/sync.log` | Log estruturado |
| `~/.cache/ultra-ia/last-indexed.json` | Cache de indexações |
