# Como Usar o Sistema Ultra IA Offline

## 🌐 ACESSO PELA WEB

### Passo 1: Iniciar o Servidor

```bash
cd /caminho/para/seu/projeto/ultra-ia
npm run api
```

O servidor iniciará na porta 3000 (padrão).

### Passo 2: Acessar Interface Web

Abra seu navegador e acesse:
```
http://localhost:3000
```

### Passo 3: Usar a Interface

1. **Digite seu prompt** no campo de texto
   - Exemplo: "Criar uma função para validar email em JavaScript"

2. **Selecione a linguagem** (JavaScript, Python, TypeScript)

3. **Configure opções** (opcional):
   - ID da Sessão: para manter contexto entre requisições
   - Output Esperado: para validação automática

4. **Clique em "Gerar Código"**

5. **Visualize o resultado**:
   - Código gerado formatado
   - Estatísticas (iterações, duração, score)
   - Output da execução (se houver)

### Funcionalidades da Interface Web

- ✅ Geração de código com validação
- ✅ Visualização de estatísticas do sistema
- ✅ Histórico de execuções
- ✅ Feedback visual de sucesso/erro

---

## 💻 USO NO CURSOR IDE (RECOMENDADO)

### Por que usar no Cursor?

- **Integração nativa** - Código inserido automaticamente
- **Contexto automático** - Conhece seu projeto
- **Mais produtivo** - Sem copiar/colar
- **Offline completo** - Funciona sem internet

### Configuração Inicial

#### 1. Instalar Dependência MCP

```bash
cd /caminho/para/seu/projeto/ultra-ia
npm install @modelcontextprotocol/sdk
```

#### 2. Verificar Configuração MCP

O arquivo `~/.cursor/mcp.json` já deve conter:

```json
{
  "mcpServers": {
    "ultra-system": {
      "command": "node",
      "args": [
        "/caminho/para/seu/projeto/ultra-ia/src/mcp/ultra-mcp-server.js"
      ],
      "env": {
        "ULTRA_CONFIG_PATH": "/caminho/para/seu/projeto/ultra-ia/config/config.json"
      }
    }
  }
}
```

#### 3. Reiniciar o Cursor

Após adicionar o servidor MCP, reinicie o Cursor completamente.

#### 4. Verificar Conexão MCP

1. Abra o Cursor
2. Vá em `View > Output`
3. Selecione "MCP" no dropdown
4. Verifique se aparece: "Sistema Ultra MCP Server conectado ao Cursor"

### Como Usar no Cursor

#### Exemplo 1: Geração Simples

**No Cursor, digite:**
```
Crie uma função para validar CPF em JavaScript
```

**O que acontece:**
1. Cursor detecta necessidade de gerar código
2. Chama automaticamente `ultra_generate_code` via MCP
3. Sistema Ultra processa:
   - Analisa requisitos
   - Busca exemplos similares
   - Gera código validado
   - Executa em sandbox
   - Retorna código pronto
4. Cursor insere código no arquivo

#### Exemplo 2: Geração com Contexto

**No Cursor, digite:**
```
Crie um endpoint REST para listar usuários seguindo os padrões do projeto
```

**O que acontece:**
1. Sistema Ultra usa contexto da sessão atual
2. Busca padrões do projeto na Knowledge Base
3. Gera código alinhado com arquitetura existente
4. Valida segurança e boas práticas
5. Retorna código pronto para uso

#### Exemplo 3: Melhoria de Código

**Selecione uma função e digite:**
```
Melhore esta função seguindo os padrões do projeto
```

**O que acontece:**
1. Sistema analisa função selecionada
2. Busca padrões similares no projeto
3. Gera versão melhorada
4. Valida e testa
5. Substitui função pela versão melhorada

#### Exemplo 4: Indexação de Projeto

**No Cursor, digite:**
```
Indexe o codebase atual para a Knowledge Base
```

**O que acontece:**
1. Sistema indexa todos os arquivos do projeto
2. Extrai funções e classes
3. Armazena na Knowledge Base
4. Pronto para busca e reutilização

### Ferramentas Disponíveis no Cursor

Quando o servidor MCP estiver ativo, você pode usar comandos como:

1. **"Gere código para [descrição]"** → `ultra_generate_code`
2. **"Analise estes requisitos: [texto]"** → `ultra_analyze_requirements`
3. **"Indexe este projeto"** → `ultra_index_codebase`
4. **"Busque exemplos de [padrão]"** → `ultra_search_knowledge`
5. **"Valide este código"** → `ultra_validate_code`
6. **"Execute este código"** → `ultra_execute_code`
7. **"Mostre contexto da sessão"** → `ultra_get_context`
8. **"Estatísticas do sistema"** → `ultra_get_stats`

---

## 🔄 FLUXO COMPLETO DE USO

### Cenário Real: Desenvolvimento de Feature

1. **Indexar Projeto** (primeira vez)
   ```
   "Indexe o codebase atual"
   ```

2. **Gerar Nova Funcionalidade**
   ```
   "Crie um endpoint POST /api/users que valida dados e salva no banco"
   ```

3. **Sistema Ultra Processa:**
   - Analisa requisitos
   - Busca padrões similares no projeto
   - Gera código seguindo arquitetura existente
   - Valida segurança (SQL injection, XSS, etc.)
   - Executa testes básicos
   - Retorna código pronto

4. **Código Inserido Automaticamente**
   - Segue padrões do projeto
   - Validado e testado
   - Pronto para uso

5. **Refinamento (se necessário)**
   ```
   "Melhore este endpoint adicionando tratamento de erros"
   ```

---

## 📊 DIFERENÇAS ENTRE WEB E CURSOR

| Aspecto | Interface Web | Cursor IDE |
|---------|---------------|------------|
| **Uso** | Testes e demonstrações | Desenvolvimento diário |
| **Integração** | Manual (copiar/colar) | Automática |
| **Contexto** | Limitado | Completo do projeto |
| **Produtividade** | Baixa | Alta |
| **Ideal para** | Experimentação | Produção |

---

## 🎯 DICAS DE USO

### Para Melhores Resultados:

1. **Indexe seu projeto primeiro**
   - Permite busca de padrões
   - Gera código alinhado

2. **Use sessões consistentes**
   - Mantém contexto entre requisições
   - Aprende padrões do projeto

3. **Seja específico nos prompts**
   - "Criar função" → Bom
   - "Criar função para validar email em JavaScript que retorna boolean" → Melhor

4. **Use output esperado quando possível**
   - Validação automática
   - Refinamento iterativo

5. **Revise código gerado**
   - Sistema é poderoso mas não perfeito
   - Sempre revise antes de commitar

---

## 🚨 TROUBLESHOOTING

### Interface Web não carrega

```bash
# Verificar se servidor está rodando
curl http://localhost:3000/api/health

# Verificar logs
tail -f logs/system-*.log
```

### Cursor não encontra servidor MCP

1. Verificar se arquivo existe:
   ```bash
   ls -la /caminho/para/seu/projeto/ultra-ia/src/mcp/ultra-mcp-server.js
   ```

2. Verificar permissões:
   ```bash
   chmod +x /caminho/para/seu/projeto/ultra-ia/src/mcp/ultra-mcp-server.js
   ```

3. Verificar logs do Cursor:
   - View > Output > MCP
   - Procurar erros

### Erro "Cannot find module"

```bash
cd /caminho/para/seu/projeto/ultra-ia
npm install
```

### Docker não disponível

O sistema usa fallback automático. Para habilitar Docker:

```bash
# Verificar Docker
docker --version

# Se não instalado, instalar
sudo apt-get install docker.io
sudo usermod -aG docker $USER
```

---

## 📚 EXEMPLOS PRÁTICOS

### Exemplo 1: Validação de Email

**Prompt:** "Criar função para validar email em JavaScript"

**Resultado:**
```javascript
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
```

### Exemplo 2: Endpoint REST

**Prompt:** "Criar endpoint POST /api/users que valida dados e retorna JSON"

**Resultado:** Código completo com Express.js, validação Zod, tratamento de erros

### Exemplo 3: Classe Python

**Prompt:** "Criar classe Python para gerenciar conexões de banco de dados com pool"

**Resultado:** Classe completa com pool de conexões, retry logic, logging

---

## 🎓 APRENDENDO COM O SISTEMA

O Sistema Ultra aprende continuamente:

- **Exemplos Positivos**: Código aceito é armazenado
- **Anti-padrões**: Código rejeitado é evitado
- **Padrões do Projeto**: Codebase indexado é usado como referência
- **Contexto Histórico**: Sessões mantêm contexto

Quanto mais você usa, melhor fica!

---

**Pronto para começar? Inicie o servidor e comece a usar!** 🚀
