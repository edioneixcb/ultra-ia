/**
 * Teste de Integração da Fase 0
 * 
 * Testa se Config, Logger e ErrorHandler funcionam juntos
 */

import { loadConfig } from './src/utils/ConfigLoader.js';
import { getLogger } from './src/utils/Logger.js';
import { getErrorHandler } from './src/utils/ErrorHandler.js';

async function testIntegration() {
  console.log('🧪 Testando integração da Fase 0...\n');

  try {
    // 1. Carregar configuração
    console.log('1️⃣  Testando ConfigLoader...');
    const configLoader = loadConfig();
    const config = configLoader.get();
    
    console.log('   ✅ Config carregado');
    console.log(`   - Environment: ${config.environment}`);
    console.log(`   - Ollama URL: ${config.services.ollama.url}`);
    console.log(`   - Ollama Model: ${config.services.ollama.defaultModel}`);
    console.log(`   - Logs Path: ${config.paths.logs}`);

    // 2. Criar logger com config
    console.log('\n2️⃣  Testando Logger com Config...');
    const logger = getLogger(config);
    
    logger.info('Teste de log INFO', { test: true });
    logger.debug('Teste de log DEBUG', { test: true });
    logger.warn('Teste de log WARN', { test: true });
    
    console.log('   ✅ Logger funcionando');
    console.log(`   - Log Dir: ${logger.logDir}`);
    console.log(`   - Level: ${logger.level}`);

    // 3. Criar error handler com config e logger
    console.log('\n3️⃣  Testando ErrorHandler com Config e Logger...');
    const errorHandler = getErrorHandler(config, logger);
    
    // Testar classificação de erros
    const timeoutError = new Error('Request timeout');
    const classification = errorHandler.classifyError(timeoutError);
    console.log(`   ✅ Classificação de erro: ${classification}`);
    
    // Testar retry logic (simulado)
    console.log('\n4️⃣  Testando Retry Logic...');
    let attempts = 0;
    const testFn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary error');
      }
      return 'success';
    };
    
    const result = await errorHandler.executeWithRetry(testFn, {
      maxRetries: 3,
      shouldRetry: (error) => error.message.includes('Temporary')
    });
    
    console.log(`   ✅ Retry funcionou: ${result} (${attempts} tentativas)`);

    // 5. Testar fallback
    console.log('\n5️⃣  Testando Fallback...');
    const primaryFn = async () => {
      throw new Error('Primary failed');
    };
    const fallbackFn = async () => {
      return 'fallback-success';
    };
    
    const fallbackResult = await errorHandler.executeWithFallback(primaryFn, fallbackFn);
    console.log(`   ✅ Fallback funcionou: ${fallbackResult}`);

    // 6. Testar wrapper
    console.log('\n6️⃣  Testando Wrapper...');
    const wrappedFn = errorHandler.wrap(async () => {
      logger.info('Função envolvida executada');
      return 'wrapped-success';
    });
    
    const wrappedResult = await wrappedFn();
    console.log(`   ✅ Wrapper funcionou: ${wrappedResult}`);

    // 7. Testar contexto no logger
    console.log('\n7️⃣  Testando Logger com Contexto...');
    const contextualLogger = logger.withContext({
      sessionId: 'test-session-123',
      component: 'IntegrationTest'
    });
    
    contextualLogger.info('Log com contexto');
    console.log('   ✅ Logger com contexto funcionando');

    console.log('\n✅ TODOS OS TESTES DE INTEGRAÇÃO PASSARAM!');
    console.log('\n📊 Resumo:');
    console.log('   - ConfigLoader: ✅');
    console.log('   - Logger: ✅');
    console.log('   - ErrorHandler: ✅');
    console.log('   - Integração: ✅');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE DE INTEGRAÇÃO:');
    console.error(error);
    process.exit(1);
  }
}

testIntegration();
