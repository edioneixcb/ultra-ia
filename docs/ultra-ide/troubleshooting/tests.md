# Troubleshooting: Testes

## PROBLEMA: Testes unitarios falhando

### Sintomas
- `vitest` retorna erro

### Causas Comuns

1. **Mocks incorretos**
   - Solucao: revisar mocks e fixtures

2. **Dependencias desatualizadas**
   - Solucao: limpar cache e reinstalar

3. **Estado global nao isolado**
   - Solucao: resetar estado entre testes

---

## PROBLEMA: Testes E2E falhando

### Sintomas
- Playwright nao encontra elemento

### Causas Comuns

1. **UI mudou**
   - Solucao: atualizar selectors

2. **Timeout baixo**
   - Solucao: aumentar timeout

3. **App nao iniciou**
   - Solucao: garantir server rodando antes do teste
