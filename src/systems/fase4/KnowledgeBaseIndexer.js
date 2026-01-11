/**
 * KnowledgeBaseIndexer - Sistema de Indexação de Código para Knowledge Base
 * 
 * Indexa código dos sistemas NexoPro e outras fontes para a Knowledge Base.
 * 
 * Funcionalidades:
 * - Indexação de Código (extrair funções, classes, padrões)
 * - Extração de Padrões (identificar padrões arquiteturais)
 * - Categorização Automática (categorizar por domínio)
 * - Metadados e Tags (adicionar tags e metadados para busca)
 * 
 * Métricas de Sucesso:
 * - 100% do código indexado corretamente
 * - 100% dos padrões identificados e categorizados
 * - 100% dos exemplos com metadados completos
 */

import BaseSystem from '../../core/BaseSystem.js';
import { readdir, readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

class KnowledgeBaseIndexer extends BaseSystem {
  async onInitialize() {
    this.indexes = new Map();
    this.patterns = new Map();
    this.logger?.info('KnowledgeBaseIndexer inicializado');
  }

  /**
   * Indexa código
   * 
   * @param {Object} context - Contexto com codebasePath e opções
   * @returns {Promise<Object>} Resultado da indexação
   */
  async onExecute(context) {
    const { codebasePath, indexId, options = {} } = context;

    if (!codebasePath) {
      throw new Error('codebasePath é obrigatório no contexto');
    }

    this.logger?.info('Iniciando indexação de código', {
      codebasePath,
      indexId: indexId || 'desconhecido'
    });

    const result = await this.indexCodebase(codebasePath, options);

    // Armazenar índice
    const id = indexId || `index-${Date.now()}`;
    this.indexes.set(id, {
      ...result,
      codebasePath,
      indexedAt: new Date().toISOString()
    });

    return result;
  }

  /**
   * Indexa codebase completo
   * 
   * @param {string} codebasePath - Caminho do codebase
   * @param {Object} options - Opções de indexação
   * @returns {Promise<Object>} Resultado da indexação
   */
  async indexCodebase(codebasePath, options = {}) {
    const {
      includePatterns = true,
      extractExamples = true,
      categorize = true,
      addMetadata = true
    } = options;

    // Verificar se caminho existe
    try {
      await stat(codebasePath);
    } catch (error) {
      throw new Error(`Caminho do codebase não existe: ${codebasePath}`);
    }

    const stats = {
      filesProcessed: 0,
      functionsIndexed: 0,
      classesIndexed: 0,
      patternsFound: 0,
      examplesExtracted: 0,
      categories: new Set()
    };

    const indexedItems = [];

    try {
      // Encontrar todos os arquivos de código
      const codeFiles = await this.findCodeFiles(codebasePath);

      // Processar cada arquivo
      for (const filePath of codeFiles) {
        try {
          const content = await readFile(filePath, 'utf-8');
          const language = this.detectLanguage(filePath);

          // Extrair funções
          const functions = this.extractFunctions(content, filePath, language);
          stats.functionsIndexed += functions.length;

          // Extrair classes
          const classes = this.extractClasses(content, filePath, language);
          stats.classesIndexed += classes.length;

          // Extrair padrões se solicitado
          if (includePatterns) {
            const patterns = await this.extractPatterns(content, filePath, language);
            stats.patternsFound += patterns.length;
            patterns.forEach(p => {
              if (!this.patterns.has(p.id)) {
                this.patterns.set(p.id, p);
              }
            });
          }

          // Extrair exemplos se solicitado
          if (extractExamples) {
            const examples = await this.extractExamples(content, filePath, language);
            stats.examplesExtracted += examples.length;
            indexedItems.push(...examples);
          }

          // Categorizar se solicitado
          if (categorize) {
            const category = this.categorizeCode(content, filePath);
            if (category) {
              stats.categories.add(category);
            }
          }

          indexedItems.push(...functions, ...classes);
          stats.filesProcessed++;

        } catch (error) {
          this.logger?.warn('Erro ao processar arquivo', {
            filePath,
            error: error.message
          });
        }
      }

      // Adicionar metadados se solicitado
      if (addMetadata) {
        for (const item of indexedItems) {
          item.metadata = this.generateMetadata(item, codebasePath);
          if (categorize) {
            item.category = this.categorizeCode(item.code || '', item.filePath);
          }
        }
      }

      return {
        success: true,
        stats: {
          ...stats,
          categories: Array.from(stats.categories),
          totalItems: indexedItems.length
        },
        indexedItems,
        patterns: includePatterns ? Array.from(this.patterns.values()) : []
      };

    } catch (error) {
      this.logger?.error('Erro ao indexar codebase', {
        codebasePath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Encontra arquivos de código
   * 
   * @param {string} codebasePath - Caminho do codebase
   * @returns {Promise<Array<string>>} Lista de arquivos
   */
  async findCodeFiles(codebasePath) {
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs'];
    const files = [];

    const walk = async (dir) => {
      try {
        const entries = await readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          // Ignorar node_modules, .git, etc
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }

          if (entry.isDirectory()) {
            await walk(fullPath);
          } else if (entry.isFile()) {
            const ext = extname(entry.name);
            if (codeExtensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignorar erros de permissão
      }
    };

    await walk(codebasePath);
    return files;
  }

  /**
   * Detecta linguagem do arquivo
   * 
   * @param {string} filePath - Caminho do arquivo
   * @returns {string} Linguagem detectada
   */
  detectLanguage(filePath) {
    const ext = extname(filePath);
    const languageMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust'
    };

    return languageMap[ext] || 'unknown';
  }

  /**
   * Extrai funções do código
   * 
   * @param {string} content - Conteúdo do arquivo
   * @param {string} filePath - Caminho do arquivo
   * @param {string} language - Linguagem
   * @returns {Array<Object>} Funções extraídas
   */
  extractFunctions(content, filePath, language) {
    const functions = [];

    if (language === 'javascript' || language === 'typescript') {
      // Padrão para funções JavaScript/TypeScript
      const functionRegex = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))/g;
      let match;
      let lineNumber = 1;

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (functionRegex.test(line)) {
          const functionMatch = line.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))/);
          if (functionMatch) {
            const name = functionMatch[1] || functionMatch[2];
            functions.push({
              type: 'function',
              name,
              filePath,
              language,
              lineStart: i + 1,
              code: this.extractFunctionCode(content, i)
            });
          }
        }
      }
    }

    return functions;
  }

  /**
   * Extrai código de função
   * 
   * @param {string} content - Conteúdo completo
   * @param {number} startLine - Linha inicial
   * @returns {string} Código da função
   */
  extractFunctionCode(content, startLine) {
    const lines = content.split('\n');
    let braceCount = 0;
    let inFunction = false;
    let endLine = startLine;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          inFunction = true;
        } else if (char === '}') {
          braceCount--;
          if (inFunction && braceCount === 0) {
            endLine = i;
            break;
          }
        }
      }

      if (inFunction && braceCount === 0) {
        break;
      }
    }

    return lines.slice(startLine, endLine + 1).join('\n');
  }

  /**
   * Extrai classes do código
   * 
   * @param {string} content - Conteúdo do arquivo
   * @param {string} filePath - Caminho do arquivo
   * @param {string} language - Linguagem
   * @returns {Array<Object>} Classes extraídas
   */
  extractClasses(content, filePath, language) {
    const classes = [];

    if (language === 'javascript' || language === 'typescript') {
      const classRegex = /class\s+(\w+)/g;
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/class\s+(\w+)/);
        if (match) {
          classes.push({
            type: 'class',
            name: match[1],
            filePath,
            language,
            lineStart: i + 1,
            code: this.extractClassCode(content, i)
          });
        }
      }
    }

    return classes;
  }

  /**
   * Extrai código de classe
   * 
   * @param {string} content - Conteúdo completo
   * @param {number} startLine - Linha inicial
   * @returns {string} Código da classe
   */
  extractClassCode(content, startLine) {
    const lines = content.split('\n');
    let braceCount = 0;
    let inClass = false;
    let endLine = startLine;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          inClass = true;
        } else if (char === '}') {
          braceCount--;
          if (inClass && braceCount === 0) {
            endLine = i;
            break;
          }
        }
      }

      if (inClass && braceCount === 0) {
        break;
      }
    }

    return lines.slice(startLine, endLine + 1).join('\n');
  }

  /**
   * Extrai padrões do código
   * 
   * @param {string} content - Conteúdo do arquivo
   * @param {string} filePath - Caminho do arquivo
   * @param {string} language - Linguagem
   * @returns {Promise<Array<Object>>} Padrões encontrados
   */
  async extractPatterns(content, filePath, language) {
    const patterns = [];

    // Padrão: Repository Pattern
    if (/class\s+\w+Repository|interface\s+\w+Repository/i.test(content)) {
      patterns.push({
        id: `pattern-repository-${Date.now()}`,
        type: 'repository',
        name: 'Repository Pattern',
        filePath,
        description: 'Implementação do padrão Repository',
        category: 'architecture'
      });
    }

    // Padrão: Use Case Pattern
    if (/class\s+\w+UseCase|class\s+\w+Case/i.test(content)) {
      patterns.push({
        id: `pattern-usecase-${Date.now()}`,
        type: 'usecase',
        name: 'Use Case Pattern',
        filePath,
        description: 'Implementação do padrão Use Case',
        category: 'architecture'
      });
    }

    // Padrão: OAuth Handler
    if (/oauth|OAuth/i.test(content) && /handler|Handler/i.test(content)) {
      patterns.push({
        id: `pattern-oauth-${Date.now()}`,
        type: 'oauth',
        name: 'OAuth Handler',
        filePath,
        description: 'Implementação de handler OAuth',
        category: 'security'
      });
    }

    return patterns;
  }

  /**
   * Extrai exemplos do código
   * 
   * @param {string} content - Conteúdo do arquivo
   * @param {string} filePath - Caminho do arquivo
   * @param {string} language - Linguagem
   * @returns {Promise<Array<Object>>} Exemplos extraídos
   */
  async extractExamples(content, filePath, language) {
    const examples = [];

    // Extrair comentários de exemplo
    const exampleRegex = /\/\*\*\s*@example\s*([\s\S]*?)\*\//g;
    let match;

    while ((match = exampleRegex.exec(content)) !== null) {
      examples.push({
        type: 'example',
        content: match[1].trim(),
        filePath,
        language,
        source: 'comment'
      });
    }

    return examples;
  }

  /**
   * Categoriza código por domínio
   * 
   * @param {string} content - Conteúdo do código
   * @param {string} filePath - Caminho do arquivo
   * @returns {string|null} Categoria
   */
  categorizeCode(content, filePath) {
    // Categorizar por caminho do arquivo
    if (filePath.includes('/security/') || filePath.includes('/auth/')) {
      return 'security';
    }
    if (filePath.includes('/database/') || filePath.includes('/db/')) {
      return 'database';
    }
    if (filePath.includes('/api/') || filePath.includes('/routes/')) {
      return 'api';
    }
    if (filePath.includes('/mobile/') || filePath.includes('/react-native/')) {
      return 'mobile';
    }
    if (filePath.includes('/integration/') || filePath.includes('/webhook/')) {
      return 'integration';
    }
    if (filePath.includes('/domain/') || filePath.includes('/entities/')) {
      return 'architecture';
    }

    // Categorizar por conteúdo
    if (/oauth|encryption|jwt|token/i.test(content)) {
      return 'security';
    }
    if (/repository|usecase|domain/i.test(content)) {
      return 'architecture';
    }
    if (/expo|react-native|watermelon/i.test(content)) {
      return 'mobile';
    }

    return 'general';
  }

  /**
   * Gera metadados para item indexado
   * 
   * @param {Object} item - Item indexado
   * @param {string} codebasePath - Caminho do codebase
   * @returns {Object} Metadados
   */
  generateMetadata(item, codebasePath) {
    const tags = [];

    // Adicionar tags baseadas no tipo
    if (item.type === 'function') {
      tags.push('function', item.language);
    } else if (item.type === 'class') {
      tags.push('class', item.language);
    }

    // Adicionar tags baseadas na categoria
    if (item.category) {
      tags.push(item.category);
    }

    // Adicionar tags baseadas no nome
    if (item.name) {
      const nameLower = item.name.toLowerCase();
      if (nameLower.includes('repository')) tags.push('repository-pattern');
      if (nameLower.includes('usecase')) tags.push('usecase-pattern');
      if (nameLower.includes('handler')) tags.push('handler');
      if (nameLower.includes('service')) tags.push('service');
    }

    return {
      tags: [...new Set(tags)],
      indexedAt: new Date().toISOString(),
      codebase: codebasePath,
      language: item.language
    };
  }

  /**
   * Obtém índice armazenado
   * 
   * @param {string} indexId - ID do índice
   * @returns {Object|null} Índice ou null
   */
  getIndex(indexId) {
    return this.indexes.get(indexId) || null;
  }

  /**
   * Obtém padrão armazenado
   * 
   * @param {string} patternId - ID do padrão
   * @returns {Object|null} Padrão ou null
   */
  getPattern(patternId) {
    return this.patterns.get(patternId) || null;
  }

  /**
   * Busca padrões por categoria
   * 
   * @param {string} category - Categoria
   * @returns {Array<Object>} Padrões encontrados
   */
  searchPatternsByCategory(category) {
    return Array.from(this.patterns.values()).filter(p => p.category === category);
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const allIndexes = Array.from(this.indexes.values());
    const totalItems = allIndexes.reduce((sum, idx) => sum + (idx.stats?.totalItems || 0), 0);

    return {
      totalIndexes: allIndexes.length,
      totalItems,
      totalPatterns: this.patterns.size,
      patternsByCategory: this.getPatternsByCategory()
    };
  }

  /**
   * Obtém padrões por categoria
   * 
   * @returns {Object} Padrões agrupados por categoria
   */
  getPatternsByCategory() {
    const byCategory = {};

    for (const pattern of this.patterns.values()) {
      const category = pattern.category || 'general';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(pattern);
    }

    return byCategory;
  }

  /**
   * Valida contexto
   * 
   * @param {Object} context - Contexto
   * @returns {Object} Resultado da validação
   */
  onValidate(context) {
    if (!context || typeof context !== 'object') {
      return { valid: false, errors: ['Context deve ser um objeto'] };
    }

    if (!context.codebasePath || typeof context.codebasePath !== 'string') {
      return { valid: false, errors: ['codebasePath é obrigatório e deve ser string'] };
    }

    return { valid: true };
  }

  /**
   * Retorna dependências do sistema
   * 
   * @returns {Array<string>} Dependências
   */
  onGetDependencies() {
    return ['logger', 'config'];
  }
}

export default KnowledgeBaseIndexer;

/**
 * Factory function para criar KnowledgeBaseIndexer
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {KnowledgeBaseIndexer} Instância do KnowledgeBaseIndexer
 */
export function createKnowledgeBaseIndexer(config = null, logger = null, errorHandler = null) {
  return new KnowledgeBaseIndexer(config, logger, errorHandler);
}
