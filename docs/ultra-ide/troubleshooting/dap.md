# Troubleshooting: DAP (Debug Adapter Protocol)

## PROBLEMA: DAP nao inicia sessao de debug

### Sintomas
- Botao "Start Debugging" nao funciona
- Mensagem de erro ao iniciar debug
- Breakpoints nao sao atingidos

### Causas Comuns

1. **Debug adapter nao instalado**
   - Verificar: Adapter existe e esta no PATH
   - Solucao: Instalar debug adapter
     ```bash
     # Python
     pip install debugpy
     
     # Node.js (ja vem com Ultra-IDE)
     ```

2. **Launch.json incorreto**
   - Verificar: Arquivo .vscode/launch.json existe e esta correto
   - Solucao: Criar/corrigir launch.json
     ```json
     {
       "version": "0.2.0",
       "configurations": [
         {
           "type": "node",
           "request": "launch",
           "name": "Debug",
           "program": "${workspaceFolder}/index.js"
         }
       ]
     }
     ```

3. **Porta em uso**
   - Verificar: Porta de debug ja esta em uso
   - Solucao: Mudar porta ou matar processo

4. **Permissoes insuficientes**
   - Verificar: Permissao para criar processos
   - Solucao: Verificar permissoes do sistema

### Debug

1. Abrir Output panel
2. Selecionar "Debug" no dropdown
3. Verificar mensagens de erro
4. Verificar logs do adapter

### Ainda Nao Resolveu?

Abrir issue com:
- Versao do Ultra-IDE
- Sistema operacional
- Linguagem/runtime
- Logs completos do debug
- Conteudo do launch.json

---

## PROBLEMA: Breakpoints nao funcionam

### Sintomas
- Breakpoints nao sao atingidos
- Debug continua sem parar

### Causas Comuns

1. **Source maps incorretos**
   - Verificar: Source maps estao corretos?
   - Solucao: Verificar configuracao de build

2. **Caminho do arquivo incorreto**
   - Verificar: Caminho no adapter corresponde ao arquivo
   - Solucao: Ajustar sourcePathMapping

3. **Breakpoints em codigo otimizado**
   - Verificar: Codigo foi otimizado?
   - Solucao: Desabilitar otimizacoes em modo debug

### Debug

1. Verificar source maps
2. Verificar mapeamento de caminhos
3. Verificar configuracoes de build
