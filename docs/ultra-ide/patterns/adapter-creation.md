# Padrao: Criar Adapter

## Quando Usar

Quando precisar acessar funcionalidades diferentes entre Web e Desktop.

## Implementacao Correta

```typescript
// Core interface
export interface IClipboard {
  readText(): Promise<string>;
  writeText(text: string): Promise<void>;
}

// Web adapter
export class WebClipboard implements IClipboard {
  async readText() {
    return navigator.clipboard.readText();
  }
  async writeText(text: string) {
    await navigator.clipboard.writeText(text);
  }
}

// Desktop adapter (Tauri)
export class TauriClipboard implements IClipboard {
  async readText() {
    return invoke<string>('clipboard_read');
  }
  async writeText(text: string) {
    await invoke('clipboard_write', { text });
  }
}
```

## Checklist de Validacao

- [ ] Interface no core
- [ ] Implementacao Web
- [ ] Implementacao Desktop
- [ ] Factory para selecionar adapter
- [ ] Testes de contrato

---

## ANTI-PADRAO: Acesso direto a API de plataforma

**Erro**: usar `navigator` ou `invoke` diretamente no core.  
**Correto**: sempre via adapter.
