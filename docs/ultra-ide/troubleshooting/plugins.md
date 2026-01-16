# Troubleshooting: Plugins

## PROBLEMA: Plugin nao ativa

### Sintomas
- Plugin instalado mas nao funciona
- Comandos do plugin nao aparecem
- Sem erros visiveis

### Causas Comuns

1. **Manifest invalido**
   - Verificar: package.json tem secao "ultra-ide" valida
   - Solucao: Validar JSON e estrutura do manifest

2. **Activation events nao atendidos**
   - Verificar: Eventos de ativacao estao corretos?
   - Solucao: Verificar activationEvents no manifest

3. **Permissoes insuficientes**
   - Verificar: Plugin tem permissoes necessarias?
   - Solucao: Adicionar permissoes ao manifest

4. **Erro na ativacao**
   - Verificar: Logs de erro na ativacao
   - Solucao: Verificar Output > Plugins para erros

### Debug

1. Abrir Output panel
2. Selecionar "Plugins" no dropdown
3. Verificar mensagens de erro
4. Verificar logs de ativacao

### Ainda Nao Resolveu?

Abrir issue com:
- Versao do Ultra-IDE
- Plugin afetado e versao
- Logs completos do plugin
- Manifest do plugin

---

## PROBLEMA: Plugin causa crash

### Sintomas
- Ultra-IDE fecha inesperadamente
- Erro ao usar funcionalidade do plugin

### Causas Comuns

1. **Plugin malicioso ou bugado**
   - Verificar: Plugin e de fonte confiavel?
   - Solucao: Desabilitar plugin e reportar

2. **Incompatibilidade de versao**
   - Verificar: apiVersion do plugin compativel?
   - Solucao: Atualizar plugin ou Ultra-IDE

3. **Memory leak**
   - Verificar: Uso de memoria aumenta
   - Solucao: Verificar cleanup em deactivate()

### Debug

1. Desabilitar plugin
2. Verificar se problema desaparece
3. Verificar logs de crash
4. Reportar ao desenvolvedor do plugin
