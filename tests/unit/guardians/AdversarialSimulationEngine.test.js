/**
 * Testes unitários para AdversarialSimulationEngine
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import AdversarialSimulationEngine from '../../../src/guardians/AdversarialSimulationEngine.js';

describe('AdversarialSimulationEngine', () => {
  it('deve executar simulações e retornar cenários', async () => {
    const engine = new AdversarialSimulationEngine({
      paths: { logs: join(tmpdir(), 'ultra-ia-proactive-test-logs') },
      execution: { docker: { enabled: false } }
    });

    const result = await engine.simulate('console.log("ok")', { scenarios: ['timeout'] });
    expect(result.scenarios.length).toBe(1);
    expect(result.scenarios[0]).toHaveProperty('scenario', 'timeout');
  });
});
