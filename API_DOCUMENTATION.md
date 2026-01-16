# Documentação da API REST - Sistema Ultra

## Base URL
```
http://localhost:3000
```

## Autenticação (Opcional)

Quando `api.auth.enabled` está ativo, a API exige credenciais:
- API Key: header `X-API-Key`
- JWT: header `Authorization: Bearer <token>` assinado com `api.auth.jwtSecret`

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
  "error": "Erro ao gerar código",
  "message": "Detalhes do erro"
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

### POST /api/validate
Valida código existente.

**Request Body:**
```json
{
  "code": "function test() { return 1; }",
  "language": "javascript"
}
```

**Response:**
```json
{
  "success": true,
  "validation": {
    "valid": true,
    "issues": [
      { "type": "warning", "message": "Indentação inconsistente detectada" }
    ],
    "errorCount": 0,
    "warningCount": 1,
    "score": 90
  }
}
```

**Exemplo:**
```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function test() { return 1; }",
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
  "config": {
    "valid": true,
    "errors": [],
    "warnings": []
  },
  "ollama": {
    "available": true,
    "models": ["deepseek-coder:6.7b", "llama3.1:8b"]
  },
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

### GET /api/search
Busca na knowledge base.

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| q | string | Texto de busca |
| limit | number | Limite de resultados (padrão: 10) |

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "type": "function",
      "name": "calculateTotal",
      "file": "src/utils/math.js",
      "language": "javascript",
      "similarity": 0.92
    }
  ],
  "count": 1
}
```

**Exemplo:**
```bash
curl "http://localhost:3000/api/search?q=calculate&limit=5"
```

---

### GET /api/history/:sessionId
Obtém histórico de execuções de uma sessão.

**Response:**
```json
{
  "success": true,
  "sessionId": "default",
  "messages": [
    {
      "role": "user",
      "content": "Criar função fatorial",
      "timestamp": "2025-01-09T12:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "function factorial(n) {...}",
      "timestamp": "2025-01-09T12:00:01.000Z"
    }
  ],
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

### GET /api/metrics
Retorna métricas do sistema em formato JSON.

**Response:**
```json
{
  "success": true,
  "data": {
    "counters": {
      "totalRequests": 1234,
      "totalErrors": 5,
      "startTime": 1705000000000
    },
    "requests": {},
    "errors": {},
    "system": {
      "memory": { "usagePercent": 45 },
      "cpu": { "loadAvg": [0.5, 0.6, 0.7] }
    }
  },
  "timestamp": "2026-01-14T17:00:00.000Z"
}
```

---

### GET /api/metrics/prometheus
Retorna métricas em formato Prometheus.

**Response:**
```text
# HELP http_requests_total Total de requisições HTTP
# TYPE http_requests_total counter
http_requests_total{method="POST",endpoint="/api/generate"} 100
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
