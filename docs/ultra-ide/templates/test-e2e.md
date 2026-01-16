# Template: Teste E2E (Playwright)

## Estrutura

```typescript
import { test, expect } from '@playwright/test';

test('abrir projeto e editar arquivo', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('text=Abrir Projeto');
  await page.click('text=src/index.ts');

  const editor = page.locator('.monaco-editor');
  await editor.click();
  await page.keyboard.type('console.log(\"hello\")');

  await expect(page.locator('text=Arquivo salvo')).toBeVisible();
});
```

## Checklist

- [ ] Cenário real do usuario
- [ ] Seletores estaveis
- [ ] Sem dependencia externa
- [ ] Timeout adequado
