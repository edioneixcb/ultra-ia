# Template: Store Zustand

## Estrutura

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface [Nome]State {
  // Estado
  value: string;
  count: number;
  
  // Actions
  setValue: (value: string) => void;
  increment: () => void;
  reset: () => void;
}

export const use[Nome]Store = create<[Nome]State>()(
  persist(
    (set) => ({
      // Estado inicial
      value: '',
      count: 0,
      
      // Actions
      setValue: (value) => set({ value }),
      increment: () => set((state) => ({ count: state.count + 1 })),
      reset: () => set({ value: '', count: 0 }),
    }),
    {
      name: '[nome]-storage', // Nome da chave no storage
      // partialize: (state) => ({ value: state.value }), // Persistir apenas parte
    }
  )
);
```

## Uso em Componente

```typescript
import { use[Nome]Store } from '@ultra-ide/core/stores/[nome]';

function MyComponent() {
  const { value, setValue, increment } = use[Nome]Store();
  
  return (
    <div>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

## Uso com Selector (Performance)

```typescript
// Selecionar apenas o que precisa
const value = use[Nome]Store((state) => state.value);
const setValue = use[Nome]Store((state) => state.setValue);
```

## Checklist

- [ ] Estado tipado
- [ ] Actions documentadas
- [ ] Persistencia configurada se necessario
- [ ] Selectors otimizados para performance
- [ ] Testes escritos
