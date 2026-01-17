#!/usr/bin/env node
/**
 * Script de Indexação Completa de Projetos
 * 
 * Indexa todos os projetos identificados na Knowledge Base do Ultra-IA
 * de forma organizada e com relatório detalhado.
 */

import { getUltraSystem } from '../src/systems/UltraSystem.js';
import { loadConfig } from '../src/utils/ConfigLoader.js';
import { getLogger } from '../src/utils/Logger.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const config = loadConfig().get();
const logger = getLogger(config);
const ultraSystem = getUltraSystem(config, logger);

// Projetos a serem indexados
// Caminhos podem ser configurados via variáveis de ambiente:
// - ULTRA_IA_PROJECT_PATH: caminho do projeto ultra-ia (padrão: projeto atual)
// - MAILCHAT_PROJECT_PATH: caminho do projeto mailchat-pro
// - CLIPBOARD_PROJECT_PATH: caminho do projeto clipboard-manager
const projetos = [
  {
    nome: 'ultra-ia',
    caminho: process.env.ULTRA_IA_PROJECT_PATH || join(projectRoot, 'src'),
    descricao: 'Sistema Ultra-IA - Componentes principais',
    linguagens: ['javascript', 'typescript']
  },
  {
    nome: 'mailchat-pro',
    caminho: process.env.MAILCHAT_PROJECT_PATH || '',
    descricao: 'MailChat Pro - App mobile React Native',
    linguagens: ['typescript', 'javascript']
  },
  {
    nome: 'clipboard-manager',
    caminho: process.env.CLIPBOARD_PROJECT_PATH || '',
    descricao: 'Clipboard Manager Ultra - Shell scripts',
    linguagens: ['shell', 'bash']
  }
].filter(p => p.caminho); // Filtrar projetos sem caminho configurado

async function indexarProjeto(projeto) {
  console.log(`\n📦 Indexando: ${projeto.nome}`);
  console.log(`   Caminho: ${projeto.caminho}`);
  console.log(`   Descrição: ${projeto.descricao}`);
  
  const inicio = Date.now();
  
  try {
    const stats = await ultraSystem.indexCodebase(projeto.caminho);
    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
    
    console.log(`   ✅ Concluído em ${duracao}s`);
    console.log(`   📊 Arquivos: ${stats.filesIndexed}/${stats.totalFiles}`);
    console.log(`   🔧 Funções: ${stats.totalFunctions}`);
    console.log(`   📚 Classes: ${stats.totalClasses}`);
    
    return {
      sucesso: true,
      projeto: projeto.nome,
      stats,
      duracao: parseFloat(duracao)
    };
  } catch (error) {
    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
    console.log(`   ❌ Erro após ${duracao}s: ${error.message}`);
    
    return {
      sucesso: false,
      projeto: projeto.nome,
      erro: error.message,
      duracao: parseFloat(duracao)
    };
  }
}

async function main() {
  console.log('🚀 Iniciando indexação completa de projetos...\n');
  console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`📁 Total de projetos: ${projetos.length}\n`);
  
  const resultados = [];
  let totalArquivos = 0;
  let totalFuncoes = 0;
  let totalClasses = 0;
  
  // Indexar cada projeto
  for (const projeto of projetos) {
    const resultado = await indexarProjeto(projeto);
    resultados.push(resultado);
    
    if (resultado.sucesso) {
      totalArquivos += resultado.stats.filesIndexed;
      totalFuncoes += resultado.stats.totalFunctions;
      totalClasses += resultado.stats.totalClasses;
    }
  }
  
  // Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL DE INDEXAÇÃO');
  console.log('='.repeat(60));
  
  const sucessos = resultados.filter(r => r.sucesso).length;
  const falhas = resultados.filter(r => !r.sucesso).length;
  
  console.log(`\n✅ Projetos indexados com sucesso: ${sucessos}/${projetos.length}`);
  if (falhas > 0) {
    console.log(`❌ Projetos com erro: ${falhas}/${projetos.length}`);
  }
  
  console.log(`\n📈 Estatísticas Consolidadas:`);
  console.log(`   📄 Total de arquivos indexados: ${totalArquivos}`);
  console.log(`   🔧 Total de funções: ${totalFuncoes}`);
  console.log(`   📚 Total de classes: ${totalClasses}`);
  
  // Estatísticas do sistema
  console.log(`\n📊 Estatísticas do Sistema Ultra-IA:`);
  const stats = ultraSystem.getStats();
  console.log(`   Knowledge Base:`);
  console.log(`      - Funções: ${stats.knowledgeBase.functions}`);
  console.log(`      - Classes: ${stats.knowledgeBase.classes}`);
  console.log(`      - Arquivos: ${stats.knowledgeBase.files}`);
  
  // Detalhes por projeto
  console.log(`\n📋 Detalhes por Projeto:`);
  resultados.forEach((r, i) => {
    console.log(`\n   ${i + 1}. ${r.projeto}`);
    if (r.sucesso) {
      console.log(`      ✅ Sucesso (${r.duracao}s)`);
      console.log(`      📄 Arquivos: ${r.stats.filesIndexed}`);
      console.log(`      🔧 Funções: ${r.stats.totalFunctions}`);
      console.log(`      📚 Classes: ${r.stats.totalClasses}`);
    } else {
      console.log(`      ❌ Erro: ${r.erro}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Indexação concluída!');
  console.log('='.repeat(60) + '\n');
  
  // Salvar relatório
  const relatorio = {
    data: new Date().toISOString(),
    projetos: resultados,
    estatisticas: {
      totalArquivos,
      totalFuncoes,
      totalClasses,
      sucessos,
      falhas
    },
    sistema: stats
  };
  
  const fs = await import('fs');
  const logsPath = config.paths?.logs || join(projectRoot, 'logs');
  const relatorioPath = join(logsPath, 'indexacao-projetos.json');
  
  // Criar diretório de logs se não existir
  if (!fs.existsSync(logsPath)) {
    fs.mkdirSync(logsPath, { recursive: true });
  }
  
  fs.writeFileSync(relatorioPath, JSON.stringify(relatorio, null, 2));
  console.log(`📄 Relatório salvo em: ${relatorioPath}\n`);
  
  process.exit(falhas > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
