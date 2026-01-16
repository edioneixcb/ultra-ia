# Troubleshooting: LSP (Language Server Protocol)

## PROBLEMA: LSP nao conecta

### Sintomas
- Autocomplete nao funciona
- Sem diagnostics
- Console mostra "LSP connection failed"
- Go to definition nao funciona

### Causas Comuns

1. **Server nao instalado**
   - Verificar: `which [language-server]` (ex: `which rust-analyzer`)
   - Solucao: Instalar language server
     ```bash
     # Rust
     rustup component add rust-analyzer
     
     # Python
     pip install python-lsp-server
     
     # TypeScript (ja vem com Ultra-IDE)
     ```

2. **Porta em uso**
   - Verificar: `lsof -i :[PORT]` ou `netstat -an | grep [PORT]`
   - Solucao: Matar processo ou mudar porta na configuracao

3. **Timeout de inicializacao**
   - Verificar: Logs mostram timeout
   - Solucao: Aumentar timeout em config/lsp-servers.json
     ```json
     {
       "rust": {
         "command": "rust-analyzer",
         "timeout": 30000
       }
     }
     ```

4. **Caminho incorreto**
   - Verificar: Comando nao encontrado
   - Solucao: Especificar caminho completo ou adicionar ao PATH

### Debug

1. Abrir Output panel (View > Output)
2. Selecionar "LSP" no dropdown
3. Verificar mensagens de erro
4. Copiar logs completos

### Ainda Nao Resolveu?

Abrir issue com:
- Versao do Ultra-IDE
- Sistema operacional
- Linguagem afetada
- Logs completos do LSP
- Versao do language server

---

## PROBLEMA: Autocomplete lento

### Sintomas
- Autocomplete demora > 1 segundo
- UI congela durante autocomplete

### Causas Comuns

1. **Projeto muito grande**
   - Verificar: Numero de arquivos no workspace
   - Solucao: Excluir node_modules, target, dist do indexacao

2. **Memoria insuficiente**
   - Verificar: Uso de memoria do processo LSP
   - Solucao: Aumentar memoria disponivel ou reduzir escopo

3. **Server nao otimizado**
   - Verificar: Versao do language server
   - Solucao: Atualizar para versao mais recente

### Debug

1. Verificar performance do LSP server
2. Verificar tamanho do workspace
3. Verificar configuracoes de indexacao

---

## PROBLEMA: Diagnostics nao aparecem

### Sintomas
- Erros no codigo nao sao destacados
- Problems panel vazio

### Causas Comuns

1. **LSP nao inicializado**
   - Verificar: LSP esta conectado?
   - Solucao: Ver problema "LSP nao conecta"

2. **Diagnostics desabilitados**
   - Verificar: Settings > LSP > Enable Diagnostics
   - Solucao: Habilitar diagnostics

3. **Server nao suporta diagnostics**
   - Verificar: Capabilities do server
   - Solucao: Verificar documentacao do language server

### Debug

1. Verificar capabilities do LSP
2. Verificar settings de diagnostics
3. Verificar logs do LSP
