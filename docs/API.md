# Ultra-IA API Documentation

## Visão Geral

A API do Ultra-IA fornece endpoints para geração de código assistida por IA, validação, busca na knowledge base e gerenciamento de contexto.

**URL Base:** `http://localhost:3000/api`

## Autenticação

A API suporta autenticação via API Key (header `X-API-Key`). Opcionalmente, JWT (header `Authorization: Bearer <token>`) é aceito quando a assinatura usa o `api.auth.jwtSecret` configurado.

```bash
# Usando API Key
curl -H "X-API-Key: sua-api-key" http://localhost:3000/api/health

# Usando JWT (opcional, se configurado)
curl -H "Authorization: Bearer seu-jwt-token" http://localhost:3000/api/health
```

## Rate Limiting

- **Por IP (todas as rotas /api):** 100 requests por minuto (configurável)
- **Endpoint /api/generate:** 10 requests por minuto por `sessionId` (configurável)

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
  "requestId": "session-123-1700000000000",
  "result": {
    "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }",
    "language": "javascript",
    "validation": {
      "valid": true,
      "score": 92
    },
    "execution": {
      "success": true,
      "stdout": "ok",
      "matchesExpected": true
    }
  },
  "iterations": 1,
  "duration": 1234,
  "error": null,
  "requirements": {
    "valid": true,
    "completeness": 0.8,
    "errors": [],
    "warnings": []
  }
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
    "issues": [
      { "type": "warning", "message": "Indentação inconsistente detectada" }
    ],
    "errorCount": 0,
    "warningCount": 1,
    "score": 90
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
  "codebasePath": "/caminho/para/projeto"
}
```

Campos opcionais aceitos mas não utilizados no momento:
`path` (alias de `codebasePath`), `patterns`, `projectId`.

**Resposta:**

```json
{
  "success": true,
  "stats": {
    "filesIndexed": 42,
    "totalFunctions": 128,
    "totalClasses": 23,
    "totalFiles": 42
  }
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

**Resposta:**

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
  ],
  "history": [
    {
      "success": true,
      "executionId": "session-123-1700000000000",
      "language": "javascript",
      "duration": 1234,
      "timestamp": "2026-01-14T17:00:01.000Z"
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
  "message": "Detalhes do erro"
}
```

---

## Ferramentas MCP (Cursor)

Além da API REST, o Ultra-IA expõe ferramentas MCP para uso no Cursor IDE.

### ultra_analyze_impact

Analisa impacto de mudança em arquivo específico.

### ultra_get_agent_memory

Recupera memórias persistentes de um agente.

### ultra_run_guardians

Executa guardiões preditivos em um código.

### ultra_self_heal

Tenta autocorreção com mutações e sandbox.

