/**
 * Testes unitários para InterceptorLayer
 */

import { describe, it, expect } from 'vitest';
import InterceptorLayer from '../../../src/proactive/InterceptorLayer.js';

describe('InterceptorLayer', () => {
  it('deve bloquear código inseguro com eval', async () => {
    const config = {
      paths: { logs: './logs' },
      validation: { strictMode: true },
      proactive: { interceptor: { minScore: 70 } }
    };
    const interceptor = new InterceptorLayer(config);

    const result = await interceptor.analyze('ultra_execute_code', {
      code: 'eval(\"2 + 2\")',
      language: 'javascript'
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('eval');
  });

  it('deve permitir código válido', async () => {
    const config = {
      paths: { logs: './logs' },
      validation: { strictMode: true },
      proactive: { interceptor: { minScore: 70 } }
    };
    const interceptor = new InterceptorLayer(config);

    const result = await interceptor.analyze('ultra_execute_code', {
      code: 'function sum(a, b) { return a + b; }',
      language: 'javascript'
    });

    expect(result.blocked).toBe(false);
  });
});
