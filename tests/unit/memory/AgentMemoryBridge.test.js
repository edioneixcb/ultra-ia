/**
 * Testes unitários para AgentMemoryBridge
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import AgentMemoryBridge from '../../../src/memory/AgentMemoryBridge.js';

const testConfig = {
  paths: {
    proactive: join(tmpdir(), 'ultra-ia-proactive-test'),
    logs: join(tmpdir(), 'ultra-ia-proactive-test-logs')
  },
  proactive: { memory: { limit: 5 } }
};

describe('AgentMemoryBridge', () => {
  it('deve armazenar e recuperar memórias', () => {
    const bridge = new AgentMemoryBridge(testConfig);
    bridge.storeMemory('SecurityAgent', 'alerta', { type: 'warning', importance: 8 });

    const memories = bridge.recall('SecurityAgent', null, 5);
    expect(memories.length).toBeGreaterThan(0);
    expect(memories[0].content).toBe('alerta');
  });
});
