/**
 * Testes unitários para ThreeERuleValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ThreeERuleValidator, { createThreeERuleValidator } from '../../../src/systems/fase0/ThreeERuleValidator.js';

describe('ThreeERuleValidator', () => {
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

    validator = createThreeERuleValidator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validatedChecks).toBeDefined();
    });
  });

  describe('validate', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar check com todos os 3E', async () => {
      const check = {
        id: 'check-1',
        especificacao: 'Verificar se função existe',
        execucao: 'grep -r "function" src/',
        evidencia: 'output.txt'
      };

      const result = await validator.execute({ check });

      expect(result.valid).toBe(true);
      expect(result.components.especificacao).toBeDefined();
      expect(result.components.execucao).toBeDefined();
      expect(result.components.evidencia).toBeDefined();
    });

    it('deve aceitar diferentes formatos de nomenclatura', async () => {
      const check = {
        id: 'check-2',
        specification: 'Check specification',
        execution: 'npm test',
        evidence: 'test-results.json'
      };

      const result = await validator.execute({ check });

      expect(result.valid).toBe(true);
    });

    it('deve lançar erro se ESPECIFICAÇÃO faltar', async () => {
      const check = {
        id: 'check-3',
        execucao: 'npm test',
        evidencia: 'results.json'
      };

      await expect(
        validator.execute({ check })
      ).rejects.toThrow('ESPECIFICAÇÃO');
    });

    it('deve lançar erro se EXECUÇÃO faltar', async () => {
      const check = {
        id: 'check-4',
        especificacao: 'Check spec',
        evidencia: 'results.json'
      };

      await expect(
        validator.execute({ check })
      ).rejects.toThrow('EXECUÇÃO');
    });

    it('deve lançar erro se EVIDÊNCIA faltar', async () => {
      const check = {
        id: 'check-5',
        especificacao: 'Check spec',
        execucao: 'npm test'
      };

      await expect(
        validator.execute({ check })
      ).rejects.toThrow('EVIDÊNCIA');
    });

    it('deve lançar erro se múltiplos componentes faltarem', async () => {
      const check = {
        id: 'check-6',
        especificacao: 'Check spec'
      };

      await expect(
        validator.execute({ check })
      ).rejects.toThrow();
    });

    it('deve rejeitar strings vazias após trim', async () => {
      const check = {
        id: 'check-7',
        especificacao: '   ',
        execucao: 'npm test',
        evidencia: 'results.json'
      };

      // Strings vazias (apenas espaços) devem ser rejeitadas
      await expect(
        validator.execute({ check })
      ).rejects.toThrow('ESPECIFICAÇÃO');
    });
  });

  describe('extractComponents', () => {
    it('deve extrair componentes corretamente', () => {
      const check = {
        especificacao: 'spec',
        execucao: 'exec',
        evidencia: 'evid'
      };

      const components = validator.extractComponents(check);

      expect(components.especificacao).toBe('spec');
      expect(components.execucao).toBe('exec');
      expect(components.evidencia).toBe('evid');
    });

    it('deve suportar diferentes formatos', () => {
      const check = {
        specification: 'spec',
        execution: 'exec',
        evidence: 'evid'
      };

      const components = validator.extractComponents(check);

      expect(components.especificacao).toBe('spec');
      expect(components.execucao).toBe('exec');
      expect(components.evidencia).toBe('evid');
    });
  });

  describe('hasAllThreeE', () => {
    it('deve retornar true se tem todos os 3E', () => {
      const check = {
        especificacao: 'spec',
        execucao: 'exec',
        evidencia: 'evid'
      };

      expect(validator.hasAllThreeE(check)).toBe(true);
    });

    it('deve retornar false se falta algum componente', () => {
      const check = {
        especificacao: 'spec',
        execucao: 'exec'
      };

      expect(validator.hasAllThreeE(check)).toBe(false);
    });
  });

  describe('validate (context validation)', () => {
    it('deve validar contexto válido', () => {
      const result = validator.onValidate({
        check: {
          especificacao: 'spec',
          execucao: 'exec',
          evidencia: 'evid'
        }
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(validator.onValidate(null).valid).toBe(false);
      expect(validator.onValidate({}).valid).toBe(false);
      expect(validator.onValidate({ check: 'not-object' }).valid).toBe(false);
    });
  });
});
