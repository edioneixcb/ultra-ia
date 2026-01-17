#!/usr/bin/env node
/**
 * Script de Verificação do Sistema Ultra-IA
 * 
 * Verifica se a indexação funcionou e se o sistema está operacional
 */

import { getUltraSystem } from '../src/systems/UltraSystem.js';
import { loadConfig } from '../src/utils/ConfigLoader.js';
import { getLogger } from '../src/utils/Logger.js';
import { existsSync } from 'fs';
import { join } from 'path';

const config = loadConfig().get();
const logger = getLogger(config);
const ultraSystem = getUltraSystem(config, logger);

console.log('🔍 Verificando Sistema Ultra-IA...\n');
console.log('='.repeat(60));

// 1. Verificar banco de dados
console.log('\n📊 1. Verificando Banco de Dados...');
const kbPath = config.paths?.knowledgeBase || join(process.cwd(), 'data', 'knowledge-base');
const dbPath = join(kbPath, 'knowledge-base.db');

if (!existsSync(dbPath)) {
  console.log(`   ❌ Banco de dados não encontrado em: ${dbPath}`);
  process.exit(1);
}

console.log(`   ✅ Banco de dados encontrado: ${dbPath}`);

// 2. Verificar estatísticas
console.log('\n📈 2. Verificando Estatísticas...');
const stats = ultraSystem.getStats();

console.log(`   Knowledge Base:`);
console.log(`      - Funções: ${stats.knowledgeBase.functions}`);
console.log(`      - Classes: ${stats.knowledgeBase.classes}`);
console.log(`      - Arquivos: ${stats.knowledgeBase.files}`);

// Validações
let tudoOk = true;

if (stats.knowledgeBase.functions === 0) {
  console.log(`   ⚠️  AVISO: Nenhuma função encontrada!`);
  tudoOk = false;
}

if (stats.knowledgeBase.classes === 0) {
  console.log(`   ⚠️  AVISO: Nenhuma classe encontrada!`);
  tudoOk = false;
}

if (stats.knowledgeBase.files === 0) {
  console.log(`   ⚠️  AVISO: Nenhum arquivo indexado!`);
  tudoOk = false;
}

// 3. Verificar projetos indexados
console.log('\n📁 3. Verificando Projetos Indexados...');
const kb = ultraSystem.knowledgeBase;

// Buscar exemplos de cada projeto
const projetosEsperados = [
  { nome: 'ultra-ia', termos: ['UltraSystem', 'getUltraSystem'] },
  { nome: 'mailchat', termos: ['React', 'Component', 'useState'] }
];

for (const projeto of projetosEsperados) {
  console.log(`\n   Projeto: ${projeto.nome}`);
  let encontrado = false;
  
  for (const termo of projeto.termos) {
    try {
      const resultados = await kb.search(termo, 3);
      if (resultados.length > 0) {
        console.log(`      ✅ Encontrado "${termo}": ${resultados.length} resultado(s)`);
        encontrado = true;
        break;
      }
    } catch (error) {
      // Ignorar erros de busca
    }
  }
  
  if (!encontrado) {
    console.log(`      ⚠️  Nenhum resultado encontrado para termos conhecidos`);
  }
}

// 4. Verificar funcionalidades básicas
console.log('\n🔧 4. Verificando Funcionalidades...');

// Teste de busca
try {
  const resultados = await kb.search('function', 5);
  console.log(`   ✅ Busca funcionando: ${resultados.length} resultados`);
} catch (error) {
  console.log(`   ❌ Erro na busca: ${error.message}`);
  tudoOk = false;
}

// 5. Verificar contexto
console.log('\n💾 5. Verificando Context Manager...');
const contextStats = stats.context;
console.log(`   Sessões ativas: ${contextStats.sessions}`);

// 6. Resumo final
console.log('\n' + '='.repeat(60));
console.log('📋 RESUMO DA VERIFICAÇÃO');
console.log('='.repeat(60));

if (tudoOk && stats.knowledgeBase.functions >= 500) {
  console.log('\n✅ SISTEMA FUNCIONANDO CORRETAMENTE!');
  console.log(`\n   ✅ ${stats.knowledgeBase.functions} funções indexadas`);
  console.log(`   ✅ ${stats.knowledgeBase.classes} classes indexadas`);
  console.log(`   ✅ ${stats.knowledgeBase.files} arquivos indexados`);
  console.log(`\n   🎯 Sistema pronto para uso!`);
  console.log(`\n   💡 Teste no Cursor: "Mostre estatísticas do sistema"`);
} else if (stats.knowledgeBase.functions > 0) {
  console.log('\n⚠️  SISTEMA PARCIALMENTE FUNCIONAL');
  console.log(`\n   ⚠️  Apenas ${stats.knowledgeBase.functions} funções indexadas`);
  console.log(`   ⚠️  Esperado: ~573 funções`);
  console.log(`\n   💡 Considere reindexar os projetos`);
} else {
  console.log('\n❌ SISTEMA NÃO ESTÁ FUNCIONANDO');
  console.log(`\n   ❌ Nenhum dado encontrado na Knowledge Base`);
  console.log(`   💡 Execute: node scripts/indexar-todos-projetos.js`);
}

console.log('\n' + '='.repeat(60) + '\n');

process.exit(tudoOk && stats.knowledgeBase.functions >= 500 ? 0 : 1);
