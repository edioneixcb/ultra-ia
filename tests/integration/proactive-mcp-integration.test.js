/**
 * Teste de integração da camada proativa
 */

import { describe, it, expect } from 'vitest';
import InterceptorLayer from '../../src/proactive/InterceptorLayer.js';
import { getEventBus } from '../../src/infrastructure/EventBus.js';

describe('Integração Proativa', () => {
  it('deve emitir evento quando validação falha', async () => {
    const config = { paths: { logs: './logs' }, proactive: { interceptor: { minScore: 70 } } };
    const eventBus = getEventBus(config);
    const interceptor = new InterceptorLayer(config);

    const waitForEvent = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 2000);
      eventBus.once('validation:failed', (payload) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });

    const result = await interceptor.analyze('ultra_execute_code', {
      code: 'eval(\"2 + 2\")',
      language: 'javascript'
    });

    expect(result.blocked).toBe(true);
    const payload = await waitForEvent;
    expect(payload).toHaveProperty('toolName', 'ultra_execute_code');
  });
});
