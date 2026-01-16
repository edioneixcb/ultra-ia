# Padrao: Criar Plugin

## Quando Usar

Sempre que for adicionar funcionalidade opcional ao sistema.

## Implementacao Correta

```typescript
const plugin: Plugin = {
  async activate(ctx) {
    ctx.commands.register('meu.plugin', async () => {
      ctx.ui?.showMessage('Plugin ativo', 'info');
    });
  },
  async deactivate() {
    // cleanup
  }
};
```

## Checklist

- [ ] Manifest com permissions minimas
- [ ] Activation events corretos
- [ ] Comandos registrados
- [ ] Cleanup em deactivate

---

## ANTI-PADRAO: Plugin com permissoes excessivas

Solicite apenas o necessario para reduzir risco e superficie de ataque.
