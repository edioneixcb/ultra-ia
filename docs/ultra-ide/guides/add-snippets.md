# Guia: Adicionar Snippets para Linguagem

## Pre-requisitos

- Conhecimento basico de Monaco snippets
- Linguagem registrada no registry

## Resultado Final

Snippets aparecendo no autocomplete da linguagem.

## Passo 1: Criar Arquivo de Snippets

### packages/ui/src/snippets/rust.json

```json
{
  "Println": {
    "prefix": "println",
    "body": "println!(\"${1:message}\");",
    "description": "Print to stdout"
  },
  "Main": {
    "prefix": "main",
    "body": [
      "fn main() {",
      "    ${1:// code}",
      "}"
    ],
    "description": "Main function"
  }
}
```

## Passo 2: Registrar Snippets

### packages/ui/src/monaco/snippets.ts

```typescript
import rustSnippets from '../snippets/rust.json';

monaco.languages.registerCompletionItemProvider('rust', {
  provideCompletionItems: () => ({
    suggestions: Object.entries(rustSnippets).map(([name, s]) => ({
      label: name,
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: s.body.join('\n'),
      documentation: s.description
    }))
  })
});
```

## Checklist de Validacao

- [ ] Snippet aparece no autocomplete
- [ ] Placeholder funciona
- [ ] Documentacao aparece no hover
