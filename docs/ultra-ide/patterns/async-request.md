# Padrao: Requisicao Async

## Quando Usar

Para chamadas HTTP ou IPC que podem falhar.

## Implementacao Correta

```typescript
async function fetchConfig() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch('/api/config', { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}
```

## Checklist

- [ ] Timeout definido
- [ ] Erros tratados
- [ ] AbortController usado
- [ ] Logs em falha

---

## ANTI-PADRAO: Fetch sem timeout

Evite requests que podem travar indefinidamente.
