/**
 * Teste de integração para persistência de memória de agentes
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import AgentMemoryBridge from '../../src/memory/AgentMemoryBridge.js';

const testConfig = {
  paths: {
    proactive: join(tmpdir(), 'ultra-ia-proactive-test'),
    logs: join(tmpdir(), 'ultra-ia-proactive-test-logs')
  }
};

describe('Persistência de memória', () => {
  it('deve manter memórias entre instâncias', () => {
    const bridge1 = new AgentMemoryBridge(testConfig);
    bridge1.storeMemory('ReviewerAgent', 'memória', { type: 'decision', importance: 6 });

    const bridge2 = new AgentMemoryBridge(testConfig);
    const memories = bridge2.recall('ReviewerAgent', null, 5);

    expect(memories.length).toBeGreaterThan(0);
    expect(memories[0].content).toBe('memória');
  });
});
