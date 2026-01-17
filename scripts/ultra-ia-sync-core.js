#!/usr/bin/env node
/**
 * Ultra-IA Sync Core - Lógica de Processamento de Eventos
 * 
 * Processa eventos de filesystem do inotifywait:
 * - Mudanças no ultra-ia -> atualiza MCP global
 * - Novos projetos -> detecta e opcionalmente indexa
 * - Projetos ativos -> reindexa automaticamente
 * 
 * Uso: node ultra-ia-sync-core.js <event_type> <path> [action]
 *   event_type: "ultra_changed" | "new_project" | "project_changed"
 *   path: caminho do arquivo/diretório afetado
 *   action: ação do inotify (CREATE, MODIFY, DELETE, etc)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, appendFileSync, readdirSync } from 'fs';
import { join, dirname, basename, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ============================================================================
// Configuração
// ============================================================================

/**
 * Carrega configuração do sync
 */
function loadSyncConfig() {
  const configPath = join(projectRoot, 'config', 'sync-config.json');
  
  if (!existsSync(configPath)) {
    console.error(`[ERROR] Config não encontrado: ${configPath}`);
    process.exit(1);
  }
  
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  
  // Expandir ~ para homedir
  config.cacheDir = config.cacheDir.replace(/^~/, homedir());
  config.logFile = config.logFile.replace(/^~/, homedir());
  config.lastIndexedFile = config.lastIndexedFile.replace(/^~/, homedir());
  
  return config;
}

const config = loadSyncConfig();

// ============================================================================
// Logger Estruturado (JSONL)
// ============================================================================

class StructuredLogger {
  constructor(logFile, maxSizeMB = 10, maxFiles = 5) {
    this.logFile = logFile;
    this.maxSizeBytes = maxSizeMB * 1024 * 1024;
    this.maxFiles = maxFiles;
    
    // Garantir que o diretório existe
    const logDir = dirname(logFile);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
  }
  
  /**
   * Rotaciona logs se necessário
   */
  rotateIfNeeded() {
    if (!existsSync(this.logFile)) return;
    
    try {
      const stats = statSync(this.logFile);
      if (stats.size < this.maxSizeBytes) return;
      
      // Rotacionar arquivos existentes
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const oldFile = `${this.logFile}.${i}`;
        const newFile = `${this.logFile}.${i + 1}`;
        if (existsSync(oldFile)) {
          if (i === this.maxFiles - 1) {
            // Remover arquivo mais antigo
            execSync(`rm -f "${newFile}"`);
          }
          execSync(`mv "${oldFile}" "${newFile}"`);
        }
      }
      
      // Mover arquivo atual para .1
      execSync(`mv "${this.logFile}" "${this.logFile}.1"`);
    } catch (err) {
      // Ignorar erros de rotação
    }
  }
  
  /**
   * Escreve log estruturado
   */
  log(level, event, data = {}) {
    this.rotateIfNeeded();
    
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      data,
      pid: process.pid
    };
    
    const line = JSON.stringify(entry) + '\n';
    
    try {
      appendFileSync(this.logFile, line);
    } catch (err) {
      console.error(`[LOG_ERROR] ${err.message}`);
    }
    
    // Também logar no console para journald
    const prefix = `[${level.toUpperCase()}]`;
    console.log(`${prefix} ${event}:`, JSON.stringify(data));
  }
  
  debug(event, data) { this.log('debug', event, data); }
  info(event, data) { this.log('info', event, data); }
  warn(event, data) { this.log('warn', event, data); }
  error(event, data) { this.log('error', event, data); }
}

const logger = new StructuredLogger(
  config.logFile,
  config.maxLogSizeMB,
  config.maxFiles
);

// ============================================================================
// Cache de Última Indexação
// ============================================================================

class IndexCache {
  constructor(cacheFile) {
    this.cacheFile = cacheFile;
    this.cache = this.load();
  }
  
  load() {
    try {
      if (existsSync(this.cacheFile)) {
        return JSON.parse(readFileSync(this.cacheFile, 'utf-8'));
      }
    } catch (err) {
      logger.warn('cache_load_error', { error: err.message });
    }
    return { projects: {} };
  }
  
  save() {
    try {
      const dir = dirname(this.cacheFile);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch (err) {
      logger.error('cache_save_error', { error: err.message });
    }
  }
  
  getLastIndexed(projectPath) {
    return this.cache.projects[projectPath]?.lastIndexed || null;
  }
  
  setLastIndexed(projectPath, timestamp = new Date().toISOString()) {
    if (!this.cache.projects[projectPath]) {
      this.cache.projects[projectPath] = {};
    }
    this.cache.projects[projectPath].lastIndexed = timestamp;
    this.save();
  }
  
  needsReindex(projectPath, thresholdDays) {
    const lastIndexed = this.getLastIndexed(projectPath);
    if (!lastIndexed) return true;
    
    const lastDate = new Date(lastIndexed);
    const now = new Date();
    const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);
    
    return diffDays > thresholdDays;
  }
}

const indexCache = new IndexCache(config.lastIndexedFile);

// ============================================================================
// Detecção de Projeto
// ============================================================================

/**
 * Verifica se um caminho é raiz de um projeto
 */
function isProjectRoot(dirPath) {
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
    return false;
  }
  
  for (const indicator of config.projectIndicators) {
    const indicatorPath = join(dirPath, indicator);
    if (existsSync(indicatorPath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Verifica se um projeto é "ativo" (teve mudanças recentes)
 */
function isProjectActive(projectPath, thresholdDays = 7) {
  try {
    // Usar find para verificar se há arquivos modificados recentemente
    const result = execSync(
      `find "${projectPath}" -type f -mtime -${thresholdDays} -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -1`,
      { encoding: 'utf-8', timeout: 10000 }
    );
    
    return result.trim().length > 0;
  } catch (err) {
    // Se falhar, considerar como ativo para não perder indexação
    return true;
  }
}

/**
 * Verifica se um caminho deve ser ignorado
 */
function shouldIgnore(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  for (const pattern of config.excludePatterns) {
    if (pattern.startsWith('*.')) {
      // Pattern de extensão
      const ext = pattern.slice(1);
      if (normalizedPath.endsWith(ext)) return true;
    } else if (normalizedPath.includes(`/${pattern}/`) || normalizedPath.endsWith(`/${pattern}`)) {
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// Ações
// ============================================================================

/**
 * Atualiza configuração MCP do Cursor
 */
function updateMcpConfig() {
  const scriptPath = join(projectRoot, 'scripts', 'atualizar-cursor-mcp.sh');
  
  if (!existsSync(scriptPath)) {
    logger.error('mcp_script_not_found', { path: scriptPath });
    return false;
  }
  
  try {
    logger.info('mcp_update_started', { script: scriptPath });
    
    execSync(`bash "${scriptPath}"`, {
      encoding: 'utf-8',
      timeout: 30000,
      stdio: 'pipe'
    });
    
    logger.info('mcp_update_success', {});
    return true;
  } catch (err) {
    logger.error('mcp_update_failed', { error: err.message });
    return false;
  }
}

/**
 * Indexa um projeto na Knowledge Base
 */
async function indexProject(projectPath) {
  const projectName = basename(projectPath);
  
  logger.info('index_started', { project: projectName, path: projectPath });
  
  try {
    // Importar dinamicamente o UltraSystem
    const { getUltraSystem } = await import('../src/systems/UltraSystem.js');
    const { loadConfig } = await import('../src/utils/ConfigLoader.js');
    const { getLogger: getUltraLogger } = await import('../src/utils/Logger.js');
    
    const ultraConfig = loadConfig().get();
    const ultraLogger = getUltraLogger(ultraConfig);
    const ultraSystem = getUltraSystem(ultraConfig, ultraLogger);
    
    const stats = await ultraSystem.indexCodebase(projectPath);
    
    // Atualizar cache
    indexCache.setLastIndexed(projectPath);
    
    logger.info('index_success', {
      project: projectName,
      filesIndexed: stats.filesIndexed,
      totalFunctions: stats.totalFunctions,
      totalClasses: stats.totalClasses
    });
    
    return { success: true, stats };
  } catch (err) {
    logger.error('index_failed', {
      project: projectName,
      error: err.message
    });
    
    return { success: false, error: err.message };
  }
}

// ============================================================================
// Handlers de Eventos
// ============================================================================

/**
 * Handler para mudanças no ultra-ia
 */
async function handleUltraChanged(filePath, action) {
  if (shouldIgnore(filePath)) {
    logger.debug('ignored_change', { path: filePath, action });
    return;
  }
  
  logger.info('ultra_changed', { path: filePath, action });
  
  // Atualizar MCP config para garantir que está sincronizado
  updateMcpConfig();
}

/**
 * Handler para novo projeto detectado
 */
async function handleNewProject(projectPath) {
  if (!isProjectRoot(projectPath)) {
    logger.debug('not_project_root', { path: projectPath });
    return;
  }
  
  const projectName = basename(projectPath);
  logger.info('new_project_detected', { project: projectName, path: projectPath });
  
  // Garantir MCP atualizado
  updateMcpConfig();
  
  // Verificar se projeto é ativo e indexar
  if (isProjectActive(projectPath, config.activeProjectThresholdDays)) {
    logger.info('active_project_indexing', { project: projectName });
    await indexProject(projectPath);
  } else {
    logger.info('inactive_project_skipped', { project: projectName });
  }
}

/**
 * Handler para mudança em projeto existente
 */
async function handleProjectChanged(projectPath) {
  const projectName = basename(projectPath);
  
  // Verificar se precisa reindexar
  if (!indexCache.needsReindex(projectPath, config.activeProjectThresholdDays)) {
    logger.debug('reindex_not_needed', { project: projectName });
    return;
  }
  
  // Verificar se projeto é ativo
  if (!isProjectActive(projectPath, config.activeProjectThresholdDays)) {
    logger.debug('inactive_project_skipped', { project: projectName });
    return;
  }
  
  logger.info('reindex_triggered', { project: projectName });
  await indexProject(projectPath);
}

/**
 * Lista todos os projetos em projectsRoot
 */
function listAllProjects() {
  const projects = [];
  
  try {
    const entries = readdirSync(config.projectsRoot, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const projectPath = join(config.projectsRoot, entry.name);
      
      // Ignorar ultra-ia e diretórios ocultos
      if (entry.name === 'ultra-ia' || entry.name.startsWith('.')) continue;
      
      if (isProjectRoot(projectPath)) {
        projects.push({
          name: entry.name,
          path: projectPath,
          active: isProjectActive(projectPath, config.activeProjectThresholdDays),
          lastIndexed: indexCache.getLastIndexed(projectPath)
        });
      }
    }
  } catch (err) {
    logger.error('list_projects_error', { error: err.message });
  }
  
  return projects;
}

/**
 * Reindexa todos os projetos ativos
 */
async function reindexAllActive() {
  const projects = listAllProjects();
  const activeProjects = projects.filter(p => p.active);
  
  logger.info('reindex_all_started', {
    totalProjects: projects.length,
    activeProjects: activeProjects.length
  });
  
  const results = [];
  
  for (const project of activeProjects) {
    if (indexCache.needsReindex(project.path, config.activeProjectThresholdDays)) {
      const result = await indexProject(project.path);
      results.push({ project: project.name, ...result });
    } else {
      results.push({ project: project.name, skipped: true });
    }
  }
  
  logger.info('reindex_all_completed', {
    indexed: results.filter(r => r.success).length,
    skipped: results.filter(r => r.skipped).length,
    failed: results.filter(r => r.success === false).length
  });
  
  return results;
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Ultra-IA Sync Core - Processador de Eventos

Uso:
  node ultra-ia-sync-core.js <comando> [argumentos]

Comandos:
  ultra_changed <path> [action]   Processar mudança no ultra-ia
  new_project <path>              Processar novo projeto detectado
  project_changed <path>          Processar mudança em projeto existente
  reindex_all                     Reindexar todos os projetos ativos
  list_projects                   Listar todos os projetos
  status                          Mostrar status do sistema

Exemplos:
  node ultra-ia-sync-core.js ultra_changed /path/to/file.js MODIFY
  node ultra-ia-sync-core.js new_project /home/user/projetos/novo-projeto
  node ultra-ia-sync-core.js reindex_all
`);
    process.exit(0);
  }
  
  const command = args[0];
  
  try {
    switch (command) {
      case 'ultra_changed':
        await handleUltraChanged(args[1] || '', args[2] || 'UNKNOWN');
        break;
        
      case 'new_project':
        await handleNewProject(args[1] || '');
        break;
        
      case 'project_changed':
        await handleProjectChanged(args[1] || '');
        break;
        
      case 'reindex_all':
        await reindexAllActive();
        break;
        
      case 'list_projects': {
        const projects = listAllProjects();
        console.log('\nProjetos encontrados:\n');
        for (const p of projects) {
          const status = p.active ? '[ATIVO]' : '[INATIVO]';
          const indexed = p.lastIndexed ? `(indexado: ${p.lastIndexed})` : '(nunca indexado)';
          console.log(`  ${status} ${p.name} ${indexed}`);
        }
        console.log(`\nTotal: ${projects.length} projetos`);
        break;
      }
        
      case 'status': {
        console.log('\n=== Ultra-IA Sync Status ===\n');
        console.log(`Config: ${join(projectRoot, 'config', 'sync-config.json')}`);
        console.log(`Log: ${config.logFile}`);
        console.log(`Cache: ${config.lastIndexedFile}`);
        console.log(`Ultra Root: ${config.ultraRoot}`);
        console.log(`Projects Root: ${config.projectsRoot}`);
        console.log(`Threshold: ${config.activeProjectThresholdDays} dias`);
        console.log(`Debounce: ${config.debounceMs}ms`);
        console.log('');
        
        const projects = listAllProjects();
        console.log(`Projetos detectados: ${projects.length}`);
        console.log(`Projetos ativos: ${projects.filter(p => p.active).length}`);
        break;
      }
        
      default:
        logger.error('unknown_command', { command });
        console.error(`Comando desconhecido: ${command}`);
        process.exit(1);
    }
  } catch (err) {
    logger.error('command_failed', { command, error: err.message, stack: err.stack });
    console.error(`Erro ao executar ${command}: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
