# Troubleshooting: Build

## PROBLEMA: Build falha (Web)

### Sintomas
- Erro no `vite build`

### Causas Comuns

1. **Dependencias faltando**
   - Solucao: `pnpm install`

2. **Erro de TypeScript**
   - Solucao: corrigir tipos e rodar `pnpm typecheck`

3. **Import circular**
   - Solucao: quebrar dependencias circulares

---

## PROBLEMA: Build falha (Desktop/Tauri)

### Sintomas
- Erro no `tauri build`

### Causas Comuns

1. **Rust toolchain ausente**
   - Solucao: instalar Rust + cargo

2. **Erro em comando Rust**
   - Solucao: verificar logs e corrigir

3. **WebView2 ausente (Windows)**
   - Solucao: instalar WebView2 Runtime
