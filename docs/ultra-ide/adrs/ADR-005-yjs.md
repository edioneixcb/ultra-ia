# ADR-005: Escolha do Yjs sobre Automerge

## Status
Aceita

## Contexto
Precisamos de CRDT (Conflict-free Replicated Data Type) para colaboracao em tempo real no editor.

## Decisao
Escolhemos Yjs como biblioteca CRDT.

## Justificativa

### Integracao com Editores
- y-monaco binding oficial e maduro
- y-codemirror.next para CodeMirror
- Integracao com ProseMirror/Tiptap
- Exemplos abundantes

### Performance
- Otimizado para editores de texto
- Operacoes eficientes
- Suporte a grandes documentos

### Ecossistema
- Muitos providers (WebSocket, WebRTC, etc)
- Awareness protocol para cursores
- Comunidade ativa
- Documentacao completa

## Alternativas Consideradas

1. **Automerge**
   - Pros: Local-first, historico completo, melhor para documentos ricos
   - Contras: Bindings de editor menos maduros, menos exemplos
   - Decisao: Rejeitado por falta de integracao com Monaco

2. **Operational Transform (OT)**
   - Pros: Padrao antigo, bem conhecido
   - Contras: Requer servidor centralizado, mais complexo
   - Decisao: Rejeitado por complexidade e necessidade de servidor

## Consequencias

### Positivas
- Integracao facil com Monaco
- Performance otimizada para texto
- Providers prontos
- Awareness para cursores

### Negativas
- Menos adequado para documentos ricos que Automerge
- Requer servidor para sincronizacao (pode ser self-hosted)

## Reversibilidade
MEDIA - Yjs e usado apenas para colaboracao, mas migracao requer reescrever bindings.

## Referencias
- [Yjs](https://yjs.dev/)
- [y-monaco](https://github.com/yjs/y-monaco)
- [Automerge](https://automerge.org/)
