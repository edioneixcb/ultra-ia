/**
 * Testes unitários para EvidenceChainManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import EvidenceChainManager, { createEvidenceChainManager } from '../../../src/systems/fase1/EvidenceChainManager.js';

describe('EvidenceChainManager', () => {
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

    manager = createEvidenceChainManager(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await manager.initialize();
      expect(manager.chains).toBeDefined();
    });
  });

  describe('createChain', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve criar cadeia de evidência', async () => {
      const observation = {
        description: 'Test observation',
        target: 'test-target'
      };

      const chain = await manager.execute({
        observation,
        action: 'create'
      });

      expect(chain.id).toBeDefined();
      expect(chain.observation).toBe(observation);
      expect(chain.metadata.agent).toBe('AGENTE-AUDITOR');
    });

    it('deve usar chainId fornecido', async () => {
      const observation = { description: 'Test' };
      const chain = await manager.execute({
        observation,
        action: 'create',
        chainId: 'custom-id'
      });

      expect(chain.id).toBe('custom-id');
    });
  });

  describe('addRawEvidence', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.execute({
        observation: { description: 'Test' },
        action: 'create',
        chainId: 'chain-1'
      });
    });

    it('deve adicionar evidência bruta', async () => {
      const rawEvidence = { output: 'test output', exitCode: 0 };

      const chain = await manager.execute({
        chainId: 'chain-1',
        rawEvidence,
        action: 'addRawEvidence'
      });

      expect(chain.rawEvidence).toBeDefined();
      expect(chain.rawEvidence.data).toBe(rawEvidence);
      expect(chain.rawEvidence.source).toBe('execution');
    });

    it('deve lançar erro se cadeia não existe', async () => {
      await expect(
        manager.execute({
          chainId: 'missing',
          rawEvidence: {},
          action: 'addRawEvidence'
        })
      ).rejects.toThrow('não encontrada');
    });
  });

  describe('normalizeEvidence', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.execute({
        observation: { description: 'Test' },
        action: 'create',
        chainId: 'chain-1'
      });
      await manager.execute({
        chainId: 'chain-1',
        rawEvidence: { output: '  test  ', data: { key: 'value' } },
        action: 'addRawEvidence'
      });
    });

    it('deve normalizar evidência', async () => {
      const chain = await manager.execute({
        chainId: 'chain-1',
        action: 'normalize'
      });

      expect(chain.normalizedEvidence).toBeDefined();
      expect(chain.normalizedEvidence.format).toBe('standardized');
    });

    it('deve lançar erro se evidência bruta não existe', async () => {
      await manager.execute({
        observation: { description: 'Test' },
        action: 'create',
        chainId: 'chain-2'
      });

      await expect(
        manager.execute({
          chainId: 'chain-2',
          action: 'normalize'
        })
      ).rejects.toThrow('Evidência bruta não encontrada');
    });
  });

  describe('validateChain', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve validar cadeia completa', async () => {
      await manager.execute({
        observation: { description: 'Test' },
        action: 'create',
        chainId: 'chain-1'
      });
      await manager.execute({
        chainId: 'chain-1',
        rawEvidence: { output: 'test' },
        action: 'addRawEvidence'
      });
      await manager.execute({
        chainId: 'chain-1',
        action: 'normalize'
      });

      // Adicionar classificação e documentação manualmente
      const chain = manager.getChain('chain-1');
      chain.classification = { level: 'Completa' };
      chain.documentation = { report: 'test report' };
      manager.chains.set('chain-1', chain);

      const result = await manager.execute({
        chainId: 'chain-1',
        action: 'validate'
      });

      expect(result.valid).toBe(true);
    });

    it('deve lançar erro se cadeia incompleta', async () => {
      await manager.execute({
        observation: { description: 'Test' },
        action: 'create',
        chainId: 'chain-1'
      });

      await expect(
        manager.execute({
          chainId: 'chain-1',
          action: 'validate'
        })
      ).rejects.toThrow('incompleta');
    });
  });

  describe('getChain e listChains', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve retornar null se cadeia não existe', () => {
      expect(manager.getChain('missing')).toBeNull();
    });

    it('deve retornar cadeia existente', async () => {
      await manager.execute({
        observation: { description: 'Test' },
        action: 'create',
        chainId: 'chain-1'
      });

      const chain = manager.getChain('chain-1');
      expect(chain).toBeDefined();
      expect(chain.id).toBe('chain-1');
    });

    it('deve listar todas as cadeias', async () => {
      await manager.execute({
        observation: { description: 'Test 1' },
        action: 'create',
        chainId: 'chain-1'
      });
      await manager.execute({
        observation: { description: 'Test 2' },
        action: 'create',
        chainId: 'chain-2'
      });

      const list = manager.listChains();
      expect(list.length).toBe(2);
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = manager.onValidate({
        action: 'create',
        observation: {}
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(manager.onValidate(null).valid).toBe(false);
      expect(manager.onValidate({}).valid).toBe(false);
    });
  });
});
