# Padrao: Criar Store (Zustand)

## Quando Usar

Quando precisar compartilhar estado global entre componentes.

## Implementacao Correta

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditorState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme })
    }),
    { name: 'editor-settings' }
  )
);
```

## Checklist

- [ ] Estado tipado
- [ ] Actions claras
- [ ] Persistencia se necessario
- [ ] Selectors para performance

---

## ANTI-PADRAO: Estado global mutavel

Nao usar objetos globais fora do store.
