import { describe, it, expect, vi, beforeEach } from 'vitest';
import BaselineManager from '../../../src/systems/fase0/BaselineManager.js';
import AntiSkipMechanism from '../../../src/systems/fase0/AntiSkipMechanism.js';
import AbsoluteCertaintyAnalyzer from '../../../src/systems/fase0/AbsoluteCertaintyAnalyzer.js';

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const mockConfig = {};

describe('Fase 0 - Fundação Absoluta', () => {

  describe('BaselineManager', () => {
    it('deve detectar ambiente Node.js corretamente', async () => {
      const manager = new BaselineManager(mockConfig, mockLogger);
      await manager.onInitialize();
      const baseline = await manager.onExecute({ systemName: 'TestSystem' });
      
      expect(baseline.environment.runtime.name).toBe('node');
      expect(baseline.environment.runtime.version).toBeDefined();
    });

    it('deve sanitizar variáveis de ambiente', () => {
      process.env.TEST_SECRET = '123456';
      const manager = new BaselineManager(mockConfig, mockLogger);
      const sanitized = manager.getSanitizedEnvVars();
      
      expect(sanitized.TEST_SECRET).toBe('***REDACTED***');
      delete process.env.TEST_SECRET;
    });
  });

  describe('AntiSkipMechanism', () => {
    it('deve bloquear check obrigatório não executado', async () => {
      const antiSkip = new AntiSkipMechanism(mockConfig, mockLogger);
      await antiSkip.onInitialize();
      expect(() => antiSkip.validateCheckExecution('CHECK-1', true))
        .toThrow(/PARE IMEDIATAMENTE/);
    });

    it('deve permitir check registrado', async () => {
      const antiSkip = new AntiSkipMechanism(mockConfig, mockLogger);
      await antiSkip.onInitialize();
      await antiSkip.onExecute({ action: 'register', checkId: 'CHECK-1' });
      
      const result = antiSkip.validateCheckExecution('CHECK-1', true);
      expect(result.valid).toBe(true);
    });
  });

  describe('AbsoluteCertaintyAnalyzer', () => {
    it('deve usar ASTParser para análise', async () => {
      const mockParser = {
        parse: vi.fn().mockReturnValue({ valid: true, structure: {} })
      };
      
      const analyzer = new AbsoluteCertaintyAnalyzer(mockConfig, mockLogger, null, mockParser);
      await analyzer.onExecute({ 
        errorReport: { type: 'MethodMissing' }, 
        sourceCode: 'class A {}' 
      });

      expect(mockParser.parse).toHaveBeenCalledWith('class A {}');
    });
  });

});
