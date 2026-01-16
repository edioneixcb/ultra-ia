# Template: Componente UI

## Estrutura de Arquivos

```
packages/ui/src/components/[Nome]/
  index.ts              # Re-export
  [Nome].tsx            # Componente
  [Nome].test.tsx       # Testes
  [Nome].module.css     # Estilos (opcional)
  types.ts              # Tipos
  hooks.ts              # Hooks especificos (opcional)
```

## Codigo Base

### index.ts

```typescript
export { [Nome] } from './[Nome]';
export type { [Nome]Props } from './types';
```

### [Nome].tsx

```typescript
import { memo } from 'react';
import type { [Nome]Props } from './types';
import styles from './[Nome].module.css';
import { cn } from '@ultra-ide/ui/utils';

export const [Nome] = memo(function [Nome](props: [Nome]Props) {
  const { className, ...rest } = props;
  
  return (
    <div className={cn(styles.root, className)} {...rest}>
      {/* conteudo */}
    </div>
  );
});
```

### types.ts

```typescript
export interface [Nome]Props {
  className?: string;
  // outras props
}
```

### [Nome].test.tsx

```typescript
import { render, screen } from '@testing-library/react';
import { [Nome] } from './[Nome]';

describe('[Nome]', () => {
  it('renders without crashing', () => {
    render(<[Nome] />);
    // assertions
  });
});
```

### [Nome].module.css (opcional)

```css
.root {
  /* estilos base */
}
```

## Checklist

- [ ] Componente memoizado se necessario
- [ ] Props tipadas
- [ ] className suportado
- [ ] Testes basicos escritos
- [ ] Acessibilidade (ARIA labels se necessario)
- [ ] Documentacao JSDoc em props publicas
