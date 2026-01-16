/**
 * Testes unitários para MemoryStore
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import MemoryStore from '../../../src/memory/MemoryStore.js';

const testConfig = {
  paths: {
    proactive: join(tmpdir(), 'ultra-ia-proactive-test'),
    logs: join(tmpdir(), 'ultra-ia-proactive-test-logs')
  }
};

describe('MemoryStore', () => {
  it('deve armazenar e recuperar memórias', () => {
    const store = new MemoryStore(testConfig);
    store.store('TesterAgent', 'decision', 'ok', { requestId: 'r1' }, 7);

    const memories = store.recall('TesterAgent', 'decision', 5);
    expect(memories.length).toBeGreaterThan(0);
    expect(memories[0].content).toBe('ok');
  });
});
