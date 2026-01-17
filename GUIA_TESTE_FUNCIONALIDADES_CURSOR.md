# 🧪 Guia Completo: Como Testar Funcionalidades do Ultra-IA no Cursor

**Data:** 16 de Janeiro de 2026  
**Versão:** 1.0.0

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Verificar Conexão MCP](#verificar-conexão-mcp)
3. [Ferramentas Disponíveis](#ferramentas-disponíveis)
4. [Testes Passo a Passo](#testes-passo-a-passo)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Pré-requisitos

Antes de testar, certifique-se de que:

1. **Ultra-IA está instalado e configurado**
   ```bash
   cd /home/edioneixcb/projetos/ultra-ia
   ./scripts/verificar-ativacao.sh
   ```

2. **Ollama está rodando**
   ```bash
   curl http://localhost:11434/api/tags
   # Se não estiver rodando:
   ollama serve
   ```

3. **Cursor está reiniciado completamente**
   - Feche TODAS as janelas do Cursor
   - Reabra o Cursor

---

## 🔍 Verificar Conexão MCP

### Passo 1: Abrir Output do MCP

1. No Cursor, vá em: **View > Output**
2. No dropdown no topo, selecione: **"MCP"**
3. Procure por: **"Sistema Ultra MCP Server conectado ao Cursor"**

✅ **Se aparecer essa mensagem, o servidor está conectado!**

### Passo 2: Verificar Ferramentas Disponíveis

No chat do Cursor, digite:
```
@ultra-system quais ferramentas você tem disponíveis?
```

Ou simplesmente pergunte:
```
Quais são as ferramentas do ultra-ia disponíveis?
```

O Cursor deve listar todas as ferramentas disponíveis.

---

## 🛠️ Ferramentas Disponíveis

O Ultra-IA expõe as seguintes ferramentas via MCP:

### 1. `ultra_generate_code`
**Descrição:** Gera código completo usando Sistema Ultra (análise, geração, validação, execução)

**Parâmetros:**
- `prompt` (obrigatório): Descrição do código a ser gerado
- `language` (opcional): `javascript`, `python`, `typescript`, `js`, `py`, `ts` (padrão: `javascript`)
- `sessionId` (opcional): ID da sessão para manter contexto (padrão: `cursor-session`)
- `expectedOutput` (opcional): Output esperado para validação
- `maxIterations` (opcional): Máximo de iterações de refinamento (padrão: 10)

### 2. `ultra_analyze_requirements`
**Descrição:** Analisa requisitos e identifica ambiguidades, requisitos faltantes e sugestões de melhoria

**Parâmetros:**
- `requirements` (obrigatório): Texto dos requisitos a analisar

### 3. `ultra_index_codebase`
**Descrição:** Indexa codebase para Knowledge Base (permite busca de padrões e exemplos)

**Parâmetros:**
- `codebasePath` (obrigatório): Caminho do codebase a indexar

### 4. `ultra_search_knowledge`
**Descrição:** Busca funções, classes ou padrões na Knowledge Base

**Parâmetros:**
- `query` (obrigatório): Query de busca (ex: "função validar email")
- `topK` (opcional): Número máximo de resultados (padrão: 5)

### 5. `ultra_validate_code`
**Descrição:** Valida código em múltiplas camadas (sintaxe, estrutura, segurança, boas práticas)

**Parâmetros:**
- `code` (obrigatório): Código a validar
- `language` (opcional): Linguagem do código (padrão: `javascript`)

### 6. `ultra_execute_code`
**Descrição:** Executa código em sandbox isolado (Docker) e retorna resultado

**Parâmetros:**
- `code` (obrigatório): Código a executar
- `language` (opcional): Linguagem do código (padrão: `javascript`)
- `expectedOutput` (opcional): Output esperado para validação

### 7. `ultra_get_context`
**Descrição:** Obtém contexto persistente de uma sessão

**Parâmetros:**
- `sessionId` (opcional): ID da sessão (padrão: `cursor-session`)
- `maxTokens` (opcional): Máximo de tokens (padrão: 5000)

### 8. `ultra_get_stats`
**Descrição:** Obtém estatísticas do sistema (Knowledge Base, execuções, contexto)

**Parâmetros:** Nenhum

### 9. `ultra_analyze_impact`
**Descrição:** Analisa impacto de mudança em arquivo específico

**Parâmetros:**
- `filePath` (obrigatório): Caminho do arquivo modificado
- `depth` (opcional): Profundidade de análise (1-5, padrão: 3)

### 10. `ultra_get_agent_memory`
**Descrição:** Recupera memórias de um agente específico

**Parâmetros:**
- `agentName` (obrigatório): Nome do agente
- `memoryType` (opcional): Tipo da memória (`decision`, `error`, `success`, `pattern`)

### 11. `ultra_run_guardians`
**Descrição:** Executa guardiões preditivos em código

**Parâmetros:**
- `code` (obrigatório): Código a analisar
- `runDependencyScan` (opcional): Executar scan de dependências (padrão: `false`)

### 12. `ultra_self_heal`
**Descrição:** Tenta auto-corrigir código com erros

**Parâmetros:**
- `code` (obrigatório): Código com erro
- `error` (obrigatório): Mensagem de erro
- `maxMutations` (opcional): Máximo de mutações (padrão: 5)

---

## 🧪 Testes Passo a Passo

### Teste 1: Geração de Código Simples

**No chat do Cursor, digite:**

```
Gere uma função JavaScript para validar email usando o ultra-ia
```

**Ou de forma mais explícita:**

```
Use ultra_generate_code para criar uma função que valida formato de email em JavaScript
```

**Resultado esperado:**
- Código gerado e inserido automaticamente
- Função completa com validação de regex
- Comentários explicativos
- Código validado e testado

---

### Teste 2: Geração de Código com Validação

**No chat do Cursor:**

```
Crie uma função Python que calcula fatorial e retorna o resultado para n=5
```

**O Ultra-IA deve:**
1. Gerar código Python
2. Executar código em sandbox
3. Validar que retorna 120 (5!)
4. Retornar código testado

---

### Teste 3: Análise de Requisitos

**No chat do Cursor:**

```
Analise estes requisitos usando ultra_analyze_requirements:

Preciso de um sistema de login que:
- Aceita email e senha
- Valida credenciais
- Retorna token JWT
```

**Resultado esperado:**
- Identificação de ambiguidades
- Requisitos faltantes (ex: recuperação de senha, rate limiting)
- Sugestões de melhoria
- Análise estruturada

---

### Teste 4: Busca na Knowledge Base

**No chat do Cursor:**

```
Busque na knowledge base por funções de validação de email
```

**Ou:**

```
Use ultra_search_knowledge para encontrar exemplos de funções de validação
```

**Resultado esperado:**
- Lista de funções encontradas
- Código relacionado
- Padrões identificados

---

### Teste 5: Validação de Código

**No chat do Cursor:**

```
Valide este código JavaScript:

function validarEmail(email) {
  return email.includes('@');
}
```

**Resultado esperado:**
- Análise de sintaxe
- Verificação de segurança
- Sugestões de melhoria
- Identificação de problemas potenciais

---

### Teste 6: Execução de Código

**No chat do Cursor:**

```
Execute este código Python e me mostre o resultado:

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```

**Resultado esperado:**
- Código executado em sandbox isolado
- Output: `55`
- Tempo de execução
- Status de sucesso/erro

---

### Teste 7: Estatísticas do Sistema

**No chat do Cursor:**

```
Mostre as estatísticas do sistema ultra-ia
```

**Ou:**

```
Use ultra_get_stats para ver o status da knowledge base
```

**Resultado esperado:**
- Número de funções indexadas
- Número de classes indexadas
- Estatísticas de execuções
- Status da Knowledge Base

---

### Teste 8: Análise de Impacto

**No chat do Cursor:**

```
Analise o impacto de modificar o arquivo src/utils/ConfigLoader.js
```

**Resultado esperado:**
- Lista de arquivos que dependem do arquivo
- Análise de impacto em cascata
- Sugestões de testes necessários

---

### Teste 9: Auto-Correção de Código

**No chat do Cursor:**

```
Corrija este código que tem erro:

function soma(a, b) {
  return a + b
}
```

**E informe o erro:**

```
O erro é: SyntaxError: Unexpected token
```

**Resultado esperado:**
- Código corrigido automaticamente
- Explicação da correção
- Versão funcional do código

---

### Teste 10: Indexação de Codebase

**No chat do Cursor:**

```
Indexe o codebase do projeto atual usando ultra_index_codebase
```

**Ou especifique um caminho:**

```
Indexe o diretório src/utils para a knowledge base
```

**Resultado esperado:**
- Arquivos indexados
- Funções e classes extraídas
- Padrões identificados
- Confirmação de conclusão

---

## 💡 Exemplos Práticos

### Exemplo 1: Criar Componente React Completo

```
Crie um componente React chamado UserCard que:
- Recebe props: name, email, avatar
- Exibe informações do usuário
- Tem estilo moderno
- É responsivo
```

### Exemplo 2: Criar API REST

```
Gere código para uma API REST em Node.js/Express que:
- Tem endpoint GET /users
- Retorna lista de usuários
- Usa async/await
- Tem tratamento de erros
```

### Exemplo 3: Criar Teste Unitário

```
Crie testes unitários usando Vitest para a função validarEmail
```

### Exemplo 4: Refatorar Código

```
Refatore este código para usar async/await em vez de callbacks:

function buscarDados(callback) {
  setTimeout(() => {
    callback(null, { dados: 'exemplo' });
  }, 1000);
}
```

---

## 🔧 Troubleshooting

### Problema: "Ferramenta não encontrada"

**Solução:**
1. Verifique se o servidor MCP está conectado (View > Output > MCP)
2. Reinicie o Cursor completamente
3. Verifique `~/.cursor/mcp.json` está correto

### Problema: "Timeout ao executar código"

**Solução:**
1. Verifique se Ollama está rodando: `curl http://localhost:11434/api/tags`
2. Verifique se Docker está disponível (para execução de código)
3. Aumente timeout na configuração se necessário

### Problema: "Knowledge Base vazia"

**Solução:**
1. Indexe o codebase primeiro: `ultra_index_codebase`
2. Verifique se o banco de dados existe: `ls -la data/knowledge-base/`
3. Execute o script de indexação: `node scripts/indexar-todos-projetos.js`

### Problema: "Erro ao validar código"

**Solução:**
1. Verifique a linguagem especificada está correta
2. Verifique se o código tem sintaxe válida básica
3. Veja os logs em `logs/` para mais detalhes

### Problema: "Código não é inserido automaticamente"

**Solução:**
1. O Cursor pode não inserir automaticamente em alguns casos
2. Copie o código gerado manualmente
3. Verifique se está no modo correto do Cursor (não em modo read-only)

---

## 📊 Verificando Logs

Para ver o que está acontecendo nos bastidores:

```bash
cd /home/edioneixcb/projetos/ultra-ia
tail -f logs/system-$(date +%Y-%m-%d).log
```

Ou veja os logs de erro:

```bash
tail -f logs/errors-$(date +%Y-%m-%d).log
```

---

## ✅ Checklist de Testes

Marque conforme testa cada funcionalidade:

- [ ] Geração de código JavaScript simples
- [ ] Geração de código Python com execução
- [ ] Geração de código TypeScript
- [ ] Análise de requisitos
- [ ] Busca na Knowledge Base
- [ ] Validação de código
- [ ] Execução de código em sandbox
- [ ] Obter estatísticas do sistema
- [ ] Análise de impacto de mudanças
- [ ] Auto-correção de código
- [ ] Indexação de codebase
- [ ] Obter contexto de sessão
- [ ] Executar guardiões preditivos
- [ ] Recuperar memórias de agente

---

## 🎯 Dicas de Uso

1. **Seja específico nos prompts:** Quanto mais detalhes, melhor o resultado
2. **Use contexto:** O Ultra-IA mantém contexto da sessão
3. **Itere:** Se o resultado não for perfeito, peça refinamentos
4. **Combine ferramentas:** Use análise de requisitos antes de gerar código
5. **Valide sempre:** Use validação de código após geração
6. **Indexe primeiro:** Indexe seu codebase para melhorar resultados

---

## 📝 Notas Importantes

- O Ultra-IA funciona **100% offline** usando Ollama local
- Todas as execuções de código são feitas em **sandbox isolado** (Docker)
- O sistema **aprende** com seu código através da Knowledge Base
- O contexto é **persistente** entre sessões

---

**Bons testes!** 🚀

Se encontrar problemas, verifique os logs ou execute:
```bash
cd /home/edioneixcb/projetos/ultra-ia
./scripts/verificar-funcionamento.js
```
