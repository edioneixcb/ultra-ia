# Template: Plugin

## Estrutura de Arquivos

```
plugins/plugin-[nome]/
  package.json
  src/
    index.ts
    commands.ts          # Comandos (opcional)
    views.ts             # Views (opcional)
    types.ts             # Tipos
  README.md
```

## package.json

```json
{
  "name": "@ultra-ide/plugin-[nome]",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "ultra-ide": {
    "id": "[nome]",
    "name": "[Nome Display]",
    "version": "1.0.0",
    "apiVersion": "^1.0.0",
    "description": "[Descricao do plugin]",
    "author": "[Seu nome]",
    "permissions": [
      "filesystem.read",
      "ui.statusBar"
    ],
    "activationEvents": [
      "onCommand:[nome].*",
      "workspaceContains:**/*.[ext]"
    ],
    "contributes": {
      "commands": [
        {
          "id": "[nome].hello",
          "title": "Hello World"
        }
      ],
      "views": [
        {
          "id": "[nome].panel",
          "title": "[Nome do Panel]"
        }
      ]
    }
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch"
  },
  "devDependencies": {
    "@ultra-ide/core": "workspace:*",
    "typescript": "^5.0.0"
  }
}
```

## src/index.ts

```typescript
import type { Plugin, PluginContext } from '@ultra-ide/core';

const plugin: Plugin = {
  async activate(ctx: PluginContext) {
    // Registrar comandos
    ctx.commands.register('[nome].hello', async () => {
      ctx.ui?.showMessage('Hello from [nome] plugin!', 'info');
    });

    // Registrar views
    if (ctx.ui) {
      ctx.ui.registerView('[nome].panel', {
        render: () => <[Nome]Panel />
      });
    }

    // Observar eventos
    ctx.events.onDidOpenFile((uri) => {
      console.log('File opened:', uri);
    });

    // Usar storage
    await ctx.storage.set('activated', true);
  },

  async deactivate() {
    // Cleanup se necessario
  }
};

export default plugin;
```

## src/commands.ts (opcional)

```typescript
import type { PluginContext } from '@ultra-ide/core';

export function registerCommands(ctx: PluginContext): void {
  ctx.commands.register('[nome].command1', async () => {
    // Implementacao
  });

  ctx.commands.register('[nome].command2', async (arg: string) => {
    // Implementacao com argumento
  });
}
```

## README.md

```markdown
# Plugin [Nome]

[Descricao do plugin]

## Features

- Feature 1
- Feature 2

## Instalacao

[Instrucoes de instalacao]

## Uso

[Exemplos de uso]

## Configuracao

[Configuracoes disponiveis]
```

## Checklist

- [ ] Manifest completo e valido
- [ ] Permissoes minimas necessarias
- [ ] Activation events definidos
- [ ] Comandos registrados
- [ ] Views registradas (se aplicavel)
- [ ] Storage usado adequadamente
- [ ] Cleanup em deactivate
- [ ] README documentado
- [ ] Testes escritos (opcional)
