# Padrao: Registrar Evento

## Quando Usar

Para comunicar mudancas entre modulos sem acoplamento direto.

## Implementacao Correta

```typescript
// Registrar listener
const dispose = eventBus.on('file:opened', (uri) => {
  console.log('Arquivo aberto:', uri);
});

// Emitir evento
eventBus.emit('file:opened', 'file:///test.ts');

// Cleanup
dispose.dispose();
```

## Checklist

- [ ] Evento com namespace (modulo:evento)
- [ ] Payload tipado
- [ ] Cleanup em dispose

---

## ANTI-PADRAO: Emitir evento sem listener conhecido

Evitar eventos que ninguem consome. Documente todos os eventos publicos.
