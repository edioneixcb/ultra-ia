# Ultra-IA API Documentation

## Visão Geral

A API do Ultra-IA fornece endpoints para geração de código assistida por IA, validação, busca na knowledge base e gerenciamento de contexto.

**URL Base:** `http://localhost:3000/api`

## Autenticação

A API suporta autenticação via API Key (header `X-API-Key`) e JWT (header `Authorization: Bearer <token>`).

```bash
# Usando API Key
curl -H "X-API-Key: sua-api-key" http://localhost:3000/api/health

# Usando JWT
curl -H "Authorization: Bearer seu-jwt-token" http://localhost:3000/api/health
```

## Rate Limiting

- **Por IP:** 100 requests por minuto
- **Por usuário autenticado:** 1000 requests por minuto
- **Endpoint /api/generate:** 20 requests por minuto
- **Endpoint /api/index:** 10 requests por 5 minutos

Headers de rate limit incluídos nas respostas:
- `X-RateLimit-Limit`: Limite máximo
- `X-RateLimit-Remaining`: Requests restantes
- `X-RateLimit-Reset`: Timestamp de reset

## Endpoints

### Health Check

```http
GET /api/health
```

Verifica o status do sistema.

**Resposta:**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-14T17:00:00.000Z",
  "components": {
    "ollama": "available",
    "knowledgeBase": "connected",
    "contextManager": "connected"
  }
}
```

---

### Gerar Código

```http
POST /api/generate
```

Gera código com base em um prompt.

**Body:**

```json
{
  "prompt": "Criar uma função que calcula fatorial",
  "sessionId": "session-123",
  "projectId": "meu-projeto",
  "language": "javascript",
  "maxIterations": 5,
  "enableRefinement": true
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| prompt | string | Sim | Descrição do código desejado |
| sessionId | string | Não | ID da sessão (para manter contexto) |
| projectId | string | Não | ID do projeto |
| language | string | Não | Linguagem de programação (padrão: javascript) |
| maxIterations | number | Não | Máximo de iterações de refinamento |
| enableRefinement | boolean | Não | Habilitar refinamento automático |

**Resposta:**

```json
{
  "success": true,
  "requestId": "req-abc123",
  "sessionId": "session-123",
  "code": "function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}",
  "language": "javascript",
  "validation": {
    "valid": true,
    "issues": []
  },
  "iterations": 1,
  "duration": 1234,
  "timestamp": "2026-01-14T17:00:00.000Z"
}
```

---

### Validar Código

```http
POST /api/validate
```

Valida código existente.

**Body:**

```json
{
  "code": "function test() { return 1; }",
  "language": "javascript"
}
```

**Resposta:**

```json
{
  "success": true,
  "validation": {
    "valid": true,
    "issues": [],
    "errorCount": 0,
    "warningCount": 0
  }
}
```

---

### Indexar Codebase

```http
POST /api/index
```

Indexa arquivos de um diretório na Knowledge Base.

**Body:**

```json
{
  "path": "/caminho/para/projeto",
  "patterns": ["**/*.js", "**/*.ts"],
  "projectId": "meu-projeto"
}
```

**Resposta:**

```json
{
  "success": true,
  "indexed": {
    "files": 42,
    "functions": 128,
    "classes": 23
  },
  "duration": 5678
}
```

---

### Buscar na Knowledge Base

```http
GET /api/search?q=query&limit=10
```

Busca na Knowledge Base.

**Query Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| q | string | Texto de busca |
| limit | number | Limite de resultados (padrão: 10) |
| projectId | string | Filtrar por projeto |

**Resposta:**

```json
{
  "success": true,
  "results": [
    {
      "type": "function",
      "name": "calculateTotal",
      "file": "src/utils/math.js",
      "similarity": 0.92
    }
  ],
  "count": 1
}
```

---

### Histórico de Sessão

```http
GET /api/history/:sessionId
```

Obtém histórico de mensagens de uma sessão.

**Resposta:**

```json
{
  "success": true,
  "sessionId": "session-123",
  "messages": [
    {
      "role": "user",
      "content": "Criar função fatorial",
      "timestamp": "2026-01-14T17:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "function factorial(n) {...}",
      "timestamp": "2026-01-14T17:00:01.000Z"
    }
  ]
}
```

---

### Métricas

```http
GET /api/metrics
```

Retorna métricas do sistema em formato JSON.

**Resposta:**

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
  }
}
```

---

### Métricas Prometheus

```http
GET /api/metrics/prometheus
```

Retorna métricas em formato Prometheus.

**Resposta:**

```text
# HELP http_requests_total Total de requisições HTTP
# TYPE http_requests_total counter
http_requests_total{method="POST",endpoint="/api/generate"} 100

# HELP http_request_duration_ms Duração das requisições em ms
# TYPE http_request_duration_ms gauge
http_request_duration_ms_avg{method="POST",endpoint="/api/generate"} 1234.56
```

---

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Requisição inválida |
| 401 | Não autenticado |
| 403 | Não autorizado |
| 404 | Não encontrado |
| 429 | Rate limit excedido |
| 500 | Erro interno |

## Erros

Todas as respostas de erro seguem o formato:

```json
{
  "success": false,
  "error": "Descrição do erro",
  "code": "ERROR_CODE",
  "timestamp": "2026-01-14T17:00:00.000Z"
}
```

## WebSocket (Opcional)

Para streaming de respostas em tempo real:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'generate',
    prompt: 'Criar função fatorial',
    sessionId: 'session-123'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Chunk:', data.chunk);
};
```
