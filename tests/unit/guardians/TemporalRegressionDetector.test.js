/**
 * Testes unitários para TemporalRegressionDetector
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import TemporalRegressionDetector from '../../../src/guardians/TemporalRegressionDetector.js';
import DynamicKnowledgeBase from '../../../src/components/DynamicKnowledgeBase.js';

const testConfig = {
  paths: {
    knowledgeBase: join(tmpdir(), 'ultra-ia-kb-test'),
    logs: join(tmpdir(), 'ultra-ia-kb-logs')
  }
};

describe('TemporalRegressionDetector', () => {
  it('deve detectar anti-padrões conhecidos', () => {
    const kb = new DynamicKnowledgeBase(testConfig);
    kb.db.prepare(`
      INSERT INTO anti_patterns (prompt, code, reason, language)
      VALUES (?, ?, ?, ?)
    `).run('test', 'dangerous()', 'Anti-padrão', 'javascript');

    const detector = new TemporalRegressionDetector(testConfig);
    const result = detector.detect('function x(){ dangerous(); }');

    expect(result.detected).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
