# Template: Adapter

## Estrutura de Arquivos

```
packages/core/src/adapters/I[Nome].ts          # Interface
packages/web/src/adapters/Web[Nome].ts         # Implementacao Web
packages/desktop/src/adapters/Tauri[Nome].ts   # Implementacao Desktop
```

## Interface (Core)

### packages/core/src/adapters/I[Nome].ts

```typescript
/**
 * Interface para [descricao]
 * 
 * Versao: 1.0.0
 */
export interface I[Nome] {
  /**
   * [Descricao do metodo]
   * 
   * @param param - [Descricao do parametro]
   * @returns [Descricao do retorno]
   * @throws [Tipo de erro] se [condicao]
   */
  method(param: Type): Promise<ReturnType>;
}
```

## Implementacao Web

### packages/web/src/adapters/Web[Nome].ts

```typescript
import type { I[Nome] } from '@ultra-ide/core';

export class Web[Nome] implements I[Nome] {
  async method(param: Type): Promise<ReturnType> {
    // Implementacao via HTTP API
    const response = await fetch('/api/[nome]/method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ param })
    });
    
    if (!response.ok) {
      throw new Error(`Failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

## Implementacao Desktop

### packages/desktop/src/adapters/Tauri[Nome].ts

```typescript
import type { I[Nome] } from '@ultra-ide/core';
import { invoke } from '@tauri-apps/api/core';

export class Tauri[Nome] implements I[Nome] {
  async method(param: Type): Promise<ReturnType> {
    // Implementacao via Tauri command
    return invoke<ReturnType>('[nome]_method', { param });
  }
}
```

## Registro do Adapter

### packages/core/src/adapters/index.ts

```typescript
import type { I[Nome] } from './I[Nome]';

export type { I[Nome] };
export { get[Nome] } from './[Nome]Factory';
```

### packages/core/src/adapters/[Nome]Factory.ts

```typescript
import type { I[Nome] } from './I[Nome]';

let instance: I[Nome] | null = null;

export function set[Nome](adapter: I[Nome]): void {
  instance = adapter;
}

export function get[Nome](): I[Nome] {
  if (!instance) {
    throw new Error('[Nome] adapter not initialized');
  }
  return instance;
}
```

## Checklist

- [ ] Interface documentada com JSDoc
- [ ] Implementacao Web criada
- [ ] Implementacao Desktop criada
- [ ] Factory criado
- [ ] Testes de contrato escritos
- [ ] Erros tratados adequadamente
