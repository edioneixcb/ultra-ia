/**
 * Testes unitários para ProactiveAnalysisQueue
 */

import { describe, it, expect } from 'vitest';
import ProactiveAnalysisQueue from '../../../src/proactive/ProactiveAnalysisQueue.js';

describe('ProactiveAnalysisQueue', () => {
  it('deve priorizar itens críticos', async () => {
    const queue = new ProactiveAnalysisQueue({ proactive: { queue: { maxSize: 10 } } });
    const processed = [];

    queue.enqueue({ id: 'low' }, 'LOW');
    queue.enqueue({ id: 'critical' }, 'CRITICAL');
    queue.enqueue({ id: 'medium' }, 'MEDIUM');

    queue.start(async (item) => {
      processed.push(item.id);
      if (processed.length >= 3) {
        queue.stop();
      }
    });

    await new Promise(resolve => setTimeout(resolve, 200));
    expect(processed[0]).toBe('critical');
  });
});
