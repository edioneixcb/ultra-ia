# Padrao: Adicionar Novo Comando

## Quando Usar

Sempre que criar funcionalidade acionavel pelo usuario (via Command Palette, menu, keybinding, etc).

## Implementacao Correta

```typescript
import { commands } from '@ultra-ide/core';

// 1. Definir ID unico com namespace
const COMMAND_ID = 'editor.formatDocument';

// 2. Definir tipos dos argumentos
interface FormatDocumentArgs {
  uri: string;
  options?: FormatOptions;
}

// 3. Handler tipado com validacao
async function formatDocumentHandler(args: FormatDocumentArgs): Promise<void> {
  // Validar args
  if (!args.uri) {
    throw new Error('uri is required');
  }
  
  // Executar logica
  const formatter = getFormatter();
  await formatter.format(args.uri);
  
  // Retornar resultado ou void
}

// 4. Registrar comando
commands.register(COMMAND_ID, formatDocumentHandler);
```

## Por Que Assim

- Namespace evita conflitos de ID
- Tipos garantem type-safety
- Validacao previne erros em runtime
- Handler assincrono permite operacoes async

## Checklist de Validacao

- [ ] ID tem namespace (modulo.acao)
- [ ] Args tem tipo definido
- [ ] Handler valida args
- [ ] Handler retorna resultado ou throw
- [ ] Comando documentado com JSDoc
- [ ] Contribuicoes definidas (se plugin)

---

## ANTI-PADRAO: Comando sem Namespace

### O Que E

Usar ID simples sem namespace.

### Por Que E Problema

Conflitos de ID entre plugins/modulos diferentes.

### Codigo ERRADO

```typescript
commands.register('format', handler); // Conflito potencial
```

### Codigo CORRETO

```typescript
commands.register('editor.formatDocument', handler); // Unico
```

---

## ANTI-PADRAO: Handler sem Validacao

### O Que E

Handler que nao valida argumentos antes de usar.

### Por Que E Problema

Erros em runtime, dificil debug.

### Codigo ERRADO

```typescript
commands.register('x', (args) => {
  doSomething(args.anything); // Pode ser undefined
});
```

### Codigo CORRETO

```typescript
commands.register('x', (args: MyArgs) => {
  if (!args.required) {
    throw new Error('required is missing');
  }
  doSomething(args.required);
});
```
