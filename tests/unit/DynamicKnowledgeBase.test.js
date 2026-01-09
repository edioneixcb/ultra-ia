/**
 * Testes unitários para DynamicKnowledgeBase
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import DynamicKnowledgeBase, { createKnowledgeBase } from '../../src/components/DynamicKnowledgeBase.js';
import { createLogger } from '../../src/utils/Logger.js';

describe('DynamicKnowledgeBase', () => {
  let testKbDir;
  let testCodebaseDir;
  let knowledgeBase;
  let logger;

  beforeEach(() => {
    // Criar diretórios temporários
    testKbDir = join(tmpdir(), `kb-test-${Date.now()}`);
    testCodebaseDir = join(tmpdir(), `codebase-test-${Date.now()}`);
    mkdirSync(testKbDir, { recursive: true });
    mkdirSync(testCodebaseDir, { recursive: true });

    // Criar logger de teste
    logger = createLogger({
      paths: { logs: testKbDir },
      logging: { level: 'error' } // Apenas erros nos testes
    });

    // Criar config de teste
    const config = {
      paths: { knowledgeBase: testKbDir }
    };

    knowledgeBase = createKnowledgeBase(config, logger);
  });

  afterEach(() => {
    // Fechar conexão com banco
    if (knowledgeBase) {
      knowledgeBase.close();
    }
  });

  describe('inicialização', () => {
    it('deve criar knowledge base com banco de dados', () => {
      expect(knowledgeBase).toBeInstanceOf(DynamicKnowledgeBase);
      expect(knowledgeBase.db).toBeDefined();
    });

    it('deve criar tabelas necessárias', () => {
      const tables = knowledgeBase.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();

      const tableNames = tables.map(t => t.name);
      expect(tableNames).toContain('functions');
      expect(tableNames).toContain('classes');
      expect(tableNames).toContain('indexed_files');
      expect(tableNames).toContain('gold_examples');
      expect(tableNames).toContain('anti_patterns');
    });
  });

  describe('detectLanguage', () => {
    it('deve detectar Python corretamente', () => {
      expect(knowledgeBase.detectLanguage('test.py')).toBe('python');
    });

    it('deve detectar JavaScript corretamente', () => {
      expect(knowledgeBase.detectLanguage('test.js')).toBe('javascript');
    });

    it('deve detectar TypeScript corretamente', () => {
      expect(knowledgeBase.detectLanguage('test.ts')).toBe('typescript');
    });
  });

  describe('extractFunctions', () => {
    it('deve extrair funções Python', () => {
      const code = `
def hello_world():
    print("Hello")
    return True

def another_function():
    pass
`;
      const functions = knowledgeBase.extractFunctions(code, 'python');
      expect(functions.length).toBeGreaterThan(0);
      expect(functions.some(f => f.name === 'hello_world')).toBe(true);
    });

    it('deve extrair funções JavaScript', () => {
      const code = `
function helloWorld() {
    console.log("Hello");
    return true;
}

const anotherFunction = () => {
    return false;
}
`;
      const functions = knowledgeBase.extractFunctions(code, 'javascript');
      expect(functions.length).toBeGreaterThan(0);
    });
  });

  describe('extractClasses', () => {
    it('deve extrair classes Python', () => {
      const code = `
class MyClass:
    def __init__(self):
        pass

class AnotherClass:
    pass
`;
      const classes = knowledgeBase.extractClasses(code, 'python');
      expect(classes.length).toBeGreaterThan(0);
      expect(classes.some(c => c.name === 'MyClass')).toBe(true);
    });

    it('deve extrair classes JavaScript', () => {
      const code = `
class MyClass {
    constructor() {
        this.value = 1;
    }
}
`;
      const classes = knowledgeBase.extractClasses(code, 'javascript');
      expect(classes.length).toBeGreaterThan(0);
    });
  });

  describe('indexCodebase', () => {
    it('deve indexar codebase Python', async () => {
      // Criar arquivo de teste
      const testFile = join(testCodebaseDir, 'test.py');
      writeFileSync(testFile, `
def hello():
    return "world"

class TestClass:
    def method(self):
        pass
`, 'utf-8');

      const stats = await knowledgeBase.indexCodebase(testCodebaseDir);
      
      expect(stats.filesIndexed).toBeGreaterThan(0);
      expect(stats.totalFunctions).toBeGreaterThan(0);
    });
  });

  describe('searchFunctions', () => {
    beforeEach(async () => {
      // Indexar codebase de teste
      const testFile = join(testCodebaseDir, 'utils.py');
      writeFileSync(testFile, `
def validate_email(email):
    return "@" in email

def calculate_sum(a, b):
    return a + b
`, 'utf-8');

      await knowledgeBase.indexCodebase(testCodebaseDir);
    });

    it('deve buscar função por nome exato', () => {
      const results = knowledgeBase.searchFunctions('validate_email', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('validate_email');
    });

    it('deve buscar função por palavra-chave', () => {
      const results = knowledgeBase.searchFunctions('email', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.name.includes('email'))).toBe(true);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const testFile = join(testCodebaseDir, 'test.py');
      writeFileSync(testFile, `
def test_function():
    pass

class TestClass:
    pass
`, 'utf-8');

      await knowledgeBase.indexCodebase(testCodebaseDir);
    });

    it('deve buscar funções e classes', async () => {
      const results = await knowledgeBase.search('test', 10);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.type === 'function')).toBe(true);
      expect(results.some(r => r.type === 'class')).toBe(true);
    });
  });

  describe('learnFromUsage', () => {
    it('deve adicionar exemplo positivo', async () => {
      const prompt = 'Create a function to validate email';
      const code = 'def validate_email(email): return "@" in email';
      
      await knowledgeBase.learnFromUsage(prompt, code, { accepted: true });

      const stats = knowledgeBase.getStats();
      expect(stats.goldExamples).toBeGreaterThan(0);
    });

    it('deve adicionar anti-padrão', async () => {
      const prompt = 'Create a function';
      const code = 'def bad_function(): pass';
      
      await knowledgeBase.learnFromUsage(prompt, code, {
        rejected: true,
        reason: 'Does not work'
      });

      const stats = knowledgeBase.getStats();
      expect(stats.antiPatterns).toBeGreaterThan(0);
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas corretas', () => {
      const stats = knowledgeBase.getStats();
      
      expect(stats).toHaveProperty('functions');
      expect(stats).toHaveProperty('classes');
      expect(stats).toHaveProperty('files');
      expect(stats).toHaveProperty('goldExamples');
      expect(stats).toHaveProperty('antiPatterns');
    });
  });
});
