/**
 * Exemplo Avançado de Uso do Sistema Ultra
 * 
 * Este exemplo demonstra funcionalidades avançadas:
 * - Indexação de codebase
 * - Uso de contexto persistente
 * - Refinamento iterativo
 * - Aprendizado contínuo
 */

import ultraSystem from '../src/index.js';

async function exemploAvancado() {
  console.log('🚀 Exemplo Avançado de Uso do Sistema Ultra\n');

  try {
    // 1. Indexar codebase (se houver)
    console.log('📚 Passo 1: Indexar codebase');
    try {
      const indexStats = await ultraSystem.indexCodebase('./src');
      console.log(`✅ Codebase indexado:`);
      console.log(`   - Arquivos: ${indexStats.filesIndexed}`);
      console.log(`   - Funções: ${indexStats.totalFunctions}`);
      console.log(`   - Classes: ${indexStats.totalClasses}\n`);
    } catch (error) {
      console.log(`⚠️  Não foi possível indexar codebase: ${error.message}\n`);
    }

    // 2. Gerar código com contexto persistente
    console.log('📝 Passo 2: Gerar código com contexto persistente');
    const sessionId = 'sessao-avancada';
    
    const resultado1 = await ultraSystem.process(
      'Criar uma classe Calculator em JavaScript com métodos add, subtract, multiply e divide',
      {
        sessionId,
        language: 'javascript'
      }
    );

    if (resultado1.success) {
      console.log('✅ Código gerado:\n');
      console.log(resultado1.result.code);
      console.log('\n');
    }

    // 3. Usar contexto da sessão anterior
    console.log('📝 Passo 3: Adicionar método à classe usando contexto');
    const resultado2 = await ultraSystem.process(
      'Adicionar um método power à classe Calculator que calcula potência',
      {
        sessionId, // Mesma sessão = contexto mantido
        language: 'javascript'
      }
    );

    if (resultado2.success) {
      console.log('✅ Código gerado com contexto:\n');
      console.log(resultado2.result.code);
      console.log('\n');
    }

    // 4. Gerar código com refinamento iterativo
    console.log('📝 Passo 4: Gerar código complexo com refinamento');
    const resultado3 = await ultraSystem.process(
      'Criar uma função JavaScript que implementa bubble sort e retorna o array ordenado',
      {
        sessionId: 'refinamento-teste',
        language: 'javascript',
        expectedOutput: '[1,2,3,4,5]',
        maxIterations: 5,
        enableRefinement: true
      }
    );

    if (resultado3.success) {
      console.log('✅ Código gerado após refinamento:');
      console.log(`   Iterações: ${resultado3.iterations}`);
      console.log(`   Score: ${resultado3.result.validation.score}/100`);
      console.log(`\nCódigo:\n${resultado3.result.code}\n`);
      
      if (resultado3.result.execution.stdout) {
        console.log(`Output: ${resultado3.result.execution.stdout}`);
      }
    } else {
      console.log('⚠️  Não foi possível gerar código válido após refinamento');
      console.log(`Erro: ${resultado3.error?.message}`);
    }

    // 5. Verificar aprendizado
    console.log('\n📊 Estatísticas Finais:');
    const stats = ultraSystem.getStats();
    console.log(`  Knowledge Base:`);
    console.log(`    - Funções: ${stats.knowledgeBase.functions}`);
    console.log(`    - Classes: ${stats.knowledgeBase.classes}`);
    console.log(`    - Exemplos positivos: ${stats.knowledgeBase.goldExamples}`);
    console.log(`    - Anti-padrões: ${stats.knowledgeBase.antiPatterns}`);
    console.log(`  Execução:`);
    console.log(`    - Total: ${stats.execution.total}`);
    console.log(`    - Sucesso: ${stats.execution.successful}`);
    console.log(`    - Taxa: ${stats.execution.successRate.toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  }
}

// Executar exemplo
exemploAvancado();
