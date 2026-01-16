# Guia de Contribuicao

## Como Contribuir

### Reportar Problemas

1. Verificar se problema ja existe em [troubleshooting](./troubleshooting/)
2. Se nao existe, criar issue com:
   - Descricao clara do problema
   - Passos para reproduzir
   - Logs relevantes
   - Versao do Ultra-IDE
   - Sistema operacional

### Sugerir Mudancas

1. Verificar [criterios de decisao](./ULTRA-IDE-MASTER-SPEC.md#secao-2-criterios-de-decisao)
2. Justificar com base nos principios
3. Documentar trade-offs
4. Criar issue ou PR com proposta

### Implementar Features

1. Ler [documentacao master](./ULTRA-IDE-MASTER-SPEC.md)
2. Seguir [templates](./templates/) apropriados
3. Seguir [padroes](./patterns/) documentados
4. Usar [checklists](./ULTRA-IDE-MASTER-SPEC.md#secao-8-checklists-operacionais)
5. Escrever testes
6. Atualizar documentacao

### Criar Plugins

1. Seguir [guia de criacao de plugin](./guides/create-plugin.md)
2. Usar [template de plugin](./templates/plugin.md)
3. Documentar no README do plugin
4. Testar em diferentes cenarios

## Padroes de Codigo

- TypeScript strict mode
- ESLint configurado
- Prettier para formatacao
- Testes obrigatorios para core
- JSDoc em APIs publicas

## Processo de Review

1. PR deve passar todos os checks
2. Code review por pelo menos 1 pessoa
3. Testes devem passar
4. Documentacao atualizada
5. Changelog atualizado

## Duvidas?

Consulte a [documentacao master](./ULTRA-IDE-MASTER-SPEC.md) ou abra uma issue.
