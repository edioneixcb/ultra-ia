# Troubleshooting: Performance

## PROBLEMA: Startup lento

### Sintomas
- Demora > 3s para abrir

### Causas Comuns

1. **Muitos plugins ativados**
   - Solucao: desativar plugins nao usados

2. **Workspace grande**
   - Solucao: excluir node_modules/target/dist

3. **Cache invalido**
   - Solucao: limpar cache local

---

## PROBLEMA: Editor lento

### Sintomas
- Digitação com atraso
- Scroll travando

### Causas Comuns

1. **Arquivo muito grande**
   - Solucao: desativar features pesadas para arquivos > 5MB

2. **LSP pesado**
   - Solucao: limitar recursos do LSP

3. **Muitos diagnostics**
   - Solucao: reduzir frequência de validação
