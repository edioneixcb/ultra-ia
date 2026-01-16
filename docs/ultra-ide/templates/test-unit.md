# Template: Teste Unitario

## Estrutura

```typescript
import { describe, it, expect } from 'vitest';
import { minhaFuncao } from './minhaFuncao';

describe('minhaFuncao', () => {
  it('deve retornar valor esperado', () => {
    const result = minhaFuncao('input');
    expect(result).toBe('output');
  });

  it('deve lancar erro em entrada invalida', () => {
    expect(() => minhaFuncao('')).toThrow('input invalido');
  });
});
```

## Checklist

- [ ] Teste cobre caso principal
- [ ] Teste cobre erro/edge case
- [ ] Sem dependencias externas reais
- [ ] Teste deterministico
