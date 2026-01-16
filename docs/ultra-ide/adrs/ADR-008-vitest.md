# ADR-008: Escolha do Vitest sobre Jest

## Status
Aceita

## Contexto
Precisamos de framework de testes rapido, compativel com Vite e TypeScript.

## Decisao
Escolhemos Vitest como framework de testes.

## Justificativa

### Performance
- Muito mais rapido que Jest
- Usa Vite para transformacao
- Hot reload de testes
- Execucao paralela eficiente

### Compatibilidade
- API compativel com Jest
- Suporta Jest matchers
- Migracao facil de Jest
- Funciona com Vite sem config extra

### TypeScript
- Suporte nativo TypeScript
- Type-checking integrado
- Melhor DX que Jest

## Alternativas Consideradas

1. **Jest**
   - Pros: Padrao da industria, amplamente usado
   - Contras: Mais lento, requer configuracao extra com Vite
   - Decisao: Rejeitado por performance e integracao

2. **Mocha**
   - Pros: Flexivel, leve
   - Contras: Requer mais configuracao, menos features
   - Decisao: Rejeitado por falta de features

## Consequencias

### Positivas
- Testes mais rapidos
- Melhor integracao com Vite
- Melhor DX
- TypeScript first-class

### Negativas
- Menos padrao que Jest
- Comunidade menor (mas crescendo)

## Reversibilidade
ALTA - Framework de testes e isolado, migracao seria refatorar testes.

## Referencias
- [Vitest](https://vitest.dev/)
- [Jest](https://jestjs.io/)
- [Vitest vs Jest](https://vitest.dev/guide/comparisons.html#jest)
