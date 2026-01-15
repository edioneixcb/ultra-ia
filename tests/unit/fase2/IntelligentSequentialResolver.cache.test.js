/**
 * Testes unitários para cache do IntelligentSequentialResolver
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import IntelligentSequentialResolver, { createIntelligentSequentialResolver } from '../../../src/systems/fase2/IntelligentSequentialResolver.js';
import { getCacheManager } from '../../../src/utils/CacheManager.js';

describe('IntelligentSequentialResolver - Cache', () => {
  let resolver;
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

    mockConfig = {
      test: true,
      features: {
        useCache: true
      },
      cache: {
        enabled: true,
        maxSize: 100,
        ttl: 3600000
      }
    };

    resolver = createIntelligentSequentialResolver(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('cache integration', () => {
    it('deve usar cache quando habilitado', async () => {
      await resolver.initialize();
      
      expect(resolver.useCache).toBe(true);
      expect(resolver.cacheManager).toBeDefined();
    });

    it('deve gerar chave de cache corretamente', async () => {
      await resolver.initialize();
      
      const errors = [
        { id: 'error1', message: 'Error 1' },
        { id: 'error2', message: 'Error 2' }
      ];
      const codebase = { hash: 'test123', files: {} };
      
      const cacheKey = resolver.generateCacheKey(errors, codebase);
      expect(cacheKey).toContain('isr:');
      expect(cacheKey).toContain('error1');
      expect(cacheKey).toContain('error2');
    });

    it('deve retornar resultado do cache quando disponível', async () => {
      await resolver.initialize();
      
      const errors = [{ id: 'error1', message: 'Error 1' }];
      const codebase = { hash: 'test123', files: {} };
      
      const cachedResult = {
        total: 1,
        resolved: 1,
        failed: 0,
        skipped: 0,
        results: [],
        appliedFixes: [],
        successRate: 100
      };
      
      resolver.cacheManager.set(resolver.generateCacheKey(errors, codebase), cachedResult);
      
      // Primeira execução - não deve estar no cache ainda
      const result1 = await resolver.execute({
        errors,
        codebase,
        resolutionId: 'test-1'
      });
      
      expect(result1).toBeDefined();
      
      // Segunda execução - deve usar cache
      const result2 = await resolver.execute({
        errors,
        codebase,
        resolutionId: 'test-2'
      });
      
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('deve armazenar resultado no cache após resolução', async () => {
      await resolver.initialize();
      
      const errors = [{ id: 'error1', message: 'Error 1', type: 'syntax' }];
      const codebase = { hash: 'test123', files: { 'test.js': { content: 'const x = 1;' } } };
      
      const cacheKey = resolver.generateCacheKey(errors, codebase);
      
      await resolver.execute({
        errors,
        codebase,
        resolutionId: 'test-1'
      });
      
      const cached = resolver.cacheManager.get(cacheKey);
      expect(cached).toBeDefined();
      expect(cached.total).toBe(1);
    });

    it('deve funcionar sem cache quando desabilitado', async () => {
      mockConfig.features.useCache = false;
      resolver = createIntelligentSequentialResolver(mockConfig, mockLogger, mockErrorHandler);
      await resolver.initialize();
      
      expect(resolver.useCache).toBe(false);
      expect(resolver.cacheManager).toBeNull();
    });
  });

  describe('dependency graph cache', () => {
    it('deve cachear grafo de dependências', async () => {
      await resolver.initialize();
      
      const errors = [
        { id: 'error1', message: 'Error 1' },
        { id: 'error2', message: 'Error 2' }
      ];
      const codebase = { files: {} };
      
      const graph1 = await resolver.buildDependencyGraph(errors, codebase);
      const graph2 = await resolver.buildDependencyGraph(errors, codebase);
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('cache'),
        expect.any(Object)
      );
    });
  });
});
