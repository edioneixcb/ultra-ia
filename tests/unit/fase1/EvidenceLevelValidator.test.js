/**
 * Testes unitários para EvidenceLevelValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import EvidenceLevelValidator, { createEvidenceLevelValidator } from '../../../src/systems/fase1/EvidenceLevelValidator.js';

describe('EvidenceLevelValidator', () => {
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

    validator = createEvidenceLevelValidator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validations).toBeDefined();
      expect(validator.levelHierarchy).toEqual(['Mínima', 'Resumida', 'Padrão', 'Completa']);
    });
  });

  describe('getRequiredLevel', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve retornar Completa para BLOQUEADOR', () => {
      expect(validator.getRequiredLevel('BLOQUEADOR')).toBe('Completa');
    });

    it('deve retornar Completa para CRÍTICO', () => {
      expect(validator.getRequiredLevel('CRÍTICO')).toBe('Completa');
    });

    it('deve retornar Padrão para ALTO', () => {
      expect(validator.getRequiredLevel('ALTO')).toBe('Padrão');
    });

    it('deve retornar Resumida para MÉDIO', () => {
      expect(validator.getRequiredLevel('MÉDIO')).toBe('Resumida');
    });

    it('deve retornar Mínima para BAIXO', () => {
      expect(validator.getRequiredLevel('BAIXO')).toBe('Mínima');
    });

    it('deve retornar Mínima para severidade desconhecida', () => {
      expect(validator.getRequiredLevel('DESCONHECIDA')).toBe('Mínima');
    });
  });

  describe('classifyEvidence', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve classificar como Completa quando tem todos os componentes', () => {
      const evidence = {
        commandOutput: 'output',
        screenshot: 'screenshot.png',
        log: 'log.txt',
        verification: true,
        sources: ['source1', 'source2'],
        rawData: { data: 'raw' },
        metadata: { key: 'value' }
      };

      expect(validator.classifyEvidence(evidence)).toBe('Completa');
    });

    it('deve classificar como Padrão quando tem output + verificação + log', () => {
      const evidence = {
        commandOutput: 'output',
        verification: true,
        log: 'log.txt'
      };

      expect(validator.classifyEvidence(evidence)).toBe('Padrão');
    });

    it('deve classificar como Padrão quando tem output + verificação + screenshot', () => {
      const evidence = {
        commandOutput: 'output',
        verification: true,
        screenshot: 'screenshot.png'
      };

      expect(validator.classifyEvidence(evidence)).toBe('Padrão');
    });

    it('deve classificar como Resumida quando tem output + log', () => {
      const evidence = {
        commandOutput: 'output',
        log: 'log.txt'
      };

      expect(validator.classifyEvidence(evidence)).toBe('Resumida');
    });

    it('deve classificar como Resumida quando tem output + metadata', () => {
      const evidence = {
        commandOutput: 'output',
        metadata: { key: 'value' }
      };

      expect(validator.classifyEvidence(evidence)).toBe('Resumida');
    });

    it('deve classificar como Mínima quando tem apenas output', () => {
      const evidence = {
        commandOutput: 'output'
      };

      expect(validator.classifyEvidence(evidence)).toBe('Mínima');
    });

    it('deve classificar como Mínima quando tem apenas description', () => {
      const evidence = {
        description: 'Descrição da evidência'
      };

      expect(validator.classifyEvidence(evidence)).toBe('Mínima');
    });

    it('deve classificar como Mínima quando evidência é null ou inválida', () => {
      expect(validator.classifyEvidence(null)).toBe('Mínima');
      expect(validator.classifyEvidence('not-object')).toBe('Mínima');
    });

    it('deve suportar formatos alternativos de nomenclatura', () => {
      const evidence = {
        output: 'output',
        image: 'image.png',
        logs: 'logs.txt',
        verified: true
      };

      expect(validator.classifyEvidence(evidence)).toBe('Padrão');
    });
  });

  describe('compareLevels', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve retornar 0 quando níveis são iguais', () => {
      expect(validator.compareLevels('Completa', 'Completa')).toBe(0);
      expect(validator.compareLevels('Padrão', 'Padrão')).toBe(0);
    });

    it('deve retornar positivo quando atual > requerido', () => {
      expect(validator.compareLevels('Completa', 'Padrão')).toBeGreaterThan(0);
      expect(validator.compareLevels('Padrão', 'Resumida')).toBeGreaterThan(0);
      expect(validator.compareLevels('Resumida', 'Mínima')).toBeGreaterThan(0);
    });

    it('deve retornar negativo quando atual < requerido', () => {
      expect(validator.compareLevels('Mínima', 'Resumida')).toBeLessThan(0);
      expect(validator.compareLevels('Resumida', 'Padrão')).toBeLessThan(0);
      expect(validator.compareLevels('Padrão', 'Completa')).toBeLessThan(0);
    });

    it('deve retornar -1 para níveis desconhecidos', () => {
      expect(validator.compareLevels('Desconhecido', 'Completa')).toBe(-1);
      expect(validator.compareLevels('Completa', 'Desconhecido')).toBe(-1);
    });
  });

  describe('validate', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar evidência Completa para severidade BLOQUEADOR', async () => {
      const evidence = {
        commandOutput: 'output',
        screenshot: 'screenshot.png',
        log: 'log.txt',
        verification: true,
        sources: ['source1', 'source2'],
        rawData: { data: 'raw' },
        metadata: { key: 'value' }
      };

      const result = await validator.execute({
        evidence,
        severity: 'BLOQUEADOR',
        checkId: 'check-1'
      });

      expect(result.valid).toBe(true);
      expect(result.level).toBe('Completa');
      expect(result.meetsRequirement).toBe(true);
    });

    it('deve validar evidência Padrão para severidade ALTO', async () => {
      const evidence = {
        commandOutput: 'output',
        verification: true,
        log: 'log.txt'
      };

      const result = await validator.execute({
        evidence,
        severity: 'ALTO',
        checkId: 'check-2'
      });

      expect(result.valid).toBe(true);
      expect(result.level).toBe('Padrão');
    });

    it('deve validar evidência Resumida para severidade MÉDIO', async () => {
      const evidence = {
        commandOutput: 'output',
        log: 'log.txt'
      };

      const result = await validator.execute({
        evidence,
        severity: 'MÉDIO',
        checkId: 'check-3'
      });

      expect(result.valid).toBe(true);
      expect(result.level).toBe('Resumida');
    });

    it('deve validar evidência Mínima para severidade BAIXO', async () => {
      const evidence = {
        commandOutput: 'output'
      };

      const result = await validator.execute({
        evidence,
        severity: 'BAIXO',
        checkId: 'check-4'
      });

      expect(result.valid).toBe(true);
      expect(result.level).toBe('Mínima');
    });

    it('deve aceitar evidência de nível superior ao requerido', async () => {
      const evidence = {
        commandOutput: 'output',
        screenshot: 'screenshot.png',
        log: 'log.txt',
        verification: true
      };

      const result = await validator.execute({
        evidence,
        severity: 'MÉDIO', // Requer Resumida
        checkId: 'check-5'
      });

      expect(result.valid).toBe(true);
      expect(result.level).toBe('Padrão'); // Superior ao requerido
      expect(result.meetsRequirement).toBe(true);
    });

    it('deve lançar erro se evidência insuficiente', async () => {
      const evidence = {
        commandOutput: 'output' // Mínima
      };

      await expect(
        validator.execute({
          evidence,
          severity: 'CRÍTICO', // Requer Completa
          checkId: 'check-6'
        })
      ).rejects.toThrow('Evidência insuficiente');
    });

    it('deve lançar erro se evidence não fornecido', async () => {
      await expect(
        validator.execute({
          severity: 'BAIXO'
        })
      ).rejects.toThrow('evidence é obrigatório');
    });

    it('deve lançar erro se severity não fornecido', async () => {
      await expect(
        validator.execute({
          evidence: {}
        })
      ).rejects.toThrow('severity é obrigatório');
    });
  });

  describe('getValidation e listValidations', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve retornar null se validação não existe', () => {
      expect(validator.getValidation('missing')).toBeNull();
    });

    it('deve retornar validação armazenada', async () => {
      const evidence = {
        commandOutput: 'output'
      };

      await validator.execute({
        evidence,
        severity: 'BAIXO',
        checkId: 'check-1'
      });

      const validation = validator.getValidation('check-1');
      expect(validation).toBeDefined();
      expect(validation.valid).toBe(true);
    });

    it('deve listar todas as validações', async () => {
      await validator.execute({
        evidence: { commandOutput: 'output' },
        severity: 'BAIXO',
        checkId: 'check-1'
      });

      await validator.execute({
        evidence: { commandOutput: 'output', log: 'log.txt' },
        severity: 'MÉDIO',
        checkId: 'check-2'
      });

      const list = validator.listValidations();
      expect(list.length).toBe(2);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve retornar estatísticas corretas', async () => {
      await validator.execute({
        evidence: { commandOutput: 'output' },
        severity: 'BAIXO',
        checkId: 'check-1'
      });

      await validator.execute({
        evidence: { commandOutput: 'output', log: 'log.txt' },
        severity: 'MÉDIO',
        checkId: 'check-2'
      });

      await validator.execute({
        evidence: {
          commandOutput: 'output',
          verification: true,
          log: 'log.txt'
        },
        severity: 'ALTO',
        checkId: 'check-3'
      });

      const stats = validator.getStats();

      expect(stats.total).toBe(3);
      expect(stats.byLevel['Mínima']).toBe(1);
      expect(stats.byLevel['Resumida']).toBe(1);
      expect(stats.byLevel['Padrão']).toBe(1);
      expect(stats.valid).toBe(3);
      expect(stats.invalid).toBe(0);
    });
  });

  describe('validate (context validation)', () => {
    it('deve validar contexto válido', () => {
      const result = validator.onValidate({
        evidence: {},
        severity: 'BAIXO'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(validator.onValidate(null).valid).toBe(false);
      expect(validator.onValidate({}).valid).toBe(false);
      expect(validator.onValidate({ evidence: 'not-object' }).valid).toBe(false);
      expect(validator.onValidate({ evidence: {}, severity: 123 }).valid).toBe(false);
    });
  });
});
