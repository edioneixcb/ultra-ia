/**
 * Testes unitários para PredictiveDependencyGuardian
 */

import { describe, it, expect } from 'vitest';
import PredictiveDependencyGuardian from '../../../src/guardians/PredictiveDependencyGuardian.js';

describe('PredictiveDependencyGuardian', () => {
  it('deve listar dependências sem falhar', () => {
    const guardian = new PredictiveDependencyGuardian({
      paths: { systemRoot: process.cwd(), logs: './logs' },
      proactive: { dependencyGuardian: { useNpmAudit: false } }
    });
    const result = guardian.scan();

    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('auditedAt');
  });
});
