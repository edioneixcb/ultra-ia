import { describe, it, expect, vi, beforeEach } from 'vitest';
import registry from '../../src/config/registry.js';
import BaselineManager from '../../src/systems/fase0/BaselineManager.js';

describe('Fase 5 - Integração Fundação Absoluta', () => {
  let baselineManager;
  let antiSkip;
  let analyzer;

  beforeEach(async () => {
    // Obter instâncias do registry (já configuradas com dependências reais)
    baselineManager = registry.get('BaselineManager');
    antiSkip = registry.get('AntiSkipMechanism');
    analyzer = registry.get('AbsoluteCertaintyAnalyzer');

    // Inicializar sistemas
    await baselineManager.initialize();
    await antiSkip.initialize();
    await analyzer.initialize();
  });

  it('deve fornecer baseline de ambiente para tomada de decisão', async () => {
    // 1. Agente solicita baseline
    const baseline = await baselineManager.execute({ systemName: 'IntegrationTest' });
    
    expect(baseline).toBeDefined();
    expect(baseline.environment.runtime.name).toBe('node');
    expect(baseline.configuration.secretsFound).toBeDefined();
    
    // Validar sanitização em integração real
    const envKeys = Object.keys(baseline.configuration.envVars);
    expect(envKeys.length).toBeGreaterThan(0);
  });

  it('deve impedir avanço se check obrigatório for pulado', async () => {
    const checkId = 'CRITICAL-CHECK-1';
    
    // Tentar validar sem registrar -> deve falhar
    expect(() => antiSkip.validateCheckExecution(checkId, true))
      .toThrow(/PARE IMEDIATAMENTE/);
      
    // Registrar execução
    await antiSkip.execute({ action: 'register', checkId });
    
    // Tentar validar novamente -> deve passar
    const result = await antiSkip.execute({ action: 'validate', checkId });
    expect(result.valid).toBe(true);
  });

  it('deve analisar código com certeza absoluta usando AST', async () => {
    const code = `
      class UserService {
        login() { return true; }
      }
    `;
    
    const result = await analyzer.execute({
      sourceCode: code,
      errorReport: { type: 'MethodMissing', methodName: 'login' }
    });
    
    // Se o método existe, isError deve ser false (não é um erro de método faltando)
    // O analyzer retorna isError: !hasMethod
    expect(result.isError).toBe(false); 
    expect(result.confidence).toBe(1.0);
    expect(result.evidence).toContain('encontrado na AST');
  });
});
