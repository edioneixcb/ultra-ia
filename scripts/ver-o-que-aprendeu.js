#!/usr/bin/env node
/**
 * Script para Ver o que o Ultra-IA Aprendeu
 * 
 * Mostra estatísticas detalhadas do aprendizado do sistema
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync } from 'fs';
import { loadConfig } from '../src/utils/ConfigLoader.js';

const config = loadConfig().get();
const kbPath = config.paths.knowledgeBase || join(process.cwd(), 'data', 'knowledge-base');
const dbPath = join(kbPath, 'knowledge-base.db');

if (!existsSync(dbPath)) {
  console.error(`❌ Banco de dados não encontrado em: ${dbPath}`);
  console.error(`   Verifique se o caminho está correto ou execute a indexação primeiro.`);
  process.exit(1);
}

const db = new Database(dbPath);

console.log('🧠 O que o Ultra-IA Aprendeu?\n');
console.log('='.repeat(60));

// 1. Estatísticas básicas
console.log('\n📊 ESTATÍSTICAS GERAIS\n');

const funcoes = db.prepare('SELECT COUNT(*) as total FROM functions').get().total;
const classes = db.prepare('SELECT COUNT(*) as total FROM classes').get().total;
const arquivos = db.prepare('SELECT COUNT(*) as total FROM indexed_files').get().total;
const goldExamples = db.prepare('SELECT COUNT(*) as total FROM gold_examples').get().total;
const antiPatterns = db.prepare('SELECT COUNT(*) as total FROM anti_patterns').get().total;

console.log(`   Funções aprendidas: ${funcoes}`);
console.log(`   Classes aprendidas: ${classes}`);
console.log(`   Arquivos indexados: ${arquivos}`);
console.log(`   Exemplos positivos: ${goldExamples}`);
console.log(`   Anti-padrões: ${antiPatterns}`);

// 2. Projetos indexados
console.log('\n📁 PROJETOS INDEXADOS\n');

const projetos = db.prepare(`
  SELECT 
    CASE 
      WHEN file_path LIKE '%ultra-ia%' THEN 'ultra-ia'
      WHEN file_path LIKE '%mailchat%' THEN 'mailchat-pro'
      WHEN file_path LIKE '%clipboard%' THEN 'clipboard-manager'
      ELSE 'outros'
    END as projeto,
    COUNT(DISTINCT file_path) as arquivos,
    COUNT(*) as funcoes
  FROM functions
  GROUP BY projeto
  ORDER BY funcoes DESC
`).all();

projetos.forEach(p => {
  console.log(`   ${p.projeto}:`);
  console.log(`      - Arquivos: ${p.arquivos}`);
  console.log(`      - Funções: ${p.funcoes}`);
});

// 3. Linguagens aprendidas
console.log('\n💻 LINGUAGENS APRENDIDAS\n');

const linguagens = db.prepare(`
  SELECT language, COUNT(*) as total
  FROM functions
  GROUP BY language
  ORDER BY total DESC
`).all();

linguagens.forEach(l => {
  console.log(`   ${l.language}: ${l.total} funções`);
});

// 4. Top 10 arquivos com mais funções
console.log('\n📄 TOP 10 ARQUIVOS COM MAIS FUNÇÕES\n');

const topArquivos = db.prepare(`
  SELECT file_path, COUNT(*) as total
  FROM functions
  GROUP BY file_path
  ORDER BY total DESC
  LIMIT 10
`).all();

topArquivos.forEach((a, i) => {
  const nomeArquivo = a.file_path.split('/').pop();
  console.log(`   ${i + 1}. ${nomeArquivo}: ${a.total} funções`);
});

// 5. Exemplos positivos (se houver)
if (goldExamples > 0) {
  console.log('\n✅ EXEMPLOS POSITIVOS APRENDIDOS\n');
  const examples = db.prepare('SELECT prompt, code FROM gold_examples LIMIT 5').all();
  examples.forEach((e, i) => {
    console.log(`   ${i + 1}. ${e.prompt.substring(0, 50)}...`);
  });
}

// 6. Anti-padrões (se houver)
if (antiPatterns > 0) {
  console.log('\n❌ ANTI-PADRÕES APRENDIDOS\n');
  const patterns = db.prepare('SELECT prompt, reason FROM anti_patterns LIMIT 5').all();
  patterns.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.prompt.substring(0, 50)}...`);
    console.log(`      Motivo: ${p.reason}`);
  });
}

// 7. Resumo
console.log('\n' + '='.repeat(60));
console.log('📋 RESUMO DO APRENDIZADO');
console.log('='.repeat(60));

console.log(`\n✅ Indexação Inicial:`);
console.log(`   - ${funcoes} funções de ${arquivos} arquivos`);
console.log(`   - ${classes} classes aprendidas`);

if (goldExamples > 0 || antiPatterns > 0) {
  console.log(`\n🔄 Aprendizado com Uso:`);
  if (goldExamples > 0) {
    console.log(`   - ${goldExamples} exemplos positivos`);
  }
  if (antiPatterns > 0) {
    console.log(`   - ${antiPatterns} anti-padrões evitados`);
  }
} else {
  console.log(`\n💡 Dica: O sistema aprenderá mais quando você:`);
  console.log(`   - Aceitar código gerado (vira exemplo positivo)`);
  console.log(`   - Rejeitar código gerado (vira anti-padrão)`);
  console.log(`   - Usar código existente (aprende preferências)`);
}

console.log('\n' + '='.repeat(60) + '\n');

db.close();
