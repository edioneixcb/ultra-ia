# Guia: Adicionar Novo View/Panel

## Pre-requisitos

- Conhecimento basico de React
- Entendimento do sistema de views

## Resultado Final

Novo painel registrado e exibido na UI.

## Passo 1: Criar Componente

### packages/ui/src/views/MyPanel.tsx

```typescript
export function MyPanel() {
  return (
    <div>
      <h2>My Panel</h2>
    </div>
  );
}
```

## Passo 2: Registrar View

### packages/core/src/views/registry.ts

```typescript
viewRegistry.register({
  id: 'my.panel',
  title: 'My Panel',
  component: MyPanel
});
```

## Passo 3: Adicionar ao Layout

### packages/ui/src/layout/defaultLayout.ts

```typescript
layout.addPanel({
  region: 'right',
  viewId: 'my.panel'
});
```

## Checklist de Validacao

- [ ] View registrada
- [ ] Aparece no layout
- [ ] Pode ser aberta/fechada
