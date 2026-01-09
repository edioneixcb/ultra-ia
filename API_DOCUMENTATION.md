# Documentação da API REST - Sistema Ultra

## Base URL
```
http://localhost:3000
```

## Endpoints

### POST /api/generate
Gera código baseado em um prompt.

**Request Body:**
```json
{
  "prompt": "string (obrigatório)",
  "sessionId": "string (opcional, padrão: 'default')",
  "projectId": "string (opcional)",
  "language": "string (opcional, padrão: 'javascript')",
  "expectedOutput": "string (opcional)",
  "maxIterations": "number (opcional, padrão: 10)",
  "enableRefinement": "boolean (opcional, padrão: true)"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "requestId": "string",
  "result": {
    "code": "string",
    "language": "string",
    "validation": {
      "valid": true,
      "score": 85
    },
    "execution": {
      "success": true,
      "stdout": "string",
      "matchesExpected": true
    }
  },
  "iterations": 2,
  "duration": 1234,
  "requirements": {
    "valid": true,
    "completeness": 0.8
  }
}
```

**Response (Erro):**
```json
{
  "success": false,
  "error": {
    "type": "string",
    "message": "string",
    "suggestions": ["string"]
  }
}
```

**Exemplo:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Criar função para validar email",
    "language": "javascript"
  }'
```

---

### GET /api/health
Verifica status de saúde do sistema.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T12:00:00.000Z",
  "components": {
    "knowledgeBase": true,
    "context": true,
    "execution": true
  },
  "stats": {
    "knowledgeBase": {
      "functions": 150,
      "classes": 30,
      "files": 50
    },
    "execution": {
      "total": 100,
      "successRate": 85.5
    }
  }
}
```

**Exemplo:**
```bash
curl http://localhost:3000/api/health
```

---

### GET /api/stats
Obtém estatísticas detalhadas do sistema.

**Response:**
```json
{
  "success": true,
  "stats": {
    "knowledgeBase": {
      "functions": 150,
      "classes": 30,
      "files": 50,
      "goldExamples": 25,
      "antiPatterns": 5
    },
    "execution": {
      "total": 100,
      "successful": 85,
      "failed": 15,
      "successRate": 85.0,
      "averageDuration": 1234.5
    },
    "context": {
      "sessions": 10
    }
  }
}
```

**Exemplo:**
```bash
curl http://localhost:3000/api/stats
```

---

### GET /api/models
Lista modelos disponíveis configurados.

**Response:**
```json
{
  "success": true,
  "ollamaUrl": "http://localhost:11434",
  "models": {
    "primary": "deepseek-coder:6.7b",
    "secondary": "llama3.1:8b"
  },
  "note": "Modelos configurados no sistema. Verifique Ollama para modelos instalados."
}
```

**Exemplo:**
```bash
curl http://localhost:3000/api/models
```

---

### POST /api/index
Indexa um codebase para a knowledge base.

**Request Body:**
```json
{
  "codebasePath": "string (obrigatório)"
}
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "filesIndexed": 50,
    "totalFunctions": 150,
    "totalClasses": 30,
    "totalFiles": 50
  }
}
```

**Exemplo:**
```bash
curl -X POST http://localhost:3000/api/index \
  -H "Content-Type: application/json" \
  -d '{
    "codebasePath": "./src"
  }'
```

---

### GET /api/history/:sessionId
Obtém histórico de execuções de uma sessão.

**Response:**
```json
{
  "success": true,
  "sessionId": "default",
  "history": [
    {
      "success": true,
      "executionId": "default-1234567890",
      "language": "javascript",
      "duration": 1234,
      "timestamp": "2025-01-09T12:00:00.000Z"
    }
  ],
  "stats": {
    "total": 10,
    "successful": 8,
    "failed": 2,
    "successRate": 80.0,
    "averageDuration": 1234.5
  }
}
```

**Exemplo:**
```bash
curl http://localhost:3000/api/history/default
```

---

## Códigos de Status HTTP

- `200` - Sucesso
- `400` - Requisição inválida (parâmetros faltando ou incorretos)
- `500` - Erro interno do servidor

---

## Linguagens Suportadas

- `javascript` (padrão)
- `python`
- `typescript`

---

## Exemplos de Uso

### JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3000/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Criar função para validar email',
    language: 'javascript'
  })
});

const data = await response.json();
console.log(data.result.code);
```

### Python
```python
import requests

response = requests.post('http://localhost:3000/api/generate', json={
    'prompt': 'Criar função para validar email',
    'language': 'python'
})

data = response.json()
print(data['result']['code'])
```

### cURL
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Criar função para validar email",
    "language": "javascript",
    "sessionId": "minha-sessao"
  }'
```

---

## Notas

- O sistema mantém contexto entre requisições usando `sessionId`
- Use `enableRefinement: true` para refinamento automático de código
- `maxIterations` controla quantas tentativas serão feitas
- `expectedOutput` permite validação de output esperado
