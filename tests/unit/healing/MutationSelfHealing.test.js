/**
 * Testes unitários para MutationSelfHealing
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import MutationSelfHealing from '../../../src/healing/MutationSelfHealing.js';

const testConfig = {
  paths: {
    proactive: join(tmpdir(), 'ultra-ia-proactive-test'),
    logs: join(tmpdir(), 'ultra-ia-proactive-test-logs')
  },
  execution: { docker: { enabled: false } }
};

describe('MutationSelfHealing', () => {
  it('deve retornar falha quando sandbox não executa', async () => {
    const healer = new MutationSelfHealing(testConfig);
    const result = await healer.heal('const a = b;', 'b is not defined');

    expect(result.success).toBe(false);
    expect(result.attempts).toBeGreaterThanOrEqual(0);
  });
});
