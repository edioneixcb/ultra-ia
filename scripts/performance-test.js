#!/usr/bin/env node
/**
 * Script de teste de performance
 * Mede tempo de execução e uso de memória
 */

import { performance } from 'perf_hooks';
import { getLogger } from '../src/utils/Logger.js';
import { getErrorHandler } from '../src/utils/ErrorHandler.js';
import IntelligentSequentialResolver from '../src/systems/fase2/IntelligentSequentialResolver.js';
import ScoreCalculator from '../src/systems/fase2/ScoreCalculator.js';

const config = {
  test: true,
  features: {
    useCache: true
  },
  cache: {
    enabled: true,
    maxSize: 100,
    ttl: 3600000
  }
};

const logger = getLogger(config);
const errorHandler = getErrorHandler(config, logger);

async function measurePerformance() {
  console.log('⚡ Teste de Performance\n');

  const results = [];

  // Teste 1: IntelligentSequentialResolver
  console.log('1. Testando IntelligentSequentialResolver...');
  const start1 = performance.now();
  const resolver = new IntelligentSequentialResolver(config, logger, errorHandler);
  await resolver.initialize();
  
  const errors = Array.from({ length: 10 }, (_, i) => ({
    id: `error${i}`,
    message: `Error ${i}`,
    type: 'syntax',
    file: 'test.js',
    line: i + 1
  }));

  const codebase = {
    files: {
      'test.js': {
        content: 'const x = 1;\n'.repeat(10)
      }
    }
  };

  await resolver.execute({
    errors,
    codebase,
    resolutionId: 'perf-test-1'
  });

  const end1 = performance.now();
  const time1 = end1 - start1;
  results.push({ name: 'IntelligentSequentialResolver', time: time1 });
  console.log(`   Tempo: ${time1.toFixed(2)}ms\n`);

  // Teste 2: ScoreCalculator
  console.log('2. Testando ScoreCalculator...');
  const start2 = performance.now();
  const calculator = new ScoreCalculator(config, logger, errorHandler);
  
  const checks = Array.from({ length: 100 }, (_, i) => ({
    id: `check${i}`,
    status: i % 2 === 0 ? 'OK' : 'FALHOU',
    severity: 'MEDIUM'
  }));

  for (let i = 0; i < 1000; i++) {
    calculator.calculateScore(checks);
  }

  const end2 = performance.now();
  const time2 = end2 - start2;
  results.push({ name: 'ScoreCalculator (1000x)', time: time2 });
  console.log(`   Tempo: ${time2.toFixed(2)}ms\n`);

  // Resumo
  console.log('📊 Resumo de Performance:');
  results.forEach(r => {
    console.log(`   ${r.name}: ${r.time.toFixed(2)}ms`);
  });

  const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
  console.log(`\n   Tempo médio: ${avgTime.toFixed(2)}ms`);

  // Verificar se performance está dentro de limites aceitáveis
  const maxAcceptableTime = 5000; // 5 segundos
  const slowTests = results.filter(r => r.time > maxAcceptableTime);
  
  if (slowTests.length > 0) {
    console.log('\n⚠️  Testes lentos detectados:');
    slowTests.forEach(t => {
      console.log(`   - ${t.name}: ${t.time.toFixed(2)}ms (limite: ${maxAcceptableTime}ms)`);
    });
  } else {
    console.log('\n✅ Todos os testes estão dentro dos limites de performance!');
  }
}

measurePerformance().catch(e => {
  console.error('❌ Erro:', e);
  process.exit(1);
});
