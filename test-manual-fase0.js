/**
 * Teste Manual da Fase 0
 * 
 * Execute: node test-manual-fase0.js
 * 
 * Este teste valida que todos os componentes da Fase 0 funcionam corretamente
 */

import { loadConfig } from './src/utils/ConfigLoader.js';
import { getLogger } from './src/utils/Logger.js';
import { getErrorHandler } from './src/utils/ErrorHandler.js';

console.log('🧪 TESTE MANUAL DA FASE 0\n');
console.log('=' .repeat(60));

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Erro: ${error.message}`);
    testsFailed++;
  }
}

// TESTE 1: ConfigLoader
console.log('\n📋 TESTE 1: ConfigLoader');
test('Carregar configuração', () => {
  const configLoader = loadConfig();
  const config = configLoader.get();
  
  if (!config.services?.ollama?.url) {
    throw new Error('services.ollama.url não encontrado');
  }
  
  if (!config.paths?.logs) {
    throw new Error('paths.logs não encontrado');
  }
  
  console.log(`   - Ollama URL: ${config.services.ollama.url}`);
  console.log(`   - Model: ${config.services.ollama.defaultModel}`);
  console.log(`   - Logs Path: ${config.paths.logs}`);
});

test('getValue() funciona', () => {
  const configLoader = loadConfig();
  const url = configLoader.getValue('services.ollama.url');
  
  if (!url) {
    throw new Error('getValue() não retornou valor');
  }
  
  console.log(`   - getValue('services.ollama.url'): ${url}`);
});

test('getInfo() funciona', () => {
  const configLoader = loadConfig();
  const info = configLoader.getInfo();
  
  if (!info.hasConfig) {
    throw new Error('Config não carregado');
  }
  
  console.log(`   - Config carregado em: ${info.loadedAt}`);
});

// TESTE 2: Logger
console.log('\n📋 TESTE 2: Logger');
test('Criar logger com config', () => {
  const configLoader = loadConfig();
  const config = configLoader.get();
  const logger = getLogger(config);
  
  if (!logger) {
    throw new Error('Logger não criado');
  }
  
  console.log(`   - Log Dir: ${logger.logDir}`);
  console.log(`   - Level: ${logger.level}`);
});

test('Logging funciona', () => {
  const configLoader = loadConfig();
  const config = configLoader.get();
  const logger = getLogger(config);
  
  logger.info('Teste de log INFO', { test: true });
  logger.warn('Teste de log WARN', { test: true });
  
  console.log('   - Logs escritos com sucesso');
});

test('Logger com contexto funciona', () => {
  const configLoader = loadConfig();
  const config = configLoader.get();
  const logger = getLogger(config);
  
  const contextualLogger = logger.withContext({
    sessionId: 'test-123',
    component: 'TestComponent'
  });
  
  contextualLogger.info('Log com contexto');
  console.log('   - Logger contextualizado funcionando');
});

// TESTE 3: ErrorHandler
console.log('\n📋 TESTE 3: ErrorHandler');
test('Criar ErrorHandler com config e logger', () => {
  const configLoader = loadConfig();
  const config = configLoader.get();
  const logger = getLogger(config);
  const errorHandler = getErrorHandler(config, logger);
  
  if (!errorHandler) {
    throw new Error('ErrorHandler não criado');
  }
  
  if (!errorHandler.config || !errorHandler.config.retry) {
    throw new Error('Config do ErrorHandler não inicializado corretamente');
  }
  
  console.log(`   - Max Retries: ${errorHandler.config.retry.maxRetries}`);
  console.log(`   - Backoff Multiplier: ${errorHandler.config.retry.backoffMultiplier}`);
});

test('Classificação de erros funciona', () => {
  const configLoader = loadConfig();
  const config = configLoader.get();
  const logger = getLogger(config);
  const errorHandler = getErrorHandler(config, logger);
  
  const timeoutError = new Error('Request timeout');
  const classification = errorHandler.classifyError(timeoutError);
  
  if (classification !== 'TEMPORARY') {
    throw new Error(`Classificação incorreta: esperado TEMPORARY, obtido ${classification}`);
  }
  
  console.log(`   - Timeout classificado como: ${classification}`);
  
  const criticalError = new Error('Critical system failure');
  const criticalClassification = errorHandler.classifyError(criticalError);
  
  if (criticalClassification !== 'CRITICAL') {
    throw new Error(`Classificação incorreta: esperado CRITICAL, obtido ${criticalClassification}`);
  }
  
  console.log(`   - Critical classificado como: ${criticalClassification}`);
});

test('Retry logic funciona', async () => {
  const configLoader = loadConfig();
  const config = configLoader.get();
  const logger = getLogger(config);
  const errorHandler = getErrorHandler(config, logger);
  
  let attempts = 0;
  const testFn = async () => {
    attempts++;
    if (attempts < 2) {
      throw new Error('Temporary error');
    }
    return 'success';
  };
  
  const result = await errorHandler.executeWithRetry(testFn, {
    maxRetries: 3,
    shouldRetry: (error) => error.message.includes('Temporary')
  });
  
  if (result !== 'success') {
    throw new Error(`Retry falhou: esperado 'success', obtido '${result}'`);
  }
  
  if (attempts !== 2) {
    throw new Error(`Tentativas incorretas: esperado 2, obtido ${attempts}`);
  }
  
  console.log(`   - Retry funcionou: ${result} (${attempts} tentativas)`);
});

test('Fallback funciona', async () => {
  const configLoader = loadConfig();
  const config = configLoader.get();
  const logger = getLogger(config);
  const errorHandler = getErrorHandler(config, logger);
  
  const primaryFn = async () => {
    throw new Error('Primary failed');
  };
  
  const fallbackFn = async () => {
    return 'fallback-success';
  };
  
  const result = await errorHandler.executeWithFallback(primaryFn, fallbackFn);
  
  if (result !== 'fallback-success') {
    throw new Error(`Fallback falhou: esperado 'fallback-success', obtido '${result}'`);
  }
  
  console.log(`   - Fallback funcionou: ${result}`);
});

// TESTE 4: Integração Completa
console.log('\n📋 TESTE 4: Integração Completa');
test('Todos os componentes funcionam juntos', async () => {
  // Carregar config
  const configLoader = loadConfig();
  const config = configLoader.get();
  
  // Criar logger
  const logger = getLogger(config);
  
  // Criar error handler
  const errorHandler = getErrorHandler(config, logger);
  
  // Usar todos juntos
  const wrappedFn = errorHandler.wrap(async () => {
    logger.info('Função envolvida executada', { step: 1 });
    const ollamaUrl = configLoader.getValue('services.ollama.url');
    logger.debug('Ollama URL obtido', { url: ollamaUrl });
    return 'integration-success';
  });
  
  const result = await wrappedFn();
  
  if (result !== 'integration-success') {
    throw new Error(`Integração falhou: esperado 'integration-success', obtido '${result}'`);
  }
  
  console.log(`   - Integração completa funcionou: ${result}`);
});

// RESUMO
console.log('\n' + '='.repeat(60));
console.log('\n📊 RESUMO DOS TESTES:');
console.log(`   ✅ Passou: ${testsPassed}`);
console.log(`   ❌ Falhou: ${testsFailed}`);
console.log(`   📈 Taxa de sucesso: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM!');
  console.log('✅ FASE 0 VALIDADA E APROVADA');
  process.exit(0);
} else {
  console.log('\n⚠️  ALGUNS TESTES FALHARAM');
  console.log('❌ Revisar componentes antes de prosseguir');
  process.exit(1);
}
