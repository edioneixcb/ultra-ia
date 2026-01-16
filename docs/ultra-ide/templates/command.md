# Template: Comando

## Definicao do Comando

```typescript
import { commands } from '@ultra-ide/core';

// ID unico com namespace
const COMMAND_ID = 'editor.formatDocument';

// Handler tipado
async function formatDocumentHandler(args: FormatDocumentArgs): Promise<void> {
  // Validar args
  if (!args.uri) {
    throw new Error('uri is required');
  }
  
  // Executar logica
  const formatter = getFormatter();
  await formatter.format(args.uri);
}

// Registrar comando
commands.register(COMMAND_ID, formatDocumentHandler);
```

## Tipos

```typescript
interface FormatDocumentArgs {
  uri: string;
  options?: FormatOptions;
}
```

## Contribuicao (se for de plugin)

### package.json

```json
{
  "ultra-ide": {
    "contributes": {
      "commands": [
        {
          "id": "editor.formatDocument",
          "title": "Format Document",
          "category": "Editor"
        }
      ],
      "menus": {
        "commandPalette": [
          {
            "command": "editor.formatDocument",
            "when": "editorTextFocus"
          }
        ],
        "editor/context": [
          {
            "command": "editor.formatDocument",
            "when": "editorTextFocus"
          }
        ]
      },
      "keybindings": [
        {
          "command": "editor.formatDocument",
          "key": "shift+alt+f",
          "when": "editorTextFocus"
        }
      ]
    }
  }
}
```

## Executar Comando

```typescript
import { commands } from '@ultra-ide/core';

// Executar
await commands.execute('editor.formatDocument', { uri: 'file:///test.ts' });
```

## Checklist

- [ ] ID tem namespace (modulo.acao)
- [ ] Args tem tipo definido
- [ ] Handler valida args
- [ ] Handler retorna resultado ou throw
- [ ] Comando documentado
- [ ] Contribuicoes definidas (se plugin)
- [ ] Keybinding definido (se aplicavel)
