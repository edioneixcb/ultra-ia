# Padrao: Persistir Estado

## Quando Usar

Para salvar configuracoes e estado entre sessoes.

## Implementacao Correta

```typescript
// Salvar
await storage.set('editor.tabSize', 2, 'workspace');

// Ler
const tabSize = await storage.get<number>('editor.tabSize', 'workspace');
```

## Checklist

- [ ] Chave com namespace
- [ ] Scope correto (global/workspace/user)
- [ ] Default definido

---

## ANTI-PADRAO: Persistir em storage global sem necessidade

Use scopes corretos para evitar conflitos entre workspaces.
