/**
 * Testes unitários para ChainOfThoughtValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ChainOfThoughtValidator, { createChainOfThoughtValidator } from '../../../src/systems/fase1/ChainOfThoughtValidator.js';

describe('ChainOfThoughtValidator', () => {
  let validator;
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

    validator = createChainOfThoughtValidator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validatedThoughts).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar thought com todos os componentes', async () => {
      const thought = {
        observacao: 'O sistema está apresentando erro',
        analise: 'O erro ocorre porque a função não trata null',
        decisao: 'Vou adicionar validação de null',
        acao: 'Implementar check de null antes de usar a variável'
      };

      const result = await validator.execute({ thought });

      expect(result.valid).toBe(true);
      expect(result.components.observacao).toBeDefined();
      expect(result.components.analise).toBeDefined();
      expect(result.components.decisao).toBeDefined();
      expect(result.components.acao).toBeDefined();
    });

    it('deve lançar erro se OBSERVAÇÃO faltar', async () => {
      const thought = {
        analise: 'Análise',
        decisao: 'Decisão',
        acao: 'Ação'
      };

      await expect(
        validator.execute({ thought })
      ).rejects.toThrow('OBSERVAÇÃO');
    });

    it('deve lançar erro se ANÁLISE faltar', async () => {
      const thought = {
        observacao: 'Observação',
        decisao: 'Decisão',
        acao: 'Ação'
      };

      await expect(
        validator.execute({ thought })
      ).rejects.toThrow('ANÁLISE');
    });

    it('deve lançar erro se DECISÃO faltar', async () => {
      const thought = {
        observacao: 'Observação',
        analise: 'Análise',
        acao: 'Ação'
      };

      await expect(
        validator.execute({ thought })
      ).rejects.toThrow('DECISÃO');
    });

    it('deve lançar erro se AÇÃO faltar', async () => {
      const thought = {
        observacao: 'Observação',
        analise: 'Análise',
        decisao: 'Decisão'
      };

      await expect(
        validator.execute({ thought })
      ).rejects.toThrow('AÇÃO');
    });

    it('deve lançar erro se múltiplos componentes faltarem', async () => {
      const thought = {
        observacao: 'Observação'
      };

      await expect(
        validator.execute({ thought })
      ).rejects.toThrow();
    });

    it('deve rejeitar strings vazias', async () => {
      const thought = {
        observacao: '   ',
        analise: 'Análise',
        decisao: 'Decisão',
        acao: 'Ação'
      };

      await expect(
        validator.execute({ thought })
      ).rejects.toThrow('OBSERVAÇÃO');
    });
  });

  describe('enforceFormat', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve converter formato em inglês para português', () => {
      const reasoning = {
        observation: 'Observation',
        analysis: 'Analysis',
        decision: 'Decision',
        action: 'Action'
      };

      const formatted = validator.enforceFormat(reasoning);

      expect(formatted.observacao).toBe('Observation');
      expect(formatted.analise).toBe('Analysis');
      expect(formatted.decisao).toBe('Decision');
      expect(formatted.acao).toBe('Action');
    });

    it('deve converter formato what/why/how/nextStep', () => {
      const reasoning = {
        what: 'What',
        why: 'Why',
        how: 'How',
        nextStep: 'Next'
      };

      const formatted = validator.enforceFormat(reasoning);

      expect(formatted.observacao).toBe('What');
      expect(formatted.analise).toBe('Why');
      expect(formatted.decisao).toBe('How');
      expect(formatted.acao).toBe('Next');
    });

    it('deve manter formato português se já estiver correto', () => {
      const reasoning = {
        observacao: 'Observação',
        analise: 'Análise',
        decisao: 'Decisão',
        acao: 'Ação'
      };

      const formatted = validator.enforceFormat(reasoning);

      expect(formatted.observacao).toBe('Observação');
      expect(formatted.analise).toBe('Análise');
      expect(formatted.decisao).toBe('Decisão');
      expect(formatted.acao).toBe('Ação');
    });

    it('deve usar string vazia se campo não existe', () => {
      const reasoning = {
        observacao: 'Observação'
      };

      const formatted = validator.enforceFormat(reasoning);

      expect(formatted.observacao).toBe('Observação');
      expect(formatted.analise).toBe('');
      expect(formatted.decisao).toBe('');
      expect(formatted.acao).toBe('');
    });
  });

  describe('hasAllComponents', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve retornar true se tem todos os componentes', () => {
      const thought = {
        observacao: 'Observação',
        analise: 'Análise',
        decisao: 'Decisão',
        acao: 'Ação'
      };

      expect(validator.hasAllComponents(thought)).toBe(true);
    });

    it('deve retornar false se falta algum componente', () => {
      const thought = {
        observacao: 'Observação',
        analise: 'Análise'
      };

      expect(validator.hasAllComponents(thought)).toBe(false);
    });

    it('deve retornar false se componente está vazio', () => {
      const thought = {
        observacao: 'Observação',
        analise: 'Análise',
        decisao: '   ',
        acao: 'Ação'
      };

      expect(validator.hasAllComponents(thought)).toBe(false);
    });

    it('deve funcionar com formato alternativo', () => {
      const thought = {
        observation: 'Observation',
        analysis: 'Analysis',
        decision: 'Decision',
        action: 'Action'
      };

      expect(validator.hasAllComponents(thought)).toBe(true);
    });
  });

  describe('getValidatedThought e listValidatedThoughts', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve retornar null se thought não existe', () => {
      expect(validator.getValidatedThought('missing')).toBeNull();
    });

    it('deve retornar thought validado', async () => {
      const thought = {
        observacao: 'Observação',
        analise: 'Análise',
        decisao: 'Decisão',
        acao: 'Ação'
      };

      await validator.execute({ thought, thoughtId: 'thought-1' });
      const validated = validator.getValidatedThought('thought-1');

      expect(validated).toBeDefined();
      expect(validated.valid).toBe(true);
    });

    it('deve listar todos os thoughts validados', async () => {
      await validator.execute({
        thought: {
          observacao: 'Obs 1',
          analise: 'Análise 1',
          decisao: 'Decisão 1',
          acao: 'Ação 1'
        },
        thoughtId: 'thought-1'
      });

      await validator.execute({
        thought: {
          observacao: 'Obs 2',
          analise: 'Análise 2',
          decisao: 'Decisão 2',
          acao: 'Ação 2'
        },
        thoughtId: 'thought-2'
      });

      const list = validator.listValidatedThoughts();
      expect(list.length).toBe(2);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve retornar estatísticas corretas', async () => {
      await validator.execute({
        thought: {
          observacao: 'Obs 1',
          analise: 'Análise 1',
          decisao: 'Decisão 1',
          acao: 'Ação 1'
        },
        thoughtId: 'thought-1'
      });

      await validator.execute({
        thought: {
          observacao: 'Obs 2',
          analise: 'Análise 2',
          decisao: 'Decisão 2',
          acao: 'Ação 2'
        },
        thoughtId: 'thought-2'
      });

      const stats = validator.getStats();

      expect(stats.total).toBe(2);
      expect(stats.valid).toBe(2);
      expect(stats.invalid).toBe(0);
    });
  });

  describe('validate (context validation)', () => {
    it('deve validar contexto válido', () => {
      const result = validator.onValidate({
        thought: {
          observacao: 'Obs',
          analise: 'Análise',
          decisao: 'Decisão',
          acao: 'Ação'
        }
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(validator.onValidate(null).valid).toBe(false);
      expect(validator.onValidate({}).valid).toBe(false);
      expect(validator.onValidate({ thought: 'not-object' }).valid).toBe(false);
    });
  });

  describe('execute com thoughtId', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve usar thoughtId fornecido no contexto', async () => {
      const thought = {
        observacao: 'Obs',
        analise: 'Análise',
        decisao: 'Decisão',
        acao: 'Ação'
      };

      const result = await validator.execute({
        thought,
        thoughtId: 'custom-id'
      });

      expect(result.thoughtId).toBe('custom-id');
      expect(validator.getValidatedThought('custom-id')).toBeDefined();
    });

    it('deve usar thought.id se thoughtId não fornecido', async () => {
      const thought = {
        id: 'thought-from-id',
        observacao: 'Obs',
        analise: 'Análise',
        decisao: 'Decisão',
        acao: 'Ação'
      };

      const result = await validator.execute({ thought });

      expect(result.thoughtId).toBe('thought-from-id');
    });

    it('deve gerar ID automático se nenhum fornecido', async () => {
      const thought = {
        observacao: 'Obs',
        analise: 'Análise',
        decisao: 'Decisão',
        acao: 'Ação'
      };

      const result = await validator.execute({ thought });

      expect(result.thoughtId).toMatch(/^thought-\d+$/);
    });
  });
});
