# ADR-007: Escolha do pnpm sobre npm/yarn

## Status
Aceita

## Contexto
Precisamos de gerenciador de pacotes para monorepo com workspaces eficientes.

## Decisao
Escolhemos pnpm como gerenciador de pacotes.

## Justificativa

### Eficiencia
- Armazenamento de conteudo por endereco (hard links)
- Economia de espaco em disco
- Instalacao mais rapida

### Workspaces
- Suporte nativo a workspaces
- Linking eficiente entre pacotes
- Filtros poderosos

### Seguranca
- Isolamento estrito de dependencias
- Prevencao de acesso a dependencias nao declaradas
- Melhor que npm/yarn em seguranca

## Alternativas Consideradas

1. **npm**
   - Pros: Padrao, vem com Node.js
   - Contras: Mais lento, menos eficiente em espaco
   - Decisao: Rejeitado por eficiencia

2. **yarn**
   - Pros: Rapido, bom suporte a workspaces
   - Contras: Menos eficiente em espaco que pnpm
   - Decisao: Rejeitado por eficiencia

## Consequencias

### Positivas
- Instalacao mais rapida
- Economia de espaco
- Melhor seguranca
- Workspaces eficientes

### Negativas
- Requer instalacao adicional
- Menos padrao que npm

## Reversibilidade
MEDIA - pnpm e usado em todo projeto, mas migracao e possivel.

## Referencias
- [pnpm](https://pnpm.io/)
- [pnpm vs npm/yarn](https://pnpm.io/motivation)
