/**
 * Testes unitários para DecisionClassifier
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import DecisionClassifier, { createDecisionClassifier } from '../../../src/systems/fase1/DecisionClassifier.js';

describe('DecisionClassifier', () => {
  let classifier;
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

    classifier = createDecisionClassifier(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await classifier.initialize();
      expect(classifier.classifications).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('classify', () => {
    beforeEach(async () => {
      await classifier.initialize();
    });

    it('deve classificar decisão Nível 3 - muitos arquivos afetados', async () => {
      const decision = {
        id: 'dec-1',
        filesAffected: 10,
        description: 'Refatoração completa'
      };

      const result = await classifier.execute({ decision });

      expect(result.level).toBe(3);
      expect(result.action).toBe('Parar e aguardar aprovação');
      expect(result.requiresApproval).toBe(true);
      expect(result.canProceed).toBe(false);
    });

    it('deve classificar decisão Nível 3 - muda comportamento', async () => {
      const decision = {
        id: 'dec-2',
        filesAffected: 1,
        changesBehavior: true,
        description: 'Alterar comportamento da função'
      };

      const result = await classifier.execute({ decision });

      expect(result.level).toBe(3);
      expect(result.requiresApproval).toBe(true);
    });

    it('deve classificar decisão Nível 3 - afeta segurança', async () => {
      const decision = {
        id: 'dec-3',
        filesAffected: 1,
        affectsSecurity: true,
        description: 'Modificar autenticação'
      };

      const result = await classifier.execute({ decision });

      expect(result.level).toBe(3);
    });

    it('deve classificar decisão Nível 3 - afeta dados', async () => {
      const decision = {
        id: 'dec-4',
        filesAffected: 1,
        affectsData: true,
        description: 'Modificar schema do banco'
      };

      const result = await classifier.execute({ decision });

      expect(result.level).toBe(3);
    });

    it('deve classificar decisão Nível 2 - 2-5 arquivos', async () => {
      const decision = {
        id: 'dec-5',
        filesAffected: 3,
        description: 'Atualizar múltiplos componentes'
      };

      const result = await classifier.execute({ decision });

      expect(result.level).toBe(2);
      expect(result.action).toBe('Informar e prosseguir');
      expect(result.requiresApproval).toBe(false);
      expect(result.canProceed).toBe(true);
      expect(result.shouldNotify).toBe(true);
    });

    it('deve classificar decisão Nível 2 - alternativas equivalentes', async () => {
      const decision = {
        id: 'dec-6',
        filesAffected: 1,
        alternativesEquivalent: true,
        description: 'Escolher entre duas bibliotecas equivalentes'
      };

      const result = await classifier.execute({ decision });

      expect(result.level).toBe(2);
    });

    it('deve classificar decisão Nível 1 - arquivo único', async () => {
      const decision = {
        id: 'dec-7',
        filesAffected: 1,
        description: 'Corrigir bug simples'
      };

      const result = await classifier.execute({ decision });

      expect(result.level).toBe(1);
      expect(result.action).toBe('Executar e documentar');
      expect(result.requiresApproval).toBe(false);
      expect(result.canProceed).toBe(true);
      expect(result.shouldDocument).toBe(true);
    });

    it('deve detectar mudança de comportamento na descrição', async () => {
      const decision = {
        id: 'dec-8',
        filesAffected: 1,
        description: 'Vou mudar o comportamento da função para retornar erro'
      };

      const result = await classifier.execute({ decision });

      expect(result.level).toBe(3);
      expect(result.impact.changesBehavior).toBe(true);
    });

    it('deve detectar impacto em segurança na descrição', async () => {
      const decision = {
        id: 'dec-9',
        filesAffected: 1,
        description: 'Modificar sistema de autenticação e tokens'
      };

      const result = await classifier.execute({ decision });

      expect(result.level).toBe(3);
      expect(result.impact.affectsSecurity).toBe(true);
    });

    it('deve detectar impacto em dados na descrição', async () => {
      const decision = {
        id: 'dec-10',
        filesAffected: 1,
        description: 'Alterar persistência de dados no banco'
      };

      const result = await classifier.execute({ decision });

      expect(result.level).toBe(3);
      expect(result.impact.affectsData).toBe(true);
    });
  });

  describe('canExecute', () => {
    beforeEach(async () => {
      await classifier.initialize();
    });

    it('deve permitir execução de decisão Nível 1', async () => {
      const decision = {
        id: 'dec-1',
        filesAffected: 1
      };

      await classifier.execute({ decision });
      const result = classifier.canExecute('dec-1');

      expect(result.canExecute).toBe(true);
      expect(result.level).toBe(1);
    });

    it('deve permitir execução de decisão Nível 2', async () => {
      const decision = {
        id: 'dec-2',
        filesAffected: 3
      };

      await classifier.execute({ decision });
      const result = classifier.canExecute('dec-2');

      expect(result.canExecute).toBe(true);
      expect(result.level).toBe(2);
    });

    it('não deve permitir execução de decisão Nível 3 sem aprovação', async () => {
      const decision = {
        id: 'dec-3',
        filesAffected: 10
      };

      await classifier.execute({ decision });
      const result = classifier.canExecute('dec-3', false);

      expect(result.canExecute).toBe(false);
      expect(result.requiresApproval).toBe(true);
    });

    it('deve permitir execução de decisão Nível 3 com aprovação', async () => {
      const decision = {
        id: 'dec-4',
        filesAffected: 10
      };

      await classifier.execute({ decision });
      const result = classifier.canExecute('dec-4', true);

      expect(result.canExecute).toBe(true);
      expect(result.level).toBe(3);
    });

    it('deve retornar erro se decisão não classificada', () => {
      const result = classifier.canExecute('missing');

      expect(result.canExecute).toBe(false);
      expect(result.reason).toContain('não classificada');
    });
  });

  describe('getClassification e listClassifications', () => {
    beforeEach(async () => {
      await classifier.initialize();
    });

    it('deve retornar null se classificação não existe', () => {
      expect(classifier.getClassification('missing')).toBeNull();
    });

    it('deve retornar classificação armazenada', async () => {
      const decision = {
        id: 'dec-1',
        filesAffected: 1
      };

      await classifier.execute({ decision });
      const classification = classifier.getClassification('dec-1');

      expect(classification).toBeDefined();
      expect(classification.level).toBe(1);
    });

    it('deve listar todas as classificações', async () => {
      await classifier.execute({ decision: { id: 'dec-1', filesAffected: 1 } });
      await classifier.execute({ decision: { id: 'dec-2', filesAffected: 3 } });
      await classifier.execute({ decision: { id: 'dec-3', filesAffected: 10 } });

      const list = classifier.listClassifications();

      expect(list.length).toBe(3);
      expect(list.map(c => c.level)).toContain(1);
      expect(list.map(c => c.level)).toContain(2);
      expect(list.map(c => c.level)).toContain(3);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await classifier.initialize();
    });

    it('deve retornar estatísticas corretas', async () => {
      await classifier.execute({ decision: { id: 'dec-1', filesAffected: 1 } });
      await classifier.execute({ decision: { id: 'dec-2', filesAffected: 3 } });
      await classifier.execute({ decision: { id: 'dec-3', filesAffected: 10 } });

      const stats = classifier.getStats();

      expect(stats.total).toBe(3);
      expect(stats.byLevel[1]).toBe(1);
      expect(stats.byLevel[2]).toBe(1);
      expect(stats.byLevel[3]).toBe(1);
      expect(stats.requiresApproval).toBe(1);
      expect(stats.canProceed).toBe(2);
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = classifier.validate({
        decision: {
          id: 'test',
          filesAffected: 1
        }
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(classifier.validate(null).valid).toBe(false);
      expect(classifier.validate({}).valid).toBe(false);
      expect(classifier.validate({ decision: 'not-object' }).valid).toBe(false);
    });
  });
});
