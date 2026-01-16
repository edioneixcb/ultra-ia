# Troubleshooting: Colaboracao (CRDT/Yjs)

## PROBLEMA: Colaboracao nao sincroniza

### Sintomas
- Alteracoes nao aparecem para outros usuarios
- Cursores nao aparecem

### Causas Comuns

1. **Servidor de colaboracao offline**
   - Verificar: WebSocket server online?
   - Solucao: Iniciar servidor de colaboracao

2. **Erro de rede**
   - Verificar: conexao com servidor
   - Solucao: verificar firewall/proxy

3. **Room ID incorreto**
   - Verificar: usuarios estao no mesmo room?
   - Solucao: garantir roomId igual

### Debug

1. Abrir Output panel
2. Selecionar "Collaboration"
3. Verificar logs de conexao

---

## PROBLEMA: Conflitos de texto

### Sintomas
- Texto duplicado ou corrompido

### Causas Comuns

1. **Versao de Yjs incompatível**
   - Solucao: garantir mesma versao para todos

2. **Offline long time**
   - Solucao: ressincronizar ao reconectar
