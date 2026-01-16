# Padrao: Comunicacao entre Modulos

## Quando Usar

Quando um modulo precisa acionar outro sem acoplamento direto.

## Implementacao Correta

```typescript
// Modulo A
eventBus.emit('editor:format', { uri });

// Modulo B
eventBus.on('editor:format', async ({ uri }) => {
  await formatter.format(uri);
});
```

## Alternativa: Comandos

```typescript
commands.execute('editor.formatDocument', { uri });
```

## Checklist

- [ ] Escolher entre evento ou comando
- [ ] Payload tipado
- [ ] Namespace consistente

---

## ANTI-PADRAO: Import direto entre modulos

Evitar acoplamento direto quando a comunicacao pode ser via evento/comando.
