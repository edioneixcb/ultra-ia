# ADR-003: Escolha do Tauri sobre Electron

## Status
Aceita

## Contexto
Precisamos de runtime desktop multiplataforma (Linux/Windows) que seja leve, seguro e permita acesso nativo ao sistema.

## Decisao
Escolhemos Tauri 2.x como runtime desktop.

## Justificativa

### Leveza
- Bundle ~10MB vs ~150MB Electron
- Memoria RAM ~30-50MB idle vs ~150-300MB Electron
- Startup < 0.5s vs ~1-2s Electron

### Seguranca
- Rust core (memory-safe)
- Sandboxing nativo
- Permissoes granulares
- Sem Node.js embutido (reduz superficie de ataque)

### Performance
- Usa WebView do sistema (WebView2/WebKit)
- Menos processos que Electron
- Melhor uso de bateria

## Alternativas Consideradas

1. **Electron**
   - Pros: Ecossistema enorme, amplamente usado, Chromium consistente
   - Contras: Muito pesado (150MB), alto uso de memoria, startup lento
   - Decisao: Rejeitado por peso

2. **Neutralino**
   - Pros: Ultra leve (~5MB)
   - Contras: Menos maduro, menos features, comunidade pequena
   - Decisao: Rejeitado por imaturidade

## Consequencias

### Positivas
- Bundle muito menor
- Melhor performance
- Mais seguro
- Melhor experiencia do usuario

### Negativas
- WebView depende do sistema (pode variar entre OS)
- Menos recursos/exemplos que Electron
- Rust necessario para comandos nativos

## Reversibilidade
MEDIA - Runtime e isolado via adapters, mas migracao requer reescrever comandos Rust.

## Referencias
- [Tauri](https://tauri.app/)
- [Tauri vs Electron](https://tauri.app/start/comparison)
- [Electron](https://www.electronjs.org/)
