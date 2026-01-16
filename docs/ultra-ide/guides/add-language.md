# Guia: Adicionar Suporte a Nova Linguagem (LSP)

## Pre-requisitos

- Language Server existente para a linguagem
- Conhecimento basico de LSP
- Acesso ao projeto Ultra-IDE

## Resultado Final

Ao terminar, voce tera suporte completo para a linguagem:
- Syntax highlighting
- Autocomplete
- Go to definition
- Find references
- Rename
- Diagnostics
- Format document

## Passo 1: Registrar Linguagem

### packages/core/src/languages/registry.ts

```typescript
import { languageRegistry } from '@ultra-ide/core';

languageRegistry.register({
  id: 'rust',
  extensions: ['.rs'],
  aliases: ['Rust', 'rust'],
  mimetypes: ['text/x-rust'],
  configuration: {
    // Configuracao do Monaco para syntax highlighting
    wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/']
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' }
    ]
  }
});
```

## Passo 2: Configurar LSP Server

### config/lsp-servers.json

```json
{
  "rust": {
    "command": "rust-analyzer",
    "args": [],
    "rootPatterns": ["Cargo.toml"],
    "initializationOptions": {
      "cargo": {
        "allFeatures": true
      }
    },
    "settings": {
      "rust-analyzer.checkOnSave.command": "clippy"
    }
  }
}
```

## Passo 3: Adicionar Syntax Highlighting (Monaco)

### packages/ui/src/monaco/languages/rust.ts

```typescript
import * as monaco from 'monaco-editor';
import { rustLanguage } from './rust-tokens';

monaco.languages.register({ id: 'rust' });

monaco.languages.setMonarchTokensProvider('rust', rustLanguage);
```

### packages/ui/src/monaco/languages/rust-tokens.ts

```typescript
export const rustLanguage = {
  keywords: [
    'as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern',
    'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod',
    'move', 'mut', 'pub', 'ref', 'return', 'self', 'static', 'struct', 'super',
    'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while'
  ],
  typeKeywords: ['Self', 'i8', 'i16', 'i32', 'i64', 'u8', 'u16', 'u32', 'u64'],
  operators: ['+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>='],
  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  tokenizer: {
    root: [
      // Identificadores e keywords
      [/[a-z_$][\w$]*/, {
        cases: {
          '@keywords': 'keyword',
          '@typeKeywords': 'type',
          '@default': 'identifier'
        }
      }],
      // Numeros
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      [/\d+/, 'number'],
      // Strings
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
      // Comentarios
      [/\/\/.*$/, 'comment'],
      [/\/\*/, { token: 'comment.quote', next: '@comment' }]
    ],
    string: [
      [/[^"]+/, 'string'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
    ],
    comment: [
      [/[^/*]+/, 'comment'],
      [/\/\*/, { token: 'comment.quote', next: '@push' }],
      [/\*\//, { token: 'comment.quote', next: '@pop' }],
      [/[/*]/, 'comment']
    ]
  }
};
```

## Passo 4: Testar

1. Abrir arquivo `.rs`
2. Verificar syntax highlighting funciona
3. Verificar autocomplete funciona (Ctrl+Space)
4. Verificar go-to-definition funciona (F12)
5. Verificar diagnostics aparecem

## Checklist de Validacao

- [ ] Syntax highlighting funciona
- [ ] Autocomplete funciona
- [ ] Go to definition funciona
- [ ] Find references funciona
- [ ] Rename funciona
- [ ] Format document funciona
- [ ] Diagnostics aparecem
- [ ] Hover mostra informacoes

## Troubleshooting

### Problema: LSP nao inicia

**Verificar**: 
```bash
which rust-analyzer
```

**Solucao**: Instalar language server
```bash
# Rust
rustup component add rust-analyzer
```

### Problema: Autocomplete lento

**Verificar**: Memoria disponivel para LSP server

**Solucao**: Aumentar memoria ou ajustar configuracao do server

### Problema: Diagnostics nao aparecem

**Verificar**: LSP server esta rodando e conectado

**Solucao**: Verificar logs do LSP em Output panel
