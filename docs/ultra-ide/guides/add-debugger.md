# Guia: Adicionar Debugger para Nova Linguagem (DAP)

## Pre-requisitos

- Debug Adapter existente para a linguagem
- Conhecimento basico de DAP
- Acesso ao workspace do Ultra-IDE

## Resultado Final

Debugger funcional com:
- Start/Stop
- Breakpoints
- Step In/Out/Over
- Stack trace
- Variables panel

## Passo 1: Identificar Debug Adapter

Verifique se existe adapter oficial:
- Node: built-in
- Python: debugpy
- Go: dlv-dap
- Java: vscode-java-debug

## Passo 2: Registrar Tipo de Debug

### packages/core/src/debug/registry.ts

```typescript
debugRegistry.register({
  type: 'rust',
  label: 'Rust Debug',
  adapter: {
    command: 'codelldb',
    args: ['--port', '${port}']
  },
  configurationAttributes: {
    program: { type: 'string', required: true },
    cwd: { type: 'string', required: false }
  }
});
```

## Passo 3: Configurar Launch Config

### .vscode/launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "rust",
      "request": "launch",
      "name": "Debug Rust",
      "program": "${workspaceFolder}/target/debug/app",
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

## Passo 4: Mapear UI

### packages/ui/src/debug/DebugConfig.ts

```typescript
const config = {
  type: 'rust',
  request: 'launch',
  name: 'Debug Rust'
};
```

## Passo 5: Testar

1. Abrir arquivo da linguagem
2. Criar breakpoint
3. Iniciar debug
4. Verificar stack trace e variables

## Checklist de Validacao

- [ ] Debug adapter inicia sem erros
- [ ] Breakpoints funcionam
- [ ] Step in/out/over funciona
- [ ] Variables panel atualiza
- [ ] Stack trace aparece

## Troubleshooting

### Problema: Adapter nao inicia

**Verificar**: comando do adapter existe no PATH  
**Solucao**: instalar adapter ou definir caminho completo

### Problema: Breakpoints ignorados

**Verificar**: build em modo debug  
**Solucao**: garantir que simbolos de debug estao presentes
