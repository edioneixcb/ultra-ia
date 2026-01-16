# ADR-004: Escolha do Zustand sobre Redux/Jotai

## Status
Aceita

## Contexto
Precisamos de gerenciamento de estado global simples, performatico e facil de usar.

## Decisao
Escolhemos Zustand como biblioteca de gerenciamento de estado.

## Justificativa

### Simplicidade
- API minimalista
- Sem boilerplate
- Facil de aprender
- Menos codigo que Redux

### Performance
- Re-renders apenas quando necessario
- Selectors otimizados
- Sem overhead de middleware complexo

### Tamanho
- ~1KB gzipped
- Sem dependencias pesadas
- Tree-shakeable

### Features
- Persistencia integrada
- DevTools support
- TypeScript first-class

## Alternativas Consideradas

1. **Redux Toolkit**
   - Pros: Padrao da industria, DevTools excelente
   - Contras: Muito boilerplate, curva de aprendizado, bundle maior
   - Decisao: Rejeitado por complexidade

2. **Jotai**
   - Pros: Atomic, composavel
   - Contras: Mais complexo, menos documentacao
   - Decisao: Rejeitado por complexidade

3. **Context API**
   - Pros: Built-in React
   - Contras: Performance issues, prop drilling
   - Decisao: Rejeitado por performance

## Consequencias

### Positivas
- Codigo mais simples
- Melhor performance
- Facil manutencao
- Bundle menor

### Negativas
- Menos padrao que Redux
- Comunidade menor que Redux

## Reversibilidade
ALTA - State management e isolado, migracao seria refatorar stores.

## Referencias
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Jotai](https://jotai.org/)
