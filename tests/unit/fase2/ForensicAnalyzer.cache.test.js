/**
 * Testes unitários para cache do ForensicAnalyzer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ForensicAnalyzer, { createForensicAnalyzer } from '../../../src/systems/fase2/ForensicAnalyzer.js';

describe('ForensicAnalyzer - Cache', () => {
  let analyzer;
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

    analyzer = createForensicAnalyzer(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('cache integration', () => {
    it('deve usar cache quando habilitado', async () => {
      await analyzer.initialize();
      
      expect(analyzer.useCache).toBe(true);
      expect(analyzer.cacheManager).toBeDefined();
    });

    it('deve cachear identificação de padrões', async () => {
      await analyzer.initialize();
      
      const error = {
        id: 'error1',
        message: 'SyntaxError: Unexpected token',
        type: 'syntax'
      };
      const context = {};
      
      // Primeira chamada - não deve estar no cache
      const pattern1 = await analyzer.identifyPattern(error, context);
      
      // Segunda chamada - deve usar cache
      const pattern2 = await analyzer.identifyPattern(error, context);
      
      expect(pattern1).toBeDefined();
      expect(pattern2).toBeDefined();
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('deve funcionar sem cache quando desabilitado', async () => {
      mockConfig.features.useCache = false;
      analyzer = createForensicAnalyzer(mockConfig, mockLogger, mockErrorHandler);
      await analyzer.initialize();
      
      expect(analyzer.useCache).toBe(false);
    });
  });
});
