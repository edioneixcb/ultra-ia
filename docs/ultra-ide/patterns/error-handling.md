# Padrao: Tratamento de Erros

## Quando Usar

Sempre que operacao pode falhar (I/O, rede, validacao, etc).

## Implementacao Correta

```typescript
import { logger } from '@ultra-ide/core/utils';

async function readFile(uri: string): Promise<string> {
  try {
    const fs = getFileSystem();
    const content = await fs.read(uri);
    return new TextDecoder().decode(content);
  } catch (error) {
    // Log erro com contexto
    logger.error('Failed to read file', {
      uri,
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Re-throw com contexto adicional
    throw new FileReadError(`Failed to read ${uri}`, { cause: error });
  }
}
```

## Por Que Assim

- Try/catch captura erros explicitamente
- Logging ajuda debug
- Re-throw preserva stack trace
- Erros customizados sao mais informativos

## Checklist de Validacao

- [ ] Try/catch em operacoes async
- [ ] Erro logado com contexto
- [ ] Erro re-thrown ou tratado adequadamente
- [ ] Mensagem de erro clara para usuario
- [ ] Tipo de erro apropriado

---

## ANTI-PADRAO: Ignorar Erros Silenciosamente

### O Que E

Catch sem fazer nada ou apenas console.log.

### Por Que E Problema

Erros desaparecem, dificil debug, usuario nao sabe o que aconteceu.

### Codigo ERRADO

```typescript
try {
  await doSomething();
} catch (error) {
  // Ignorado silenciosamente
}

// Ou pior:
catch (error) {
  console.log(error); // Nao vai para logs estruturados
}
```

### Codigo CORRETO

```typescript
try {
  await doSomething();
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw error; // Ou tratar adequadamente
}
```

---

## ANTI-PADRAO: Catch Generico sem Tipo

### O Que E

Catch sem verificar tipo do erro.

### Por Que E Problema

Nao sabe que propriedades o erro tem, pode acessar propriedades inexistentes.

### Codigo ERRADO

```typescript
catch (error) {
  console.log(error.message); // Pode nao ter message
}
```

### Codigo CORRETO

```typescript
catch (error) {
  const message = error instanceof Error 
    ? error.message 
    : String(error);
  logger.error(message);
}
```
