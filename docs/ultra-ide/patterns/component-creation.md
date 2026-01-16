# Padrao: Criar Componente UI

## Quando Usar

Sempre que criar novo componente React para UI.

## Implementacao Correta

```typescript
import { memo } from 'react';
import type { MyComponentProps } from './types';
import styles from './MyComponent.module.css';
import { cn } from '@ultra-ide/ui/utils';

export const MyComponent = memo(function MyComponent(props: MyComponentProps) {
  const { className, children, ...rest } = props;
  
  return (
    <div 
      className={cn(styles.root, className)} 
      role="region"
      aria-label="My component"
      {...rest}
    >
      {children}
    </div>
  );
});
```

## Por Que Assim

- memo() previne re-renders desnecessarios
- className suportado para customizacao
- Props tipadas garantem type-safety
- Acessibilidade com ARIA
- Spread de rest props permite extensao

## Checklist de Validacao

- [ ] Componente memoizado se necessario
- [ ] Props tipadas em arquivo separado
- [ ] className suportado
- [ ] ARIA labels se necessario
- [ ] Testes basicos escritos
- [ ] JSDoc em props publicas

---

## ANTI-PADRAO: Componente sem Memoizacao

### O Que E

Componente que re-renderiza mesmo quando props nao mudam.

### Por Que E Problema

Performance ruim, re-renders desnecessarios.

### Codigo ERRADO

```typescript
export function MyComponent(props: Props) {
  return <div>{props.value}</div>;
}
```

### Codigo CORRETO

```typescript
export const MyComponent = memo(function MyComponent(props: Props) {
  return <div>{props.value}</div>;
});
```

---

## ANTI-PADRAO: Props Drilling Excessivo

### O Que E

Passar props por muitos niveis de componentes.

### Por Que E Problema

Codigo verboso, dificil manutencao.

### Codigo ERRADO

```typescript
<A value={value}>
  <B value={value}>
    <C value={value}>
      <D value={value} />
    </C>
  </B>
</A>
```

### Codigo CORRETO

```typescript
// Usar Context ou State Management
const ValueContext = createContext(value);

<ValueContext.Provider value={value}>
  <A><B><C><D /></C></B></A>
</ValueContext.Provider>
```
