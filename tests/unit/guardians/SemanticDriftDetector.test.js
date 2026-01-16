/**
 * Testes unitários para SemanticDriftDetector
 */

import { describe, it, expect } from 'vitest';
import SemanticDriftDetector from '../../../src/guardians/SemanticDriftDetector.js';

describe('SemanticDriftDetector', () => {
  it('deve detectar mudança em retorno', () => {
    const detector = new SemanticDriftDetector();
    const before = 'function calc(){ return 1; }';
    const after = 'function calc(){ return 2; }';

    const result = detector.detect(before, after);
    expect(result.detected).toBe(true);
  });
});
