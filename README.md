# Sistema Ultra - IA Offline para Geração de Código

Sistema completo de geração de código usando IA offline (Ollama) com prevenção de alucinações, validação multi-camadas e refinamento iterativo.

## 🚀 Características

- **Geração de Código Inteligente**: Usa LLM local (Ollama) com RAG e prevenção de alucinações
- **Validação Multi-Camadas**: Sintaxe, estrutura, segurança, boas práticas e testes
- **Refinamento Automático**: Refina código iterativamente até funcionar
- **Contexto Persistente**: Mantém contexto entre requisições
- **Aprendizado Contínuo**: Aprende de sucessos e falhas
- **API REST**: Interface HTTP completa
- **Interface Web**: Interface gráfica para uso

## 📋 Pré-requisitos

- Node.js 18.x ou superior
- Ollama instalado e rodando
- Modelos Ollama instalados (deepseek-coder:6.7b recomendado)

## 🛠️ Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd sistema-ultra-ia

# Instalar dependências
npm install

# Configurar Ollama (se necessário)
# Certifique-se de que Ollama está rodando em http://localhost:11434
```

## ⚙️ Configuração

Edite `config/config.json` para configurar:

```json
{
  "services": {
    "ollama": {
      "url": "http://localhost:11434",
      "defaultModel": "deepseek-coder:6.7b"
    }
  },
  "models": {
    "primary": "deepseek-coder:6.7b",
    "secondary": "llama3.1:8b"
  }
}
```

## 🎯 Uso

### Uso Programático

```javascript
import ultraSystem from './src/index.js';

const result = await ultraSystem.process(
  'Criar uma função JavaScript para validar email',
  {
    sessionId: 'minha-sessao',
    language: 'javascript'
  }
);

if (result.success) {
  console.log(result.result.code);
}
```

### API REST

```bash
# Iniciar servidor
npm run api

# Gerar código via API
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Criar função para validar email",
    "language": "javascript"
  }'
```

### Interface Web

```bash
# Iniciar servidor
npm run api

# Acessar interface web
# Abra http://localhost:3000 no navegador
```

### Exemplos

```bash
# Exemplo básico
npm run example:basic

# Exemplo avançado
npm run example:advanced
```

## 📚 Documentação

- [Documentação da API](./API_DOCUMENTATION.md)
- [Exemplos de Uso](./examples/)
- [Status da Implementação](./STATUS_IMPLEMENTACAO.md)

## 🏗️ Arquitetura

O sistema é composto por:

### Fase 0: Fundação
- ConfigLoader - Sistema de configuração
- Logger - Logging estruturado
- ErrorHandler - Tratamento de erros

### Fase 1: Componentes Base
- DynamicKnowledgeBase - Indexação e busca de código
- PersistentContextManager - Gerenciamento de contexto
- RequirementAnalyzer - Análise de requisitos

### Fase 2: Geração
- HallucinationPreventionGenerator - Geração com RAG
- MultiLayerValidator - Validação multi-camadas
- StructuredCodeGenerator - Geração estruturada

### Fase 3: Integração
- ExecutionFeedbackSystem - Execução e feedback
- UltraSystem - Orquestrador principal

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes de integração
npm run test:integration
```

## 📊 Estatísticas

- **Total de código**: ~5,400 linhas
- **Componentes**: 11 componentes principais
- **Testes**: Cobertura completa
- **Linguagens suportadas**: JavaScript, Python, TypeScript

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📝 Licença

MIT License

## 🙏 Agradecimentos

- Ollama por fornecer LLM local
- Comunidade open source

---

**Desenvolvido com ❤️ usando IA Offline**
