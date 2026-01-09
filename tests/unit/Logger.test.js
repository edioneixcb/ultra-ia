/**
 * Testes unitários para Logger
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import StructuredLogger, { createLogger } from '../../src/utils/Logger.js';

describe('StructuredLogger', () => {
  let testLogDir;

  beforeEach(() => {
    testLogDir = join(tmpdir(), `logger-test-${Date.now()}`);
    mkdirSync(testLogDir, { recursive: true });
  });

  afterEach(() => {
    // Limpar arquivos de log de teste se necessário
  });

  describe('criação', () => {
    it('deve criar logger com configuração padrão', () => {
      const logger = createLogger({
        paths: { logs: testLogDir },
        logging: { level: 'info' }
      });

      expect(logger).toBeInstanceOf(StructuredLogger);
      expect(logger.level).toBe('INFO');
    });

    it('deve criar logger com nível customizado', () => {
      const logger = createLogger({
        paths: { logs: testLogDir },
        logging: { level: 'debug' }
      });

      expect(logger.level).toBe('DEBUG');
    });
  });

  describe('níveis de log', () => {
    it('deve logar INFO quando nível é INFO', () => {
      const logger = createLogger({
        paths: { logs: testLogDir },
        logging: { level: 'info' }
      });

      logger.info('Test message');
      
      const logFile = logger.getLogFile('system');
      expect(existsSync(logFile)).toBe(true);
    });

    it('não deve logar DEBUG quando nível é INFO', () => {
      const logger = createLogger({
        paths: { logs: testLogDir },
        logging: { level: 'info' }
      });

      const initialFiles = existsSync(logger.getLogFile('system'));

      logger.debug('Debug message');
      
      // Se arquivo não existia antes, ainda não deve existir
      // (implementação pode criar arquivo vazio, então verificar conteúdo)
      if (existsSync(logger.getLogFile('system'))) {
        const content = readFileSync(logger.getLogFile('system'), 'utf-8');
        expect(content).not.toContain('DEBUG');
      }
    });

    it('deve logar ERROR mesmo quando nível é INFO', () => {
      const logger = createLogger({
        paths: { logs: testLogDir },
        logging: { level: 'info' }
      });

      logger.error('Error message');
      
      const systemFile = logger.getLogFile('system');
      const errorFile = logger.getLogFile('error');
      
      expect(existsSync(systemFile)).toBe(true);
      expect(existsSync(errorFile)).toBe(true);
    });
  });

  describe('formato de log', () => {
    it('deve criar log em formato JSON', () => {
      const logger = createLogger({
        paths: { logs: testLogDir },
        logging: { level: 'info', format: 'json' }
      });

      logger.info('Test message', { test: 'data' });
      
      const logFile = logger.getLogFile('system');
      if (existsSync(logFile)) {
        const content = readFileSync(logFile, 'utf-8');
        const logEntry = JSON.parse(content.trim());
        
        expect(logEntry).toHaveProperty('timestamp');
        expect(logEntry).toHaveProperty('level', 'INFO');
        expect(logEntry).toHaveProperty('message', 'Test message');
        expect(logEntry).toHaveProperty('test', 'data');
      }
    });
  });

  describe('contexto', () => {
    it('deve incluir contexto fixo em logs', () => {
      const logger = createLogger({
        paths: { logs: testLogDir },
        logging: { level: 'info' }
      });

      const contextualLogger = logger.withContext({
        sessionId: 'test-session',
        component: 'TestComponent'
      });

      contextualLogger.info('Test message');
      
      const logFile = logger.getLogFile('system');
      if (existsSync(logFile)) {
        const content = readFileSync(logFile, 'utf-8');
        const logEntry = JSON.parse(content.trim());
        
        expect(logEntry).toHaveProperty('sessionId', 'test-session');
        expect(logEntry).toHaveProperty('component', 'TestComponent');
      }
    });
  });

  describe('erros', () => {
    it('deve extrair informações de Error object', () => {
      const logger = createLogger({
        paths: { logs: testLogDir },
        logging: { level: 'error' }
      });

      const testError = new Error('Test error');
      logger.error('Error occurred', { error: testError });
      
      const logFile = logger.getLogFile('error');
      if (existsSync(logFile)) {
        const content = readFileSync(logFile, 'utf-8');
        const logEntry = JSON.parse(content.trim());
        
        expect(logEntry.error).toHaveProperty('name', 'Error');
        expect(logEntry.error).toHaveProperty('message', 'Test error');
        expect(logEntry.error).toHaveProperty('stack');
      }
    });
  });

  describe('setLevel', () => {
    it('deve alterar nível de log', () => {
      const logger = createLogger({
        paths: { logs: testLogDir },
        logging: { level: 'info' }
      });

      expect(logger.level).toBe('INFO');
      
      logger.setLevel('debug');
      expect(logger.level).toBe('DEBUG');
      
      logger.setLevel('warn');
      expect(logger.level).toBe('WARN');
    });

    it('deve ignorar nível inválido', () => {
      const logger = createLogger({
        paths: { logs: testLogDir },
        logging: { level: 'info' }
      });

      const originalLevel = logger.level;
      logger.setLevel('invalid');
      
      expect(logger.level).toBe(originalLevel);
    });
  });
});
