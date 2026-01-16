/**
 * Teste de integração dos Guardiões com MultiLayerValidator
 */

import { describe, it, expect } from 'vitest';
import MultiLayerValidator from '../../src/components/MultiLayerValidator.js';

describe('Guardiões + MultiLayerValidator', () => {
  it('deve executar camada guardians sem erro', () => {
    const validator = new MultiLayerValidator({ proactive: { guardians: { enabled: true } } });
    const result = validator.validate('function x(){ return 1; }', {
      layers: ['guardians'],
      runDependencyScan: false
    });

    expect(result).toBeDefined();
    expect(result.metadata.layersChecked).toContain('guardians');
  });
});
