# ADR-001: Escolha do React sobre Solid.js

## Status
Aceita

## Contexto
Precisamos de um framework frontend com ecossistema maduro para construir uma IDE completa. A escolha do framework afeta toda a camada de UI e disponibilidade de componentes prontos.

## Decisao
Escolhemos React 18 como framework frontend principal.

## Justificativa

### Ecossistema
- Milhares de componentes prontos e testados
- Monaco Editor tem wrapper React oficial maduro
- xterm.js tem integracao React bem documentada
- React Arborist para file trees virtualizados
- Comunidade enorme e suporte ativo

### Facilidade de Contratacao
- React e amplamente conhecido
- Facil encontrar desenvolvedores React
- Curva de aprendizado menor para novos contribuidores

### Maturidade
- React 18 e estavel ha mais de 2 anos
- Padroes bem estabelecidos
- Ferramentas de desenvolvimento maduras

## Alternativas Consideradas

1. **Solid.js**
   - Pros: Mais leve (~8KB vs 44KB), melhor performance
   - Contras: Ecossistema pequeno, poucos componentes prontos, dificil contratacao
   - Decisao: Rejeitado por falta de ecossistema

2. **Vue 3**
   - Pros: Bom ecossistema, facil de aprender
   - Contras: Menos componentes para IDE especificamente, menos integracao com Monaco
   - Decisao: Rejeitado por falta de componentes especificos

3. **Svelte**
   - Pros: Muito leve, compilado
   - Contras: Ecossistema ainda menor, menos componentes para IDE
   - Decisao: Rejeitado por falta de ecossistema

## Consequencias

### Positivas
- Acesso a vasto ecossistema de componentes
- Facilidade de encontrar desenvolvedores
- Componentes prontos para IDE (Monaco, xterm, etc)
- Ferramentas de desenvolvimento maduras

### Negativas
- Bundle maior (~44KB React + react-dom)
- Overhead de Virtual DOM
- Performance ligeiramente inferior a Solid.js

## Reversibilidade
MEDIA - UI e separada do core via adapters, mas migracao seria trabalhosa devido ao tamanho do ecossistema React usado.

## Referencias
- [React 18 Docs](https://react.dev/)
- [Solid.js Comparison](https://www.solidjs.com/)
- [Monaco React](https://github.com/suren-atoyan/monaco-react)
