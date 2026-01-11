/**
 * Exemplo de integração e uso dos sistemas da FASE 1
 */

import { initializeFase1Systems } from '../src/systems/fase1/index.js';
import { getComponentRegistry } from '../src/core/index.js';
import config from '../config/config.json' with { type: 'json' };

// Logger simples para exemplo
const logger = {
  info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ''),
  debug: (msg, meta) => console.log(`[DEBUG] ${msg}`, meta || ''),
  warn: (msg, meta) => console.log(`[WARN] ${msg}`, meta || ''),
  error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta || '')
};

// Error Handler simples
const errorHandler = {
  handleError: (error, context) => {
    console.error('Erro capturado:', error.message, context);
  }
};

async function main() {
  try {
    console.log('🚀 Inicializando sistemas da FASE 1...\n');

    // Registrar dependências primeiro
    const registry = getComponentRegistry();
    registry.register('config', () => config, []);
    registry.register('logger', () => logger, []);
    registry.register('errorHandler', () => errorHandler, []);

    // Inicializar todos os sistemas
    await initializeFase1Systems(config, logger, errorHandler);

    console.log('\n✅ Sistemas inicializados!\n');

    // Exemplo 1: Usar DecisionClassifier
    console.log('📊 Exemplo 1: DecisionClassifier');
    const decisionClassifier = registry.get('DecisionClassifier');
    const decisionResult = await decisionClassifier.execute({
      decision: {
        action: 'delete',
        target: 'critical-data',
        impact: 'high'
      }
    });
    console.log('Resultado:', decisionResult);
    console.log('');

    // Exemplo 2: Usar EvidenceLevelValidator
    console.log('📊 Exemplo 2: EvidenceLevelValidator');
    const evidenceValidator = registry.get('EvidenceLevelValidator');
    const evidenceResult = await evidenceValidator.execute({
      evidence: {
        type: 'code',
        content: 'function test() { return true; }',
        source: 'source-code'
      },
      severity: 'critical'
    });
    console.log('Resultado:', evidenceResult);
    console.log('');

    // Exemplo 3: Usar ChainOfThoughtValidator
    console.log('📊 Exemplo 3: ChainOfThoughtValidator');
    const chainValidator = registry.get('ChainOfThoughtValidator');
    const chainResult = await chainValidator.execute({
      thought: {
        observacao: 'O sistema está apresentando erro',
        analise: 'O erro ocorre porque a função não trata null',
        decisao: 'Vou adicionar validação de null',
        acao: 'Implementar check de null antes de usar a variável'
      },
      thoughtId: 'thought-1'
    });
    console.log('Resultado:', chainResult);
    console.log('');

    // Exemplo 4: Usar ProactiveAnticipationSystem
    console.log('📊 Exemplo 4: ProactiveAnticipationSystem');
    const anticipationSystem = registry.get('ProactiveAnticipationSystem');
    const anticipationResult = await anticipationSystem.execute({
      code: `
        try {
          console.log('test');
        } catch (e) {}
        const apiKey = "secret123";
      `,
      context: {}
    });
    console.log('Riscos imediatos:', anticipationResult.immediateRisks.length);
    console.log('Riscos futuros:', anticipationResult.futureRisks.length);
    console.log('Sugestões:', anticipationResult.prevention.length);
    console.log('');

    // Exemplo 5: Usar InlineValidatedCodeGenerator
    console.log('📊 Exemplo 5: InlineValidatedCodeGenerator');
    const codeGenerator = registry.get('InlineValidatedCodeGenerator');
    const codeResult = await codeGenerator.execute({
      template: 'try { } catch (e) {}',
      context: {}
    });
    console.log('Código gerado válido:', codeResult.valid);
    console.log('Iterações:', codeResult.iterations);
    console.log('');

    // Exemplo 6: Usar StaticAnalyzer
    console.log('📊 Exemplo 6: StaticAnalyzer');
    const staticAnalyzer = registry.get('StaticAnalyzer');
    const analysisResult = await staticAnalyzer.execute({
      code: "import { View } from 'react-native'; console.log('test');",
      codeId: 'test-code'
    });
    console.log('Problemas de imports:', analysisResult.imports.issues.length);
    console.log('Problemas de segurança:', analysisResult.security.issues.length);
    console.log('');

    // Exemplo 7: Usar EnvironmentDetector
    console.log('📊 Exemplo 7: EnvironmentDetector');
    const envDetector = registry.get('EnvironmentDetector');
    const envResult = await envDetector.execute({});
    console.log('Node.js encontrado:', envResult.nodejs.found);
    console.log('Python encontrado:', envResult.python.found);
    console.log('Docker encontrado:', envResult.docker.found);
    console.log('');

    console.log('✅ Todos os exemplos executados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar exemplos:', error);
    process.exit(1);
  }
}

main();
