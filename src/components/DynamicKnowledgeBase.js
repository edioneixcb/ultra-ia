/**
 * Knowledge Base Dinâmica
 * 
 * Indexa codebase do projeto e permite busca semântica de código.
 * 
 * Funcionalidades:
 * - Indexação de arquivos do codebase
 * - Extração de funções e classes
 * - Armazenamento em SQLite
 * - Busca por palavras-chave e nome
 * - Busca semântica (quando embeddings disponíveis)
 * - Aprendizado contínuo de uso
 */

import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { glob } from 'glob';
import Database from 'better-sqlite3';
import { getConfigLoader } from '../utils/ConfigLoader.js';
import { getLogger } from '../utils/Logger.js';
import { getDatabaseManager } from '../utils/DatabaseManager.js';
import { getTimeoutManager } from '../utils/TimeoutManager.js';
import { getCacheManager } from '../utils/CacheManager.js';

class DynamicKnowledgeBase {
  constructor(config = null, logger = null) {
    // Carregar config se não fornecido
    if (!config) {
      const configLoader = getConfigLoader();
      if (configLoader.config) {
        config = configLoader.get();
      } else {
        configLoader.load();
        config = configLoader.get();
      }
    }

    // Criar logger se não fornecido
    if (!logger) {
      logger = getLogger(config);
    }

    this.config = config;
    this.logger = logger;
    this.timeoutManager = getTimeoutManager(config, logger);
    this.cacheManager = getCacheManager(config, logger);
    this.kbPath = config.paths?.knowledgeBase || './data/knowledge-base';
    this.dbPath = join(this.kbPath, 'knowledge-base.db');

    // Criar diretório se não existir
    if (!existsSync(this.kbPath)) {
      mkdirSync(this.kbPath, { recursive: true });
    }

    // Obter conexão do DatabaseManager
    const dbManager = getDatabaseManager(config, logger);
    this.db = dbManager.getConnection(this.dbPath, 'knowledge-base');
    this.dbManager = dbManager;
    this.dbKey = 'knowledge-base';
    this.initializeDatabase();

    // Cache de embeddings (para implementação futura)
    this.embeddingsCache = new Map();

    // Exemplos positivos e anti-padrões
    this.goldExamples = [];
    this.antiPatterns = [];
  }

  /**
   * Inicializa estrutura do banco de dados
   */
  initializeDatabase() {
    // Tabela de funções
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS functions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        file_path TEXT NOT NULL,
        language TEXT NOT NULL,
        line_start INTEGER,
        line_end INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de classes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        file_path TEXT NOT NULL,
        language TEXT NOT NULL,
        line_start INTEGER,
        line_end INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de arquivos indexados
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS indexed_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT UNIQUE NOT NULL,
        language TEXT NOT NULL,
        last_indexed DATETIME DEFAULT CURRENT_TIMESTAMP,
        file_hash TEXT
      )
    `);

    // Tabela de exemplos positivos (gold examples)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS gold_examples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT NOT NULL,
        code TEXT NOT NULL,
        language TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de anti-padrões
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS anti_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT NOT NULL,
        code TEXT NOT NULL,
        reason TEXT NOT NULL,
        language TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Índices para busca rápida
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_functions_name ON functions(name);
      CREATE INDEX IF NOT EXISTS idx_functions_file ON functions(file_path);
      CREATE INDEX IF NOT EXISTS idx_classes_name ON classes(name);
      CREATE INDEX IF NOT EXISTS idx_classes_file ON classes(file_path);
    `);

    this.logger?.info('Banco de dados inicializado', { dbPath: this.dbPath });
  }

  /**
   * Encontra arquivos de código no codebase
   * @param {string} codebasePath - Caminho do codebase
   * @returns {Promise<string[]>} Lista de arquivos encontrados
   */
  async findCodeFiles(codebasePath) {
    const extensions = ['*.py', '*.js', '*.ts', '*.jsx', '*.tsx', '*.java', '*.cpp', '*.c', '*.go', '*.rs'];
    const ignorePatterns = [
      '**/node_modules/**',
      '**/.git/**',
      '**/venv/**',
      '**/__pycache__/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/target/**'
    ];

    const allFiles = [];

    for (const ext of extensions) {
      try {
        const files = await glob(`**/${ext}`, {
          cwd: codebasePath,
          ignore: ignorePatterns,
          absolute: true
        });
        allFiles.push(...files);
      } catch (error) {
        this.logger?.warn(`Erro ao buscar arquivos ${ext}`, { error: error.message, path: codebasePath });
      }
    }

    this.logger?.info(`Encontrados ${allFiles.length} arquivos de código`, { path: codebasePath });
    return allFiles;
  }

  /**
   * Extrai funções de um arquivo
   * @param {string} content - Conteúdo do arquivo
   * @param {string} language - Linguagem do arquivo
   * @returns {Array<object>} Lista de funções encontradas
   */
  extractFunctions(content, language) {
    const functions = [];
    const lines = content.split('\n');

    if (language === 'python' || extname(language) === '.py') {
      // Padrão para Python: def function_name(...):
      const pattern = /^(\s*)def\s+(\w+)\s*\([^)]*\)\s*:/;
      lines.forEach((line, index) => {
        const match = line.match(pattern);
        if (match) {
          const indent = match[1].length;
          const name = match[2];
          
          // Encontrar fim da função (próxima função ou fim do arquivo)
          let endIndex = index + 1;
          while (endIndex < lines.length) {
            const nextLine = lines[endIndex];
            if (nextLine.trim() === '' || nextLine.match(/^\s*#/)) {
              endIndex++;
              continue;
            }
            const nextIndent = nextLine.match(/^(\s*)/)?.[1].length || 0;
            if (nextIndent <= indent && nextLine.trim() !== '') {
              break;
            }
            endIndex++;
          }

          const code = lines.slice(index, endIndex).join('\n');
          functions.push({
            name,
            code,
            lineStart: index + 1,
            lineEnd: endIndex
          });
        }
      });
    } else if (language === 'javascript' || language === 'typescript' || 
               extname(language).match(/\.(js|ts|jsx|tsx)$/)) {
      // Padrão para JavaScript/TypeScript
      // function name(...) ou const name = (...) => ou name: (...) =>
      const patterns = [
        /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g,
        /(?:^|\n)\s*(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
        /(?:^|\n)\s*(\w+)\s*:\s*(?:async\s+)?\([^)]*\)\s*=>/g
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const name = match[1];
          const startPos = match.index;
          
          // Tentar encontrar fim da função (simplificado)
          let braceCount = 0;
          let inFunction = false;
          let endPos = startPos;
          
          for (let i = startPos; i < content.length; i++) {
            const char = content[i];
            if (char === '{') {
              braceCount++;
              inFunction = true;
            } else if (char === '}') {
              braceCount--;
              if (inFunction && braceCount === 0) {
                endPos = i + 1;
                break;
              }
            }
          }

          const code = content.substring(startPos, endPos);
          const lineStart = content.substring(0, startPos).split('\n').length;
          const lineEnd = content.substring(0, endPos).split('\n').length;

          functions.push({
            name,
            code,
            lineStart,
            lineEnd
          });
        }
      });
    }

    return functions;
  }

  /**
   * Extrai classes de um arquivo
   * @param {string} content - Conteúdo do arquivo
   * @param {string} language - Linguagem do arquivo
   * @returns {Array<object>} Lista de classes encontradas
   */
  extractClasses(content, language) {
    const classes = [];
    const lines = content.split('\n');

    if (language === 'python' || extname(language) === '.py') {
      // Padrão para Python: class ClassName:
      const pattern = /^(\s*)class\s+(\w+)/;
      lines.forEach((line, index) => {
        const match = line.match(pattern);
        if (match) {
          const indent = match[1].length;
          const name = match[2];
          
          // Encontrar fim da classe
          let endIndex = index + 1;
          while (endIndex < lines.length) {
            const nextLine = lines[endIndex];
            if (nextLine.trim() === '' || nextLine.match(/^\s*#/)) {
              endIndex++;
              continue;
            }
            const nextIndent = nextLine.match(/^(\s*)/)?.[1].length || 0;
            if (nextIndent <= indent && nextLine.trim() !== '') {
              break;
            }
            endIndex++;
          }

          const code = lines.slice(index, endIndex).join('\n');
          classes.push({
            name,
            code,
            lineStart: index + 1,
            lineEnd: endIndex
          });
        }
      });
    } else if (language === 'javascript' || language === 'typescript' || 
               extname(language).match(/\.(js|ts|jsx|tsx)$/)) {
      // Padrão para JavaScript/TypeScript: class ClassName
      const pattern = /(?:^|\n)\s*(?:export\s+)?class\s+(\w+)/g;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        const startPos = match.index;
        
        // Encontrar fim da classe
        let braceCount = 0;
        let inClass = false;
        let endPos = startPos;
        
        for (let i = startPos; i < content.length; i++) {
          const char = content[i];
          if (char === '{') {
            braceCount++;
            inClass = true;
          } else if (char === '}') {
            braceCount--;
            if (inClass && braceCount === 0) {
              endPos = i + 1;
              break;
            }
          }
        }

        const code = content.substring(startPos, endPos);
        const lineStart = content.substring(0, startPos).split('\n').length;
        const lineEnd = content.substring(0, endPos).split('\n').length;

        classes.push({
          name,
          code,
          lineStart,
          lineEnd
        });
      }
    }

    return classes;
  }

  /**
   * Determina linguagem do arquivo pela extensão
   * @param {string} filePath - Caminho do arquivo
   * @returns {string} Linguagem detectada
   */
  detectLanguage(filePath) {
    const ext = extname(filePath).toLowerCase();
    const languageMap = {
      '.py': 'python',
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.go': 'go',
      '.rs': 'rust'
    };
    return languageMap[ext] || 'unknown';
  }

  /**
   * Indexa codebase completo
   * @param {string} codebasePath - Caminho do codebase
   * @returns {Promise<object>} Estatísticas da indexação
   */
  async indexCodebase(codebasePath) {
    this.logger?.info('Iniciando indexação do codebase', { path: codebasePath });

    const files = await this.findCodeFiles(codebasePath);
    let totalFunctions = 0;
    let totalClasses = 0;
    let filesIndexed = 0;

    const insertFunction = this.db.prepare(`
      INSERT OR REPLACE INTO functions (name, code, file_path, language, line_start, line_end, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const insertClass = this.db.prepare(`
      INSERT OR REPLACE INTO classes (name, code, file_path, language, line_start, line_end, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const insertFile = this.db.prepare(`
      INSERT OR REPLACE INTO indexed_files (file_path, language, last_indexed)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);

    const transaction = this.db.transaction(() => {
      for (const file of files) {
        try {
          const content = readFileSync(file, 'utf-8');
          const language = this.detectLanguage(file);
          
          if (language === 'unknown') {
            continue;
          }

          // Extrair funções
          const functions = this.extractFunctions(content, language);
          for (const func of functions) {
            insertFunction.run(
              func.name,
              func.code,
              file,
              language,
              func.lineStart,
              func.lineEnd
            );
            totalFunctions++;
          }

          // Extrair classes
          const classes = this.extractClasses(content, language);
          for (const cls of classes) {
            insertClass.run(
              cls.name,
              cls.code,
              file,
              language,
              cls.lineStart,
              cls.lineEnd
            );
            totalClasses++;
          }

          // Registrar arquivo indexado
          insertFile.run(file, language);
          filesIndexed++;

        } catch (error) {
          this.logger?.warn(`Erro ao indexar arquivo`, {
            file,
            error: error.message
          });
        }
      }
    });

    transaction();

    const stats = {
      filesIndexed,
      totalFunctions,
      totalClasses,
      totalFiles: files.length
    };

    this.logger?.info('Indexação concluída', stats);
    return stats;
  }

  /**
   * Busca funções por nome ou palavras-chave
   * @param {string} query - Query de busca
   * @param {number} topK - Número máximo de resultados
   * @returns {Array<object>} Resultados da busca
   */
  searchFunctions(query, topK = 5) {
    const queryLower = query.toLowerCase();
    
    // Busca por nome exato
    const exactMatch = this.db.prepare(`
      SELECT name, code, file_path, language, line_start, line_end
      FROM functions
      WHERE LOWER(name) = ?
      LIMIT ?
    `).all(queryLower, topK);

    if (exactMatch.length > 0) {
      return exactMatch.map(row => ({
        type: 'function',
        name: row.name,
        code: row.code,
        file: row.file_path,
        language: row.language,
        lineStart: row.line_start,
        lineEnd: row.line_end,
        similarity: 1.0
      }));
    }

    // Busca por palavras-chave no nome
    const keywordMatch = this.db.prepare(`
      SELECT name, code, file_path, language, line_start, line_end
      FROM functions
      WHERE LOWER(name) LIKE ?
      LIMIT ?
    `).all(`%${queryLower}%`, topK);

    // Busca por palavras-chave no código
    const codeMatch = this.db.prepare(`
      SELECT name, code, file_path, language, line_start, line_end
      FROM functions
      WHERE LOWER(code) LIKE ?
      LIMIT ?
    `).all(`%${queryLower}%`, topK);

    // Combinar e rankear resultados
    const results = new Map();
    
    keywordMatch.forEach(row => {
      const score = this.calculateSimilarity(queryLower, row.name.toLowerCase());
      results.set(`${row.file_path}:${row.name}`, {
        type: 'function',
        name: row.name,
        code: row.code,
        file: row.file_path,
        language: row.language,
        lineStart: row.line_start,
        lineEnd: row.line_end,
        similarity: score
      });
    });

    codeMatch.forEach(row => {
      const key = `${row.file_path}:${row.name}`;
      if (!results.has(key)) {
        const score = this.calculateSimilarity(queryLower, row.code.toLowerCase());
        results.set(key, {
          type: 'function',
          name: row.name,
          code: row.code,
          file: row.file_path,
          language: row.language,
          lineStart: row.line_start,
          lineEnd: row.line_end,
          similarity: score * 0.5 // Código tem peso menor que nome
        });
      }
    });

    // Ordenar por similaridade e retornar topK
    return Array.from(results.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Busca classes por nome ou palavras-chave
   * @param {string} query - Query de busca
   * @param {number} topK - Número máximo de resultados
   * @returns {Array<object>} Resultados da busca
   */
  searchClasses(query, topK = 5) {
    const queryLower = query.toLowerCase();
    
    const results = this.db.prepare(`
      SELECT name, code, file_path, language, line_start, line_end
      FROM classes
      WHERE LOWER(name) LIKE ?
      LIMIT ?
    `).all(`%${queryLower}%`, topK);

    return results.map(row => ({
      type: 'class',
      name: row.name,
      code: row.code,
      file: row.file_path,
      language: row.language,
      lineStart: row.line_start,
      lineEnd: row.line_end,
      similarity: this.calculateSimilarity(queryLower, row.name.toLowerCase())
    })).sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Busca geral (funções e classes) com timeout
   * @param {string} query - Query de busca
   * @param {number} topK - Número máximo de resultados
   * @returns {Promise<Array<object>>} Resultados da busca
   */
  async search(query, topK = 5) {
    // Verificar cache
    const cacheKey = `search:${query}:${topK}`;
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const results = await this.timeoutManager.withTimeout(
      async () => {
        const functions = this.searchFunctions(query, topK);
        const classes = this.searchClasses(query, Math.floor(topK / 2));

        // Combinar e ordenar por similaridade
        const allResults = [...functions, ...classes];
        return allResults
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, topK);
      },
      'knowledgeBase'
    );

    // Armazenar em cache
    this.cacheManager.set(cacheKey, results);
    return results;
  }

  /**
   * Calcula similaridade simples entre duas strings
   * @param {string} query - Query de busca
   * @param {string} text - Texto a comparar
   * @returns {number} Score de similaridade (0-1)
   */
  calculateSimilarity(query, text) {
    if (query === text) {
      return 1.0;
    }

    if (text.includes(query)) {
      return 0.8;
    }

    const queryWords = query.split(/\s+/).filter(w => w.length > 0);
    const textWords = text.split(/\s+/).filter(w => w.length > 0);

    if (queryWords.length === 0) {
      return 0;
    }

    let matches = 0;
    for (const qWord of queryWords) {
      if (textWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))) {
        matches++;
      }
    }

    return matches / queryWords.length;
  }

  /**
   * Aprende de uso (adiciona exemplo positivo ou anti-padrão)
   * @param {string} prompt - Prompt original
   * @param {string} generatedCode - Código gerado
   * @param {object} feedback - Feedback (accepted, rejected, reason)
   */
  async learnFromUsage(prompt, generatedCode, feedback) {
    const language = this.detectLanguageFromCode(generatedCode) || 'unknown';

    if (feedback.accepted) {
      // Adicionar exemplo positivo
      this.db.prepare(`
        INSERT INTO gold_examples (prompt, code, language)
        VALUES (?, ?, ?)
      `).run(prompt, generatedCode, language);

      this.logger?.info('Exemplo positivo adicionado à knowledge base', {
        prompt: prompt.substring(0, 50) + '...',
        language
      });
    } else if (feedback.rejected) {
      // Adicionar anti-padrão
      this.db.prepare(`
        INSERT INTO anti_patterns (prompt, code, reason, language)
        VALUES (?, ?, ?, ?)
      `).run(prompt, generatedCode, feedback.reason || 'Rejeitado pelo usuário', language);

      this.logger?.info('Anti-padrão adicionado à knowledge base', {
        prompt: prompt.substring(0, 50) + '...',
        reason: feedback.reason,
        language
      });
    }
  }

  /**
   * Detecta linguagem do código
   * @param {string} code - Código
   * @returns {string} Linguagem detectada
   */
  detectLanguageFromCode(code) {
    if (code.includes('def ') && code.includes(':')) {
      return 'python';
    }
    if (code.includes('function ') || code.includes('=>') || code.includes('const ')) {
      return 'javascript';
    }
    if (code.includes('class ') && code.includes('{')) {
      return 'javascript';
    }
    return 'unknown';
  }

  /**
   * Obtém estatísticas da knowledge base
   * @returns {object} Estatísticas
   */
  getStats() {
    const functionCount = this.db.prepare('SELECT COUNT(*) as count FROM functions').get().count;
    const classCount = this.db.prepare('SELECT COUNT(*) as count FROM classes').get().count;
    const fileCount = this.db.prepare('SELECT COUNT(*) as count FROM indexed_files').get().count;
    const goldExampleCount = this.db.prepare('SELECT COUNT(*) as count FROM gold_examples').get().count;
    const antiPatternCount = this.db.prepare('SELECT COUNT(*) as count FROM anti_patterns').get().count;

    return {
      functions: functionCount,
      classes: classCount,
      files: fileCount,
      goldExamples: goldExampleCount,
      antiPatterns: antiPatternCount
    };
  }

  /**
   * Fecha conexão com banco de dados
   */
  close() {
    if (this.dbManager && this.dbKey) {
      this.dbManager.closeConnection(this.dbKey);
      this.logger?.info('Conexão com banco de dados fechada');
    } else if (this.db) {
      try {
        this.db.close();
        this.logger?.info('Conexão com banco de dados fechada');
      } catch (error) {
        this.logger?.warn('Erro ao fechar conexão', { error: error.message });
      }
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do DynamicKnowledgeBase
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {DynamicKnowledgeBase} Instância
 */
export function getKnowledgeBase(config = null, logger = null) {
  if (!instance) {
    instance = new DynamicKnowledgeBase(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do DynamicKnowledgeBase
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {DynamicKnowledgeBase} Nova instância
 */
export function createKnowledgeBase(config = null, logger = null) {
  return new DynamicKnowledgeBase(config, logger);
}

export default DynamicKnowledgeBase;
