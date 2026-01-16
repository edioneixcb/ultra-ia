# ADR-002: Escolha do Monaco sobre CodeMirror 6

## Status
Aceita

## Contexto
Precisamos de um editor de codigo embarcavel com suporte completo a LSP e DAP, features de IDE (minimap, breadcrumbs, diff, etc) e integracao madura.

## Decisao
Escolhemos Monaco Editor como editor de codigo principal.

## Justificativa

### Features Completas
- Minimap integrado
- Breadcrumbs
- Diff viewer
- Multi-cursor
- Snippets
- Code actions
- Hover, go-to-definition, find references

### Integracao LSP/DAP Madura
- monaco-languageclient (TypeFox) e maduro e amplamente usado
- Suporte completo a LSP 3.17
- Integracao DAP via VS Code debugger
- Exemplos e documentacao abundantes

### Ecossistema
- Usado pelo VS Code (prova de escala)
- Comunidade grande
- Issues resolvidas ativamente
- Roadmap claro

## Alternativas Consideradas

1. **CodeMirror 6**
   - Pros: Mais leve (~100KB vs 2MB), modular, mobile-friendly
   - Contras: LSP client recente (2025), menos features prontas, mais trabalho custom
   - Decisao: Rejeitado por falta de features prontas

2. **Ace Editor**
   - Pros: Leve, battle-tested
   - Contras: Sem suporte LSP nativo, menos features
   - Decisao: Rejeitado por falta de LSP

## Consequencias

### Positivas
- Features completas de IDE prontas
- Integracao LSP/DAP madura
- Menos codigo custom necessario
- Performance comprovada em escala

### Negativas
- Bundle maior (~2MB)
- Nao suporta mobile oficialmente
- Menos customizavel que CodeMirror

## Reversibilidade
BAIXA - Monaco e profundamente integrado. Migracao seria reescrever toda camada de editor.

## Referencias
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Monaco Language Client](https://github.com/TypeFox/monaco-languageclient)
- [CodeMirror 6](https://codemirror.net/)
