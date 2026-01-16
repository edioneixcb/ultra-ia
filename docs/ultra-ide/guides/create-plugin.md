# Guia: Criar Plugin Completo do Zero

## Pre-requisitos

- Node.js 18+
- Conhecimento de TypeScript
- Entendimento basico do sistema de plugins

## Resultado Final

Plugin funcional que pode ser instalado e usado no Ultra-IDE.

## Passo 1: Criar Estrutura do Projeto

```bash
mkdir -p plugins/plugin-exemplo/{src,tests}
cd plugins/plugin-exemplo
```

## Passo 2: Criar package.json

### package.json

```json
{
  "name": "@ultra-ide/plugin-exemplo",
  "version": "1.0.0",
  "description": "Plugin de exemplo",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "ultra-ide": {
    "id": "exemplo",
    "name": "Plugin Exemplo",
    "version": "1.0.0",
    "apiVersion": "^1.0.0",
    "description": "Um plugin de exemplo",
    "author": "Seu Nome",
    "permissions": [
      "filesystem.read",
      "ui.statusBar"
    ],
    "activationEvents": [
      "onCommand:exemplo.*"
    ],
    "contributes": {
      "commands": [
        {
          "id": "exemplo.hello",
          "title": "Hello World"
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

## Passo 3: Criar tsconfig.json

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Passo 4: Implementar Plugin

### src/index.ts

```typescript
import type { Plugin, PluginContext } from '@ultra-ide/core';

const plugin: Plugin = {
  async activate(ctx: PluginContext) {
    // Registrar comando
    ctx.commands.register('exemplo.hello', async () => {
      ctx.ui?.showMessage('Hello from exemplo plugin!', 'info');
    });

    // Registrar status bar item
    if (ctx.ui) {
      const statusBarItem = ctx.ui.registerStatusBarItem({
        text: 'Exemplo',
        tooltip: 'Plugin de exemplo ativo',
        priority: 100
      });
    }

    // Observar eventos
    ctx.events.onDidOpenFile((uri) => {
      console.log('File opened:', uri);
    });

    // Usar storage
    await ctx.storage.set('activated', Date.now());
    const lastActivated = await ctx.storage.get<number>('activated');
    console.log('Last activated:', lastActivated);
  },

  async deactivate() {
    console.log('Plugin exemplo deactivated');
  }
};

export default plugin;
```

## Passo 5: Build

```bash
npm run build
```

## Passo 6: Testar Localmente

1. Copiar plugin para `plugins/plugin-exemplo`
2. Reiniciar Ultra-IDE
3. Abrir Command Palette (Ctrl+Shift+P)
4. Executar "Hello World"
5. Verificar mensagem aparece

## Checklist de Validacao

- [ ] Plugin compila sem erros
- [ ] Manifest valido
- [ ] Comandos registrados corretamente
- [ ] Storage funciona
- [ ] Eventos funcionam
- [ ] UI elements aparecem
- [ ] Deactivate funciona

## Troubleshooting

### Problema: Plugin nao aparece

**Verificar**: Manifest esta correto e plugin esta na pasta certa

**Solucao**: Verificar logs em Output > Plugins

### Problema: Permissao negada

**Verificar**: Permissions no manifest incluem o necessario

**Solucao**: Adicionar permissao necessaria ao manifest

### Problema: Comando nao aparece

**Verificar**: Activation events incluem o comando

**Solucao**: Adicionar `onCommand:exemplo.*` aos activation events
