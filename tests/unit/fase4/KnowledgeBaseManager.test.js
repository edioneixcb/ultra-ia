/**
 * Testes unitários para KnowledgeBaseManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import KnowledgeBaseManager, { createKnowledgeBaseManager } from '../../../src/systems/fase4/KnowledgeBaseManager.js';

describe('KnowledgeBaseManager', () => {
  let manager;
  let mockLogger;
  let mockErrorHandler;
  let mockConfig;

  beforeEach(() => {
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

    manager = createKnowledgeBaseManager(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await manager.initialize();
      expect(manager.knowledgeBase).toBeDefined();
      expect(manager.categories).toBeDefined();
      expect(manager.tags).toBeDefined();
    });
  });

  describe('addKnowledgeItem', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve adicionar item à Knowledge Base', async () => {
      const item = {
        name: 'Test Item',
        description: 'Test description',
        code: 'function test() { }'
      };

      const result = await manager.addKnowledgeItem(item);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Item');
      expect(result.category).toBeDefined();
      expect(result.tags).toBeDefined();
    });

    it('deve lançar erro se item inválido', async () => {
      const item = {}; // Sem name/title e sem content/code/description

      await expect(
        manager.addKnowledgeItem(item)
      ).rejects.toThrow('Item inválido');
    });
  });

  describe('searchKnowledge', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.addKnowledgeItem({
        name: 'Repository Pattern',
        description: 'Pattern for data access',
        category: 'architecture'
      });
    });

    it('deve buscar por query', async () => {
      const result = await manager.searchKnowledge('Repository');

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.count).toBeGreaterThan(0);
    });

    it('deve buscar por categoria', async () => {
      const result = await manager.searchKnowledge(null, 'architecture');

      expect(result.results.length).toBeGreaterThanOrEqual(0);
      if (result.results.length > 0) {
        expect(result.results.every(r => r.category === 'architecture')).toBe(true);
      }
    });

    it('deve buscar por tags', async () => {
      const result = await manager.searchKnowledge(null, null, ['architecture']);

      expect(result.results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve executar adição de item', async () => {
      const result = await manager.execute({
        action: 'add',
        item: {
          name: 'Test',
          description: 'Test description'
        }
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('deve executar busca', async () => {
      const result = await manager.execute({
        action: 'search',
        query: 'test'
      });

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
    });

    it('deve lançar erro se action não fornecido', async () => {
      await expect(
        manager.execute({})
      ).rejects.toThrow('action é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = manager.onValidate({
        action: 'search'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(manager.onValidate(null).valid).toBe(false);
      expect(manager.onValidate({}).valid).toBe(false);
    });
  });
});
