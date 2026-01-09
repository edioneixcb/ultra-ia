/**
 * Testes unitários para PersistentContextManager
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import PersistentContextManager, { createContextManager } from '../../src/components/PersistentContextManager.js';
import { createLogger } from '../../src/utils/Logger.js';

describe('PersistentContextManager', () => {
  let testContextDir;
  let contextManager;
  let logger;

  beforeEach(() => {
    // Criar diretório temporário
    testContextDir = join(tmpdir(), `context-test-${Date.now()}`);
    mkdirSync(testContextDir, { recursive: true });

    // Criar logger de teste
    logger = createLogger({
      paths: { logs: testContextDir },
      logging: { level: 'error' }
    });

    // Criar config de teste
    const config = {
      paths: { context: testContextDir },
      context: {
        maxSize: 10000,
        maxHistoryDays: 30
      }
    };

    contextManager = createContextManager(config, logger);
  });

  afterEach(() => {
    // Fechar conexão com banco
    if (contextManager) {
      contextManager.close();
    }
  });

  describe('inicialização', () => {
    it('deve criar context manager com banco de dados', () => {
      expect(contextManager).toBeInstanceOf(PersistentContextManager);
      expect(contextManager.db).toBeDefined();
    });

    it('deve criar tabelas necessárias', () => {
      const tables = contextManager.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();

      const tableNames = tables.map(t => t.name);
      expect(tableNames).toContain('sessions');
      expect(tableNames).toContain('context_messages');
      expect(tableNames).toContain('compressed_context');
    });
  });

  describe('getOrCreateSession', () => {
    it('deve criar nova sessão', () => {
      const session = contextManager.getOrCreateSession('test-session-1', 'project-1');
      
      expect(session.id).toBe('test-session-1');
      expect(session.projectId).toBe('project-1');
      expect(session.createdAt).toBeDefined();
    });

    it('deve recuperar sessão existente', () => {
      contextManager.getOrCreateSession('test-session-2');
      const session = contextManager.getOrCreateSession('test-session-2');
      
      expect(session.id).toBe('test-session-2');
      expect(session.updatedAt).toBeDefined();
    });
  });

  describe('addMessage', () => {
    it('deve adicionar mensagem ao contexto', () => {
      const sessionId = 'test-session-3';
      const messageId = contextManager.addMessage(sessionId, 'user', 'Hello world', 5);
      
      expect(messageId).toBeDefined();
      
      const context = contextManager.getContext(sessionId);
      expect(context.length).toBe(1);
      expect(context[0].content).toBe('Hello world');
      expect(context[0].role).toBe('user');
    });

    it('deve adicionar múltiplas mensagens', () => {
      const sessionId = 'test-session-4';
      
      contextManager.addMessage(sessionId, 'user', 'First message');
      contextManager.addMessage(sessionId, 'assistant', 'Response');
      contextManager.addMessage(sessionId, 'user', 'Second message');
      
      const context = contextManager.getContext(sessionId);
      expect(context.length).toBe(3);
      expect(context[0].content).toBe('First message');
      expect(context[1].content).toBe('Response');
      expect(context[2].content).toBe('Second message');
    });
  });

  describe('getContext', () => {
    beforeEach(() => {
      const sessionId = 'test-session-5';
      contextManager.addMessage(sessionId, 'user', 'Message 1');
      contextManager.addMessage(sessionId, 'assistant', 'Response 1');
      contextManager.addMessage(sessionId, 'user', 'Message 2');
    });

    it('deve retornar contexto completo', () => {
      const context = contextManager.getContext('test-session-5');
      expect(context.length).toBe(3);
    });

    it('deve limitar número de mensagens', () => {
      const context = contextManager.getContext('test-session-5', 2);
      expect(context.length).toBe(2);
      expect(context[0].content).toBe('Response 1'); // Últimas 2
      expect(context[1].content).toBe('Message 2');
    });
  });

  describe('compressContext', () => {
    it('deve comprimir mensagens de baixa importância', async () => {
      const sessionId = 'test-session-6';
      
      // Adicionar mensagens com diferentes importâncias
      contextManager.addMessage(sessionId, 'user', 'Important', 9);
      contextManager.addMessage(sessionId, 'user', 'Normal', 5);
      contextManager.addMessage(sessionId, 'user', 'Low importance', 2);
      contextManager.addMessage(sessionId, 'user', 'Very low', 1);
      
      const stats = await contextManager.compressContext(sessionId);
      
      expect(stats.compressed).toBeGreaterThan(0);
      expect(stats.important).toBeGreaterThan(0);
      
      const compressed = contextManager.getCompressedContext(sessionId);
      expect(compressed.length).toBeGreaterThan(0);
    });
  });

  describe('getFormattedContext', () => {
    beforeEach(() => {
      const sessionId = 'test-session-7';
      contextManager.addMessage(sessionId, 'user', 'Hello', 8);
      contextManager.addMessage(sessionId, 'assistant', 'Hi there', 7);
    });

    it('deve retornar contexto formatado', () => {
      const formatted = contextManager.getFormattedContext('test-session-7');
      
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted[0]).toHaveProperty('role');
      expect(formatted[0]).toHaveProperty('content');
    });

    it('deve limitar por tokens', () => {
      const formatted = contextManager.getFormattedContext('test-session-7', 100);
      
      // Deve retornar contexto limitado
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('getSessionStats', () => {
    it('deve retornar estatísticas da sessão', () => {
      const sessionId = 'test-session-8';
      contextManager.addMessage(sessionId, 'user', 'Message 1');
      contextManager.addMessage(sessionId, 'assistant', 'Response 1');
      
      const stats = contextManager.getSessionStats(sessionId);
      
      expect(stats).toBeDefined();
      expect(stats.messageCount).toBe(2);
      expect(stats.activeMessages).toBe(2);
    });

    it('deve retornar null para sessão inexistente', () => {
      const stats = contextManager.getSessionStats('non-existent');
      expect(stats).toBeNull();
    });
  });

  describe('cleanupOldContext', () => {
    it('deve limpar contexto antigo', () => {
      const stats = contextManager.cleanupOldContext();
      
      expect(stats).toHaveProperty('removedMessages');
      expect(stats).toHaveProperty('removedSessions');
    });
  });
});
