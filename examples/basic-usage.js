/**
 * Exemplo Básico de Uso do Sistema Ultra
 * 
 * Este exemplo demonstra como usar o Sistema Ultra para gerar código.
 */

import ultraSystem from '../src/index.js';

async function exemploBasico() {
  console.log('🚀 Exemplo Básico de Uso do Sistema Ultra\n');

  try {
    // Exemplo 1: Gerar função simples
    console.log('📝 Exemplo 1: Gerar função para validar email');
    const resultado1 = await ultraSystem.process(
      'Criar uma função JavaScript para validar email',
      {
        sessionId: 'exemplo-1',
        language: 'javascript'
      }
    );

    if (resultado1.success && resultado1.result) {
      console.log('✅ Código gerado com sucesso!');
      console.log(`\nCódigo:\n${resultado1.result.code}\n`);
      console.log(`Score de validação: ${resultado1.result.validation.score}/100`);
      console.log(`Iterações: ${resultado1.iterations}`);
      console.log(`Duração: ${resultado1.duration}ms\n`);
    } else {
      console.log('❌ Erro ao gerar código:', resultado1.error);
    }

    // Exemplo 2: Gerar função Python com output esperado
    console.log('📝 Exemplo 2: Gerar função Python que retorna True');
    const resultado2 = await ultraSystem.process(
      'Criar uma função Python chamada is_even que recebe um número e retorna True se for par',
      {
        sessionId: 'exemplo-2',
        language: 'python',
        expectedOutput: 'True'
      }
    );

    if (resultado2.success && resultado2.result) {
      console.log('✅ Código gerado e executado com sucesso!');
      console.log(`\nCódigo:\n${resultado2.result.code}\n`);
      if (resultado2.result.execution.stdout) {
        console.log(`Output: ${resultado2.result.execution.stdout}`);
      }
    }

    // Exemplo 3: Verificar estatísticas
    console.log('\n📊 Estatísticas do Sistema:');
    const stats = ultraSystem.getStats();
    console.log(`  Funções indexadas: ${stats.knowledgeBase.functions}`);
    console.log(`  Classes indexadas: ${stats.knowledgeBase.classes}`);
    console.log(`  Taxa de sucesso: ${stats.execution.successRate.toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Executar exemplo
exemploBasico();
