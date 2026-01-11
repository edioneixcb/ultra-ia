/**
 * Testes unitários para KnowledgeBaseIndexer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import KnowledgeBaseIndexer, { createKnowledgeBaseIndexer } from '../../../src/systems/fase4/KnowledgeBaseIndexer.js';
import { mkdtemp, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('KnowledgeBaseIndexer', () => {
  let indexer;
  let mockLogger;
  let mockErrorHandler;
  let mockConfig;
  let testDir;

  beforeEach(async () => {
    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };

    mockErrorHandler = {
      handleError: vi.fn()
    };

    mockConfig = { test: true };

    indexer = createKnowledgeBaseIndexer(mockConfig, mockLogger, mockErrorHandler);
    await indexer.initialize();

    // Criar diretório temporário para testes
    testDir = await mkdtemp(join(tmpdir(), 'kb-indexer-test-'));
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await indexer.initialize();
      expect(indexer.indexes).toBeDefined();
      expect(indexer.patterns).toBeDefined();
    });
  });

  describe('detectLanguage', () => {
    it('deve detectar JavaScript', () => {
      expect(indexer.detectLanguage('test.js')).toBe('javascript');
    });

    it('deve detectar TypeScript', () => {
      expect(indexer.detectLanguage('test.ts')).toBe('typescript');
    });
  });

  describe('extractFunctions', () => {
    it('deve extrair funções JavaScript', () => {
      const content = 'function testFunction() { return true; }';
      const functions = indexer.extractFunctions(content, 'test.js', 'javascript');

      expect(functions.length).toBeGreaterThan(0);
      expect(functions[0].name).toBe('testFunction');
    });
  });

  describe('extractClasses', () => {
    it('deve extrair classes JavaScript', () => {
      const content = 'class TestClass { }';
      const classes = indexer.extractClasses(content, 'test.js', 'javascript');

      expect(classes.length).toBeGreaterThan(0);
      expect(classes[0].name).toBe('TestClass');
    });
  });

  describe('extractPatterns', () => {
    it('deve extrair padrão Repository', async () => {
      const content = 'class UserRepository { }';
      const patterns = await indexer.extractPatterns(content, 'test.js', 'javascript');

      expect(patterns.some(p => p.type === 'repository')).toBe(true);
    });

    it('deve extrair padrão Use Case', async () => {
      const content = 'class CreateUserUseCase { }';
      const patterns = await indexer.extractPatterns(content, 'test.js', 'javascript');

      expect(patterns.some(p => p.type === 'usecase')).toBe(true);
    });
  });

  describe('categorizeCode', () => {
    it('deve categorizar código de segurança', () => {
      const category = indexer.categorizeCode('oauth handler', '/security/auth.js');
      expect(category).toBe('security');
    });

    it('deve categorizar código de arquitetura', () => {
      const category = indexer.categorizeCode('repository pattern', '/domain/repository.js');
      expect(category).toBe('architecture');
    });
  });

  describe('indexCodebase', () => {
    it('deve indexar codebase com arquivos de teste', async () => {
      // Criar arquivo de teste
      const testFile = join(testDir, 'test.js');
      await writeFile(testFile, 'function testFunction() { return true; }');

      const result = await indexer.indexCodebase(testDir);

      expect(result.success).toBe(true);
      expect(result.stats.filesProcessed).toBeGreaterThan(0);
    });

    it('deve lançar erro se codebasePath não existe', async () => {
      await expect(
        indexer.indexCodebase('/nonexistent/path/that/does/not/exist')
      ).rejects.toThrow('Caminho do codebase não existe');
    });
  });

  describe('execute', () => {
    it('deve executar indexação', async () => {
      const testFile = join(testDir, 'test.js');
      await writeFile(testFile, 'function test() { }');

      const result = await indexer.execute({
        codebasePath: testDir
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('deve lançar erro se codebasePath não fornecido', async () => {
      await expect(
        indexer.execute({})
      ).rejects.toThrow('codebasePath é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = indexer.onValidate({
        codebasePath: '/test/path'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(indexer.onValidate(null).valid).toBe(false);
      expect(indexer.onValidate({}).valid).toBe(false);
    });
  });
});
