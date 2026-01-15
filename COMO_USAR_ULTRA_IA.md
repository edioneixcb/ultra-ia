# 🚀 Como Usar o Ultra-IA e Verificar o que Ele Aprendeu

## 📞 Como Chamar o Ultra-IA

### No Cursor IDE (Recomendado)

O Ultra-IA está integrado ao Cursor via MCP. Você pode chamá-lo de várias formas:

#### 1. **Comandos Diretos (Mais Fácil)**

Simplesmente digite no Cursor o que você precisa:

```
Mostre estatísticas do sistema Ultra-IA
```

```
Busque exemplos de funções React Native no projeto mailchat
```

```
Gere uma função para validar email em JavaScript
```

```
Valide este código seguindo os padrões do projeto atual
```

#### 2. **Ferramentas MCP Disponíveis**

O sistema detecta automaticamente quando você precisa usar uma ferramenta. Mas você também pode chamar diretamente:

**Geração de Código:**
```
Gere código para [descrição do que você precisa]
```

**Análise de Requisitos:**
```
Analise estes requisitos: [descreva o que precisa]
```

**Indexação:**
```
Indexe o codebase atual para a Knowledge Base
```

**Busca:**
```
Busque exemplos de [padrão/função] no projeto [nome]
```

**Validação:**
```
Valide este código: [cole o código]
```

**Execução:**
```
Execute este código: [cole o código]
```

**Contexto:**
```
Mostre contexto da sessão atual
```

**Estatísticas:**
```
Mostre estatísticas do sistema
```

---

## 🧠 Como Verificar o que o Ultra-IA Aprendeu

### 1. **Ver Estatísticas Gerais**

No Cursor, digite:
```
Mostre estatísticas do sistema Ultra-IA
```

**O que você verá:**
- Total de funções indexadas
- Total de classes indexadas
- Total de arquivos indexados
- Exemplos positivos aprendidos (gold examples)
- Anti-padrões aprendidos
- Taxa de sucesso de execuções

### 2. **Ver o que Foi Indexado**

No Cursor, digite:
```
Busque exemplos de [qualquer termo]
```

Por exemplo:
```
Busque exemplos de função validar
```

Isso mostra o que está na Knowledge Base.

### 3. **Ver Contexto da Sessão**

No Cursor, digite:
```
Mostre contexto da sessão atual
```

Isso mostra o histórico de interações e o que foi aprendido na sessão atual.

---

## 📊 Verificação Detalhada do Aprendizado

### Via Script (Mais Detalhado)

Execute no terminal:

```bash
cd /home/edioneixcb/projetos/ultra-ia
node scripts/verificar-funcionamento.js
```

Isso mostra:
- Estatísticas completas
- Projetos indexados
- Funcionalidades testadas
- Status do aprendizado

### Via Banco de Dados (Avançado)

```bash
# Ver total de funções aprendidas
sqlite3 /home/edioneixcb/sistema-ultra-ia/data/knowledge-base/knowledge-base.db \
  "SELECT COUNT(*) as total FROM functions;"

# Ver total de classes aprendidas
sqlite3 /home/edioneixcb/sistema-ultra-ia/data/knowledge-base/knowledge-base.db \
  "SELECT COUNT(*) as total FROM classes;"

# Ver exemplos positivos aprendidos
sqlite3 /home/edioneixcb/sistema-ultra-ia/data/knowledge-base/knowledge-base.db \
  "SELECT COUNT(*) as total FROM gold_examples;"

# Ver anti-padrões aprendidos
sqlite3 /home/edioneixcb/sistema-ultra-ia/data/knowledge-base/knowledge-base.db \
  "SELECT COUNT(*) as total FROM anti_patterns;"

# Ver arquivos indexados por projeto
sqlite3 /home/edioneixcb/sistema-ultra-ia/data/knowledge-base/knowledge-base.db \
  "SELECT file_path, COUNT(*) as funcoes FROM functions GROUP BY file_path ORDER BY funcoes DESC LIMIT 10;"
```

---

## 🎓 O que o Ultra-IA Aprendeu Até Agora

### ✅ **Indexação Inicial (Já Feito)**

- **573 funções** de 2 projetos principais
- **137 classes** indexadas
- **382 arquivos** processados

### 📚 **Projetos Indexados:**

1. **ultra-ia** (113 arquivos)
   - 162 funções aprendidas
   - 91 classes aprendidas
   - Padrões de código JavaScript/TypeScript

2. **mailchat-pro** (269 arquivos)
   - 411 funções aprendidas
   - 46 classes aprendidas
   - Padrões React Native, TypeScript

### 🔄 **Aprendizado Contínuo (Durante Uso)**

O sistema aprende automaticamente quando você:

1. **Aceita código gerado**
   - Código aceito vira "gold example"
   - Sistema aprende padrões de sucesso

2. **Rejeita código gerado**
   - Código rejeitado vira "anti-pattern"
   - Sistema evita padrões similares

3. **Usa código existente**
   - Sistema aprende preferências
   - Melhora sugestões futuras

---

## 💡 Exemplos Práticos de Uso

### Exemplo 1: Ver o que Foi Aprendido

**No Cursor:**
```
Mostre estatísticas do sistema Ultra-IA
```

**Resultado esperado:**
```
Estatísticas do Sistema Ultra:
- Funções: 573
- Classes: 137
- Arquivos: 382
- Exemplos Positivos: [número]
- Anti-padrões: [número]
```

### Exemplo 2: Buscar o que Foi Aprendido

**No Cursor:**
```
Busque exemplos de função validar email
```

**Resultado:** Mostra funções similares que foram indexadas dos projetos.

### Exemplo 3: Usar o que Foi Aprendido

**No Cursor:**
```
Gere uma função para validar CPF seguindo os padrões do projeto mailchat
```

**Resultado:** Sistema usa exemplos aprendidos do projeto mailchat para gerar código similar.

---

## 🔍 Verificação Rápida

### Checklist: O que o Ultra-IA Já Sabe?

Execute no terminal:

```bash
cd /home/edioneixcb/projetos/ultra-ia
node -e "
import('better-sqlite3').then(({ default: Database }) => {
  const db = new Database('/home/edioneixcb/sistema-ultra-ia/data/knowledge-base/knowledge-base.db');
  console.log('📊 O que o Ultra-IA aprendeu:\n');
  console.log('Funções:', db.prepare('SELECT COUNT(*) FROM functions').get()['COUNT(*)']);
  console.log('Classes:', db.prepare('SELECT COUNT(*) FROM classes').get()['COUNT(*)']);
  console.log('Arquivos:', db.prepare('SELECT COUNT(*) FROM indexed_files').get()['COUNT(*)']);
  console.log('Gold Examples:', db.prepare('SELECT COUNT(*) FROM gold_examples').get()['COUNT(*)']);
  console.log('Anti-padrões:', db.prepare('SELECT COUNT(*) FROM anti_patterns').get()['COUNT(*)']);
  db.close();
});
"
```

---

## 🎯 Resumo: Como Chamar e Verificar

### **Chamar o Ultra-IA:**

1. **No Cursor:** Digite o que precisa normalmente
   - O sistema detecta automaticamente
   - Exemplo: `"Gere função para validar email"`

2. **Comandos específicos:**
   - `"Mostre estatísticas do sistema"`
   - `"Busque exemplos de [X]"`
   - `"Gere código para [X]"`

### **Verificar o que Aprendeu:**

1. **Estatísticas gerais:**
   ```
   Mostre estatísticas do sistema Ultra-IA
   ```

2. **Buscar exemplos:**
   ```
   Busque exemplos de [termo]
   ```

3. **Via script:**
   ```bash
   node scripts/verificar-funcionamento.js
   ```

---

## 📝 Status Atual do Aprendizado

### ✅ **Já Aprendeu:**
- ✅ 573 funções de código
- ✅ 137 classes
- ✅ Padrões de 2 projetos principais
- ✅ Estrutura de código JavaScript/TypeScript
- ✅ Padrões React Native

### 🔄 **Aprenderá com Uso:**
- 🔄 Preferências de código (quando você aceitar/rejeitar)
- 🔄 Padrões específicos do seu estilo
- 🔄 Anti-padrões a evitar
- 🔄 Melhorias baseadas em feedback

---

**💡 Dica:** Quanto mais você usar o sistema, mais ele aprende sobre seus padrões e preferências!

---

**Última atualização:** 2026-01-14  
**Status:** ✅ Sistema ativo e aprendendo continuamente
