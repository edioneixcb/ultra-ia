/**
 * Testes unitários para CognitiveContextEngine
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import CognitiveContextEngine from '../../../src/cognitive/CognitiveContextEngine.js';

const testConfig = {
  paths: {
    proactive: join(tmpdir(), 'ultra-ia-proactive-test'),
    logs: join(tmpdir(), 'ultra-ia-proactive-test-logs')
  }
};

describe('CognitiveContextEngine', () => {
  it('deve enriquecer contexto com estilo e impacto', () => {
    const engine = new CognitiveContextEngine(testConfig);
    const result = engine.enrichContext({
      filePath: '/tmp/sample.js',
      content: 'const a = 1;'
    });

    expect(result.style).toBeDefined();
    expect(result.impact).toBeDefined();
    expect(result.style.quoteStyle).toBeDefined();
  });
});
