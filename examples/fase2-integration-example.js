/**
 * Exemplo de integração e uso dos sistemas da FASE 2
 */

import { initializeFase2Systems } from '../src/systems/fase2/index.js';
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
    console.log('🚀 Inicializando sistemas da FASE 2...\n');

    // Registrar dependências primeiro
    const registry = getComponentRegistry();
    registry.register('config', () => config, []);
    registry.register('logger', () => logger, []);
    registry.register('errorHandler', () => errorHandler, []);

    // Inicializar todos os sistemas
    await initializeFase2Systems(config, logger, errorHandler);

    console.log('\n✅ Sistemas inicializados!\n');

    // Exemplo 1: Usar ScoreCalculator
    console.log('📊 Exemplo 1: ScoreCalculator');
    const scoreCalculator = registry.get('ScoreCalculator');
    const scoreResult = await scoreCalculator.execute({
      checks: [
        { id: 'check1', status: 'OK' },
        { id: 'check2', status: 'OK' },
        { id: 'check3', status: 'FALHOU' },
        { id: 'check4', status: 'N/A', justification: 'Justificativa válida', evidence: 'Evidência válida' }
      ]
    });
    console.log('Score:', scoreResult.score);
    console.log('Passando:', scoreResult.passing);
    console.log('Aplicáveis:', scoreResult.applicable);
    console.log('');

    // Exemplo 2: Usar ForensicAnalyzer
    console.log('📊 Exemplo 2: ForensicAnalyzer');
    const forensicAnalyzer = registry.get('ForensicAnalyzer');
    const forensicResult = await forensicAnalyzer.execute({
      error: {
        id: 'error-1',
        message: 'Cannot read property of null',
        type: 'TypeError'
      }
    });
    console.log('Categoria:', forensicResult.classification.category);
    console.log('Padrão identificado:', forensicResult.pattern?.id || 'Nenhum');
    console.log('Causa raiz:', forensicResult.rootCause.cause);
    console.log('');

    // Exemplo 3: Usar MultiEnvironmentCompatibilityAnalyzer
    console.log('📊 Exemplo 3: MultiEnvironmentCompatibilityAnalyzer');
    const compatibilityAnalyzer = registry.get('MultiEnvironmentCompatibilityAnalyzer');
    const compatibilityResult = await compatibilityAnalyzer.execute({
      code: 'Deno.readTextFile("file.txt");',
      analysisType: 'runtime',
      targetRuntime: 'nodejs'
    });
    console.log('Compatível:', compatibilityResult.compatible);
    console.log('Problemas encontrados:', compatibilityResult.issues.length);
    console.log('');

    // Exemplo 4: Usar CoverageCalculator
    console.log('📊 Exemplo 4: CoverageCalculator');
    const coverageCalculator = registry.get('CoverageCalculator');
    const coverageResult = await coverageCalculator.execute({
      targets: ['target1', 'target2'],
      checks: [
        { id: 'check1', failures: ['F1', 'F2'] },
        { id: 'check2', failures: ['F3'] },
        { id: 'check3', failures: ['F4', 'F5'] }
      ]
    });
    console.log('Cobertura total:', coverageResult.total.percentage.toFixed(2) + '%');
    console.log('Validação:', coverageResult.validation.valid ? '✅ Válida' : '❌ Inválida');
    console.log('');

    console.log('✅ Todos os exemplos executados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar exemplos:', error);
    process.exit(1);
  }
}

main();
