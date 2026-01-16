# Troubleshooting: Terminal

## PROBLEMA: Terminal nao abre

### Sintomas
- Terminal panel vazio
- Mensagem de erro ao criar terminal

### Causas Comuns

1. **Shell nao encontrado**
   - Verificar: `which bash` ou `which powershell`
   - Solucao: Definir shell valido nas configuracoes

2. **Permissoes insuficientes**
   - Verificar: usuario tem permissao de executar processos?
   - Solucao: Ajustar permissoes do sistema

3. **node-pty nao disponivel**
   - Verificar: dependencias instaladas
   - Solucao: reinstalar dependencias ou rebuild nativo

### Debug

1. Abrir Output panel
2. Selecionar "Terminal"
3. Verificar logs de erro

---

## PROBLEMA: Terminal trava ou fica lento

### Sintomas
- Input com atraso
- Output lento

### Causas Comuns

1. **Buffer muito grande**
   - Solucao: Limitar scrollback

2. **Processo pesado**
   - Solucao: Verificar comandos em execucao

3. **Renderizacao lenta**
   - Solucao: Reduzir atualizacoes do terminal
