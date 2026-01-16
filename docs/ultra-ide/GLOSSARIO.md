# Glossario Ultra-IDE

## Termos Principais

- **LSP (Language Server Protocol)**: Protocolo para autocomplete, diagnostics, go-to-definition e outras features de linguagem.
- **DAP (Debug Adapter Protocol)**: Protocolo para integrar debuggers de diferentes linguagens.
- **MCP (Model Context Protocol)**: Protocolo para expor ferramentas de IA para o IDE.
- **CRDT**: Estrutura de dados que permite colaboracao em tempo real sem conflitos.
- **Yjs**: Biblioteca CRDT usada para colaboracao no editor.
- **Monaco Editor**: Editor de codigo do VS Code, usado como base do Ultra-IDE.
- **Tauri**: Runtime desktop leve baseado em WebView e Rust.
- **Adapter**: Interface que abstrai implementacoes de plataforma (web/desktop).
- **Plugin Host**: Ambiente isolado para executar plugins com permissoes controladas.
- **Workspace**: Raiz do projeto aberto no IDE.
- **Command Palette**: Interface para executar comandos pelo teclado.
- **Feature Flag**: Mecanismo para ativar/desativar funcionalidades.
- **Offline-first**: Filosofia de design que garante funcionamento sem internet.
- **ADR (Architecture Decision Record)**: Documento que registra decisoes arquiteturais e suas justificativas.
