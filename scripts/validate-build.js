#!/usr/bin/env node
/**
 * Script de validação de build
 * Verifica se o projeto compila corretamente e não há erros de sintaxe
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function validateBuild() {
  console.log('🔍 Validando build...\n');

  const errors = [];
  const warnings = [];

  // 1. Verificar package.json
  try {
    const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
    console.log('✓ package.json válido');
    
    if (!packageJson.main) {
      warnings.push('package.json não tem campo "main"');
    }
  } catch (e) {
    errors.push(`Erro ao ler package.json: ${e.message}`);
  }

  // 2. Verificar se arquivos principais existem
  const mainFiles = [
    'src/index.js',
    'src/core/index.js',
    'src/config/registry.js'
  ];

  for (const file of mainFiles) {
    try {
      const content = readFileSync(join(projectRoot, file), 'utf-8');
      console.log(`✓ ${file} existe`);
    } catch (e) {
      errors.push(`Arquivo ${file} não encontrado: ${e.message}`);
    }
  }

  // 3. Tentar importar módulos principais
  try {
    const { getComponentRegistry } = await import('../src/core/index.js');
    console.log('✓ ComponentRegistry importado com sucesso');
  } catch (e) {
    errors.push(`Erro ao importar ComponentRegistry: ${e.message}`);
  }

  try {
    const { getLogger } = await import('../src/utils/Logger.js');
    console.log('✓ Logger importado com sucesso');
  } catch (e) {
    errors.push(`Erro ao importar Logger: ${e.message}`);
  }

  // 4. Verificar dependências críticas
  const criticalDeps = [
    'lru-cache',
    'zod',
    'better-sqlite3'
  ];

  try {
    const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const dep of criticalDeps) {
      if (allDeps[dep]) {
        console.log(`✓ Dependência ${dep} encontrada`);
      } else {
        warnings.push(`Dependência ${dep} não encontrada`);
      }
    }
  } catch (e) {
    warnings.push(`Erro ao verificar dependências: ${e.message}`);
  }

  // Resumo
  console.log('\n📊 Resumo da Validação:');
  console.log(`   Erros: ${errors.length}`);
  console.log(`   Avisos: ${warnings.length}`);

  if (warnings.length > 0) {
    console.log('\n⚠️  Avisos:');
    warnings.forEach(w => console.log(`   - ${w}`));
  }

  if (errors.length > 0) {
    console.log('\n❌ Erros:');
    errors.forEach(e => console.log(`   - ${e}`));
    process.exit(1);
  }

  console.log('\n✅ Build validado com sucesso!');
  process.exit(0);
}

validateBuild().catch(e => {
  console.error('❌ Erro fatal:', e);
  process.exit(1);
});
