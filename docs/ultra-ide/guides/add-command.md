# Guia: Adicionar Novo Comando

## Pre-requisitos

- Conhecimento basico de TypeScript
- Entendimento de Command Registry

## Resultado Final

Comando registrado, acessivel via Command Palette, menu e keybinding.

## Passo 1: Definir ID e Tipos

```typescript
const COMMAND_ID = 'editor.formatDocument';

interface FormatDocumentArgs {
  uri: string;
}
```

## Passo 2: Implementar Handler

```typescript
async function handler(args: FormatDocumentArgs): Promise<void> {
  if (!args.uri) {
    throw new Error('uri is required');
  }
  await formatter.format(args.uri);
}
```

## Passo 3: Registrar Comando

```typescript
commands.register(COMMAND_ID, handler);
```

## Passo 4: Contribuir (Plugin)

### package.json

```json
{
  "ultra-ide": {
    "contributes": {
      "commands": [
        { "id": "editor.formatDocument", "title": "Format Document" }
      ],
      "menus": {
        "commandPalette": [
          { "command": "editor.formatDocument", "when": "editorTextFocus" }
        ]
      },
      "keybindings": [
        { "command": "editor.formatDocument", "key": "shift+alt+f" }
      ]
    }
  }
}
```

## Passo 5: Testar

1. Abrir Command Palette
2. Executar comando
3. Verificar efeito esperado

## Checklist de Validacao

- [ ] ID com namespace
- [ ] Args tipados
- [ ] Handler valida args
- [ ] Comando visivel na Command Palette
- [ ] Keybinding funciona
