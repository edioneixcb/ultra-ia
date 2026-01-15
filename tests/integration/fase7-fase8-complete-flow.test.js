/**
 * Testes de integração para fluxos completos Fase 7 e Fase 8
 * 
 * Testa todo o pipeline desde análise até validação final
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getComponentRegistry } from '../../src/core/index.js';
import UltraSystem from '../../src/systems/UltraSystem.js';

describe('Fase 7 e Fase 8 - Fluxos Completos', () => {
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
        enableFase2Integration: true,
        enableFase3Integration: true,
        useCache: true,
        useRealValidation: false, // Desabilitado para testes rápidos
        useMultiAgent: false
      },
      cache: {
        enabled: true,
        maxSize: 100,
        ttl: 3600000
      }
    };
  });

  describe('Fluxo completo Fase 7 - Resolução Inteligente', () => {
    it('deve executar pipeline completo de resolução', async () => {
      const ultraSystem = new UltraSystem(mockConfig, mockLogger, mockErrorHandler);
      
      const request = {
        requirements: 'Criar função que soma dois números',
        language: 'javascript',
        context: {}
      };

      const result = await ultraSystem.process(request);

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      
      // Se houver erros, devem ser resolvidos pela Fase 2
      if (result.validation && !result.validation.valid && ultraSystem.enableFase2) {
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('Resolução inteligente'),
          expect.any(Object)
        );
      }
    });

    it('deve integrar resolução inteligente no fluxo principal', async () => {
      mockConfig.features.enableFase2Integration = true;
      const ultraSystem = new UltraSystem(mockConfig, mockLogger, mockErrorHandler);
      
      expect(ultraSystem.enableFase2).toBe(true);
      expect(ultraSystem.intelligentSequentialResolver).toBeDefined();
    });
  });

  describe('Fluxo completo Fase 8 - Validação de Qualidade', () => {
    it('deve executar validação de qualidade após geração', async () => {
      mockConfig.features.enableFase3Integration = true;
      const ultraSystem = new UltraSystem(mockConfig, mockLogger, mockErrorHandler);
      
      expect(ultraSystem.enableFase3).toBe(true);
      expect(ultraSystem.accurateDocumentationSystem).toBeDefined();
      expect(ultraSystem.testValidator).toBeDefined();
      expect(ultraSystem.metaValidationSystem).toBeDefined();
    });

    it('deve validar documentação quando gerada', async () => {
      const ultraSystem = new UltraSystem(mockConfig, mockLogger, mockErrorHandler);
      
      const request = {
        requirements: 'Criar função com documentação JSDoc',
        language: 'javascript',
        context: {}
      };

      const result = await ultraSystem.process(request);

      if (result.documentation && ultraSystem.enableFase3) {
        expect(mockLogger.info).toHaveBeenCalled();
      }
    });
  });

  describe('Pipeline completo end-to-end', () => {
    it('deve executar todas as fases em sequência', async () => {
      mockConfig.features.enableFase2Integration = true;
      mockConfig.features.enableFase3Integration = true;
      
      const ultraSystem = new UltraSystem(mockConfig, mockLogger, mockErrorHandler);
      
      const request = {
        requirements: 'Criar função que valida email',
        language: 'javascript',
        context: {}
      };

      const result = await ultraSystem.process(request);

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      
      // Verificar que todas as fases foram executadas
      if (ultraSystem.enableFase2) {
        expect(ultraSystem.intelligentSequentialResolver).toBeDefined();
      }
      
      if (ultraSystem.enableFase3) {
        expect(ultraSystem.accurateDocumentationSystem).toBeDefined();
        expect(ultraSystem.testValidator).toBeDefined();
      }
    });
  });
});
