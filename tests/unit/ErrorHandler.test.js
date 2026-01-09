/**
 * Testes unitários para ErrorHandler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ErrorHandler, { createErrorHandler } from '../../src/utils/ErrorHandler.js';

describe('ErrorHandler', () => {
  let errorHandler;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      warn: vi.fn(),
      error: vi.fn(),
      critical: vi.fn()
    };

    errorHandler = createErrorHandler(null, mockLogger);
  });

  describe('classifyError', () => {
    it('deve classificar erro de timeout como TEMPORARY', () => {
      const error = new Error('Request timeout');
      const classification = errorHandler.classifyError(error);
      expect(classification).toBe('TEMPORARY');
    });

    it('deve classificar erro de conexão como TEMPORARY', () => {
      const error = new Error('ECONNREFUSED');
      const classification = errorHandler.classifyError(error);
      expect(classification).toBe('TEMPORARY');
    });

    it('deve classificar erro crítico como CRITICAL', () => {
      const error = new Error('Critical system failure');
      const classification = errorHandler.classifyError(error);
      expect(classification).toBe('CRITICAL');
    });

    it('deve classificar erro genérico como PERMANENT', () => {
      const error = new Error('Invalid input');
      const classification = errorHandler.classifyError(error);
      expect(classification).toBe('PERMANENT');
    });

    it('deve classificar erro HTTP 500 como TEMPORARY', () => {
      const error = new Error('Internal Server Error');
      error.status = 500;
      const classification = errorHandler.classifyError(error);
      expect(classification).toBe('TEMPORARY');
    });

    it('deve classificar erro HTTP 401 como CRITICAL', () => {
      const error = new Error('Unauthorized');
      error.status = 401;
      const classification = errorHandler.classifyError(error);
      expect(classification).toBe('CRITICAL');
    });
  });

  describe('calculateBackoffDelay', () => {
    it('deve calcular delay exponencial corretamente', () => {
      errorHandler.config.retry = {
        initialDelay: 1000,
        backoffMultiplier: 2
      };

      expect(errorHandler.calculateBackoffDelay(1)).toBe(1000);
      expect(errorHandler.calculateBackoffDelay(2)).toBe(2000);
      expect(errorHandler.calculateBackoffDelay(3)).toBe(4000);
      expect(errorHandler.calculateBackoffDelay(4)).toBe(8000);
    });
  });

  describe('executeWithRetry', () => {
    it('deve executar função com sucesso na primeira tentativa', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await errorHandler.executeWithRetry(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('deve retentar em caso de erro temporário', async () => {
      const temporaryError = new Error('Timeout');
      const fn = vi.fn()
        .mockRejectedValueOnce(temporaryError)
        .mockRejectedValueOnce(temporaryError)
        .mockResolvedValue('success');
      
      errorHandler.config.retry.maxRetries = 3;
      
      const result = await errorHandler.executeWithRetry(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('deve falhar após maxRetries em erro temporário', async () => {
      const temporaryError = new Error('Timeout');
      const fn = vi.fn().mockRejectedValue(temporaryError);
      
      errorHandler.config.retry.maxRetries = 2;
      
      await expect(errorHandler.executeWithRetry(fn)).rejects.toThrow('Timeout');
      expect(fn).toHaveBeenCalledTimes(3); // 1 inicial + 2 retries
    });

    it('não deve retentar em erro permanente', async () => {
      const permanentError = new Error('Invalid input');
      const fn = vi.fn().mockRejectedValue(permanentError);
      
      await expect(errorHandler.executeWithRetry(fn)).rejects.toThrow('Invalid input');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeWithFallback', () => {
    it('deve executar função principal se bem-sucedida', async () => {
      const primaryFn = vi.fn().mockResolvedValue('primary');
      const fallbackFn = vi.fn();
      
      const result = await errorHandler.executeWithFallback(primaryFn, fallbackFn);
      
      expect(result).toBe('primary');
      expect(primaryFn).toHaveBeenCalledTimes(1);
      expect(fallbackFn).not.toHaveBeenCalled();
    });

    it('deve executar fallback se principal falhar', async () => {
      const primaryFn = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const fallbackFn = vi.fn().mockResolvedValue('fallback');
      
      const result = await errorHandler.executeWithFallback(primaryFn, fallbackFn);
      
      expect(result).toBe('fallback');
      expect(primaryFn).toHaveBeenCalledTimes(1);
      expect(fallbackFn).toHaveBeenCalledTimes(1);
    });

    it('deve passar erro para fallback', async () => {
      const error = new Error('Primary failed');
      const primaryFn = vi.fn().mockRejectedValue(error);
      const fallbackFn = vi.fn((err) => {
        expect(err).toBe(error);
        return Promise.resolve('fallback');
      });
      
      await errorHandler.executeWithFallback(primaryFn, fallbackFn);
      
      expect(fallbackFn).toHaveBeenCalledWith(error);
    });
  });

  describe('wrap', () => {
    it('deve envolver função e capturar erros', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Test error'));
      const wrapped = errorHandler.wrap(fn);
      
      await expect(wrapped()).rejects.toThrow('Test error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('deve suprimir erros se configurado', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Test error'));
      const wrapped = errorHandler.wrap(fn, {
        suppressErrors: true,
        defaultValue: 'default'
      });
      
      const result = await wrapped();
      expect(result).toBe('default');
    });

    it('deve notificar erros críticos', async () => {
      errorHandler.config.notifications.enabled = true;
      errorHandler.config.notifications.criticalOnly = true;
      
      const criticalError = new Error('Critical failure');
      const fn = vi.fn().mockRejectedValue(criticalError);
      const wrapped = errorHandler.wrap(fn);
      
      await expect(wrapped()).rejects.toThrow();
      expect(mockLogger.critical).toHaveBeenCalled();
    });
  });

  describe('notifyCritical', () => {
    it('deve notificar erro crítico quando habilitado', () => {
      errorHandler.config.notifications.enabled = true;
      errorHandler.config.notifications.criticalOnly = true;
      
      const error = new Error('Critical failure');
      errorHandler.notifyCritical(error, { context: 'test' });
      
      expect(mockLogger.critical).toHaveBeenCalled();
    });

    it('não deve notificar se desabilitado', () => {
      errorHandler.config.notifications.enabled = false;
      
      const error = new Error('Critical failure');
      errorHandler.notifyCritical(error);
      
      expect(mockLogger.critical).not.toHaveBeenCalled();
    });

    it('não deve notificar erro não crítico se criticalOnly=true', () => {
      errorHandler.config.notifications.enabled = true;
      errorHandler.config.notifications.criticalOnly = true;
      
      const error = new Error('Regular error');
      errorHandler.notifyCritical(error);
      
      expect(mockLogger.critical).not.toHaveBeenCalled();
    });
  });
});
