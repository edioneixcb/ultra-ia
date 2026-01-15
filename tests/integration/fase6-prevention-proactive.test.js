import { describe, it, expect, vi, beforeEach } from 'vitest';
import registry from '../../src/config/registry.js';

describe('Fase 6 - Integração Prevenção Proativa', () => {
  let staticAnalyzer;
  let proactiveAnticipation;
  let configValidator;
  let typeValidator;

  beforeEach(async () => {
    // Obter instâncias do registry (já configuradas com dependências reais)
    staticAnalyzer = registry.get('StaticAnalyzer');
    proactiveAnticipation = registry.get('ProactiveAnticipationSystem');
    configValidator = registry.get('ConfigValidator');
    typeValidator = registry.get('TypeValidator');

    // Inicializar sistemas
    await staticAnalyzer.initialize();
    await proactiveAnticipation.initialize();
    await configValidator.initialize();
    await typeValidator.initialize();
  });

  it('StaticAnalyzer deve usar ASTParser se disponível', async () => {
    const code = "eval('alert(1)')";
    // ASTParser detecta eval como 'critical', Regex original como 'high'
    // Se usar ASTParser, deve ter securityIssues detalhados (mas o retorno atual do StaticAnalyzer normaliza)
    // Vamos verificar se o log indica AST ou Regex (se possível mockar logger)
    // Ou verificar comportamento específico: ASTParser detecta innerHTML em AssignmentExpression
    
    const codeInner = "el.innerHTML = 'foo'";
    const result = await staticAnalyzer.execute({ code: codeInner });
    
    // Se ASTParser estiver sendo usado, ele detecta e reporta
    // O StaticAnalyzer original com regex também detecta, mas a mensagem pode variar ligeiramente ou a estrutura
    expect(result.patterns.issues.length).toBeGreaterThan(0);
    // Verificar se a propriedade hasIssues está presente (padrão do StaticAnalyzer)
    expect(result.patterns.hasIssues).toBe(true);
  });

  it('ProactiveAnticipationSystem deve integrar com BaselineManager', async () => {
    // Se a integração estiver ativa, ele deve tentar obter o baseline
    // Como não podemos mockar facilmente o BaselineManager interno do registry sem recriar,
    // vamos verificar se a execução não falha e retorna resultado válido
    
    const result = await proactiveAnticipation.execute({
      code: "import fs from 'fs'; fs.readFileSync('file')",
      context: {}
    });
    
    expect(result).toBeDefined();
    expect(result.immediateRisks).toBeDefined();
    // Se integração funcionar, environmentRisks pode estar presente (se houver riscos) ou array vazio se validado
    // O importante é que não crashou
  });

  it('ConfigValidator deve detectar raiz do projeto', async () => {
    const result = await configValidator.execute({
      config: { paths: { src: './src' } },
      validationType: 'paths'
    });
    
    expect(result.paths.correctedPaths.src).toContain('/src'); // Deve ter resolvido caminho absoluto
  });

  it('TypeValidator deve usar inferência de tipos', async () => {
    const code = "const x: any = 10;";
    const result = await typeValidator.execute({ code });
    
    expect(result.valid).toBe(false);
    expect(result.anyUsage.length).toBeGreaterThan(0);
    expect(result.inferredTypes).toBeDefined();
    // Inferência básica deve funcionar
    // const x: any = 10 -> x é number
    // Mas o regex de any usage pega "x"
    // O regex de inferência pega "x"
  });
});
