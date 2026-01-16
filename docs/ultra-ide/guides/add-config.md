# Guia: Adicionar Configuracao Persistente

## Pre-requisitos

- Conhecimento de IStorage
- Entendimento de Settings UI

## Resultado Final

Configuracao persistente visivel na UI e salva no storage.

## Passo 1: Definir Schema

### packages/core/src/settings/schema.ts

```typescript
settingsSchema.register('editor.tabSize', {
  type: 'number',
  default: 2,
  description: 'Numero de espacos por tab',
  scope: 'workspace'
});
```

## Passo 2: Adicionar Default

### packages/core/src/settings/defaults.ts

```typescript
export const defaults = {
  'editor.tabSize': 2
};
```

## Passo 3: Persistir no Storage

```typescript
await storage.set('editor.tabSize', 4, 'workspace');
const tabSize = await storage.get<number>('editor.tabSize', 'workspace');
```

## Passo 4: Expor na UI

### packages/ui/src/settings/SettingsPanel.tsx

```typescript
<NumberSetting
  label=\"Tab Size\"
  value={settings.get('editor.tabSize')}
  onChange={(v) => settings.set('editor.tabSize', v)}
/>;
```

## Checklist de Validacao

- [ ] Schema registrado
- [ ] Default definido
- [ ] Persistencia funcionando
- [ ] UI atualiza valor
- [ ] Valor aplicado no editor
