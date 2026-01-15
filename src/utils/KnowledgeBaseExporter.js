/**
 * Knowledge Base Exporter
 * 
 * Exporta e importa dados da Knowledge Base:
 * - Exportação para JSON
 * - Importação com validação
 * - Backup e restore
 */

import { getLogger } from './Logger.js';
import { getKnowledgeBase } from '../components/DynamicKnowledgeBase.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

class KnowledgeBaseExporter {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
  }

  /**
   * Exporta Knowledge Base para arquivo JSON
   * @param {string} outputPath - Caminho do arquivo de saída
   * @param {object} options - Opções { includeFunctions, includeClasses, includeExamples, includePatterns }
   * @returns {object} Resultado da exportação
   */
  async exportToFile(outputPath, options = {}) {
    const {
      includeFunctions = true,
      includeClasses = true,
      includeExamples = true,
      includePatterns = true,
      projectId = null
    } = options;

    const kb = getKnowledgeBase(this.config, this.logger);
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      projectId,
      data: {}
    };

    try {
      // Exportar funções
      if (includeFunctions) {
        exportData.data.functions = this.exportFunctions(kb);
      }

      // Exportar classes
      if (includeClasses) {
        exportData.data.classes = this.exportClasses(kb);
      }

      // Exportar exemplos gold
      if (includeExamples) {
        exportData.data.goldExamples = this.exportGoldExamples(kb);
      }

      // Exportar anti-patterns
      if (includePatterns) {
        exportData.data.antiPatterns = this.exportAntiPatterns(kb);
      }

      // Criar diretório se não existir
      const dir = dirname(outputPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Escrever arquivo
      writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');

      const stats = {
        functions: exportData.data.functions?.length || 0,
        classes: exportData.data.classes?.length || 0,
        goldExamples: exportData.data.goldExamples?.length || 0,
        antiPatterns: exportData.data.antiPatterns?.length || 0
      };

      this.logger?.info('Knowledge Base exportada', { outputPath, stats });

      return {
        success: true,
        path: outputPath,
        stats,
        exportedAt: exportData.exportedAt
      };

    } catch (error) {
      this.logger?.error('Erro ao exportar Knowledge Base', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Importa Knowledge Base de arquivo JSON
   * @param {string} inputPath - Caminho do arquivo de entrada
   * @param {object} options - Opções { merge, validate, projectId }
   * @returns {object} Resultado da importação
   */
  async importFromFile(inputPath, options = {}) {
    const {
      merge = true,  // Se false, limpa KB antes de importar
      validate = true,
      projectId = null
    } = options;

    if (!existsSync(inputPath)) {
      return {
        success: false,
        error: `Arquivo não encontrado: ${inputPath}`
      };
    }

    const kb = getKnowledgeBase(this.config, this.logger);

    try {
      // Ler arquivo
      const content = readFileSync(inputPath, 'utf-8');
      const importData = JSON.parse(content);

      // Validar estrutura
      if (validate) {
        const validation = this.validateImportData(importData);
        if (!validation.valid) {
          return {
            success: false,
            error: 'Dados de importação inválidos',
            validationErrors: validation.errors
          };
        }
      }

      const stats = {
        functionsImported: 0,
        classesImported: 0,
        examplesImported: 0,
        patternsImported: 0,
        skipped: 0
      };

      // Importar funções
      if (importData.data.functions) {
        const result = await this.importFunctions(kb, importData.data.functions, merge);
        stats.functionsImported = result.imported;
        stats.skipped += result.skipped;
      }

      // Importar classes
      if (importData.data.classes) {
        const result = await this.importClasses(kb, importData.data.classes, merge);
        stats.classesImported = result.imported;
        stats.skipped += result.skipped;
      }

      // Importar exemplos gold
      if (importData.data.goldExamples) {
        const result = await this.importGoldExamples(kb, importData.data.goldExamples);
        stats.examplesImported = result.imported;
      }

      // Importar anti-patterns
      if (importData.data.antiPatterns) {
        const result = await this.importAntiPatterns(kb, importData.data.antiPatterns);
        stats.patternsImported = result.imported;
      }

      this.logger?.info('Knowledge Base importada', { inputPath, stats });

      return {
        success: true,
        stats,
        importedFrom: inputPath,
        originalExportedAt: importData.exportedAt
      };

    } catch (error) {
      this.logger?.error('Erro ao importar Knowledge Base', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cria backup da Knowledge Base
   * @param {string} backupDir - Diretório de backup
   * @returns {object} Resultado do backup
   */
  async createBackup(backupDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(backupDir, `kb-backup-${timestamp}.json`);
    
    return await this.exportToFile(backupPath, {
      includeFunctions: true,
      includeClasses: true,
      includeExamples: true,
      includePatterns: true
    });
  }

  /**
   * Restaura backup da Knowledge Base
   * @param {string} backupPath - Caminho do backup
   * @returns {object} Resultado do restore
   */
  async restoreBackup(backupPath) {
    return await this.importFromFile(backupPath, {
      merge: false, // Substitui dados existentes
      validate: true
    });
  }

  // Métodos internos de exportação
  exportFunctions(kb) {
    try {
      const rows = kb.db.prepare(`
        SELECT name, file_path, params, return_type, docstring, signature
        FROM functions
      `).all();

      return rows.map(row => ({
        name: row.name,
        filePath: row.file_path,
        params: row.params,
        returnType: row.return_type,
        docstring: row.docstring,
        signature: row.signature
      }));
    } catch (error) {
      this.logger?.warn('Erro ao exportar funções', { error: error.message });
      return [];
    }
  }

  exportClasses(kb) {
    try {
      const rows = kb.db.prepare(`
        SELECT name, file_path, methods, properties, docstring
        FROM classes
      `).all();

      return rows.map(row => ({
        name: row.name,
        filePath: row.file_path,
        methods: row.methods,
        properties: row.properties,
        docstring: row.docstring
      }));
    } catch (error) {
      this.logger?.warn('Erro ao exportar classes', { error: error.message });
      return [];
    }
  }

  exportGoldExamples(kb) {
    try {
      const rows = kb.db.prepare(`
        SELECT category, prompt, code, explanation, tags
        FROM gold_examples
      `).all();

      return rows.map(row => ({
        category: row.category,
        prompt: row.prompt,
        code: row.code,
        explanation: row.explanation,
        tags: row.tags
      }));
    } catch (error) {
      this.logger?.warn('Erro ao exportar gold examples', { error: error.message });
      return [];
    }
  }

  exportAntiPatterns(kb) {
    try {
      const rows = kb.db.prepare(`
        SELECT category, pattern, description, correction
        FROM anti_patterns
      `).all();

      return rows.map(row => ({
        category: row.category,
        pattern: row.pattern,
        description: row.description,
        correction: row.correction
      }));
    } catch (error) {
      this.logger?.warn('Erro ao exportar anti-patterns', { error: error.message });
      return [];
    }
  }

  // Métodos internos de importação
  async importFunctions(kb, functions, merge) {
    let imported = 0;
    let skipped = 0;

    for (const func of functions) {
      try {
        // Verificar se já existe
        const exists = kb.db.prepare(`
          SELECT id FROM functions WHERE name = ? AND file_path = ?
        `).get(func.name, func.filePath);

        if (exists && merge) {
          // Atualizar
          kb.db.prepare(`
            UPDATE functions 
            SET params = ?, return_type = ?, docstring = ?, signature = ?
            WHERE name = ? AND file_path = ?
          `).run(func.params, func.returnType, func.docstring, func.signature, func.name, func.filePath);
        } else if (!exists) {
          // Inserir
          kb.db.prepare(`
            INSERT INTO functions (name, file_path, params, return_type, docstring, signature)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(func.name, func.filePath, func.params, func.returnType, func.docstring, func.signature);
        } else {
          skipped++;
          continue;
        }
        imported++;
      } catch (error) {
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importClasses(kb, classes, merge) {
    let imported = 0;
    let skipped = 0;

    for (const cls of classes) {
      try {
        const exists = kb.db.prepare(`
          SELECT id FROM classes WHERE name = ? AND file_path = ?
        `).get(cls.name, cls.filePath);

        if (exists && merge) {
          kb.db.prepare(`
            UPDATE classes 
            SET methods = ?, properties = ?, docstring = ?
            WHERE name = ? AND file_path = ?
          `).run(cls.methods, cls.properties, cls.docstring, cls.name, cls.filePath);
        } else if (!exists) {
          kb.db.prepare(`
            INSERT INTO classes (name, file_path, methods, properties, docstring)
            VALUES (?, ?, ?, ?, ?)
          `).run(cls.name, cls.filePath, cls.methods, cls.properties, cls.docstring);
        } else {
          skipped++;
          continue;
        }
        imported++;
      } catch (error) {
        skipped++;
      }
    }

    return { imported, skipped };
  }

  async importGoldExamples(kb, examples) {
    let imported = 0;

    for (const example of examples) {
      try {
        kb.db.prepare(`
          INSERT OR REPLACE INTO gold_examples (category, prompt, code, explanation, tags)
          VALUES (?, ?, ?, ?, ?)
        `).run(example.category, example.prompt, example.code, example.explanation, example.tags);
        imported++;
      } catch (error) {
        // Ignorar erro
      }
    }

    return { imported };
  }

  async importAntiPatterns(kb, patterns) {
    let imported = 0;

    for (const pattern of patterns) {
      try {
        kb.db.prepare(`
          INSERT OR REPLACE INTO anti_patterns (category, pattern, description, correction)
          VALUES (?, ?, ?, ?)
        `).run(pattern.category, pattern.pattern, pattern.description, pattern.correction);
        imported++;
      } catch (error) {
        // Ignorar erro
      }
    }

    return { imported };
  }

  /**
   * Valida dados de importação
   */
  validateImportData(data) {
    const errors = [];

    if (!data) {
      errors.push('Dados de importação vazios');
      return { valid: false, errors };
    }

    if (!data.version) {
      errors.push('Versão não especificada');
    }

    if (!data.data) {
      errors.push('Seção data não encontrada');
    }

    // Validar funções se presentes
    if (data.data?.functions) {
      if (!Array.isArray(data.data.functions)) {
        errors.push('functions deve ser um array');
      }
    }

    // Validar classes se presentes
    if (data.data?.classes) {
      if (!Array.isArray(data.data.classes)) {
        errors.push('classes deve ser um array');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do KnowledgeBaseExporter
 */
export function getKnowledgeBaseExporter(config = null, logger = null) {
  if (!instance) {
    instance = new KnowledgeBaseExporter(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do KnowledgeBaseExporter
 */
export function createKnowledgeBaseExporter(config = null, logger = null) {
  return new KnowledgeBaseExporter(config, logger);
}

export default KnowledgeBaseExporter;
