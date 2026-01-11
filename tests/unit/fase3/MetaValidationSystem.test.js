/**
 * Testes unitários para MetaValidationSystem
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import MetaValidationSystem, { createMetaValidationSystem } from '../../../src/systems/fase3/MetaValidationSystem.js';

describe('MetaValidationSystem', () => {
  let system;
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

    system = createMetaValidationSystem(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await system.initialize();
      expect(system.validations).toBeDefined();
      expect(system.checklistCache).toBeDefined();
    });
  });

  describe('validateCompleteness', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve validar completude completa', async () => {
      const audit = {
        checkpoints: [
          { id: 'cp1', executed: true },
          { id: 'cp2', executed: true }
        ],
        checks: [
          { id: 'check1', applicable: true, executed: true, status: 'OK' },
          { id: 'check2', applicable: true, executed: true, status: 'OK' }
        ]
      };

      const result = await system.validateCompleteness(audit);

      expect(result.passed).toBe(true);
    });

    it('deve detectar checkpoints não executados', async () => {
      const audit = {
        checkpoints: [
          { id: 'cp1', executed: true },
          { id: 'cp2', executed: false }
        ]
      };

      const result = await system.validateCompleteness(audit);

      expect(result.passed).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('validateNA', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve validar N/A com justificativa e evidência', async () => {
      const audit = {
        checks: [
          {
            id: 'check1',
            status: 'N/A',
            justification: 'Justificativa válida',
            evidence: 'Evidência válida'
          }
        ]
      };

      const result = await system.validateNA(audit);

      expect(result.passed).toBe(true);
    });

    it('deve detectar N/A sem justificativa', async () => {
      const audit = {
        checks: [
          {
            id: 'check1',
            status: 'N/A',
            evidence: 'Evidência'
          }
        ]
      };

      const result = await system.validateNA(audit);

      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.type === 'missing_justification')).toBe(true);
    });
  });

  describe('validateCoverage', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve validar cobertura adequada', async () => {
      const audit = {
        coverage: {
          total: { percentage: 95 },
          targets: [
            { target: 'target1', percentage: 90 }
          ]
        }
      };

      const result = await system.validateCoverage(audit);

      expect(result.passed).toBe(true);
    });

    it('deve detectar cobertura abaixo do mínimo', async () => {
      const audit = {
        coverage: {
          total: { percentage: 80 }
        }
      };

      const result = await system.validateCoverage(audit);

      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.type === 'coverage_below_minimum')).toBe(true);
    });
  });

  describe('validateAudit', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve validar auditoria completa', async () => {
      const audit = {
        id: 'audit-1',
        checkpoints: [
          { id: 'cp1', executed: true }
        ],
        checks: [
          { id: 'check1', applicable: true, executed: true, status: 'OK' }
        ],
        coverage: {
          total: { percentage: 95 }
        }
      };

      const result = await system.validateAudit(audit);

      expect(result).toBeDefined();
      expect(result.checklist).toBeDefined();
      expect(result.auditOfAudit).toBeDefined();
      expect(result.score).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await system.initialize();
    });

    it('deve executar meta-validação', async () => {
      const audit = {
        checkpoints: [{ id: 'cp1', executed: true }],
        checks: [{ id: 'check1', applicable: true, executed: true, status: 'OK' }]
      };

      const result = await system.execute({ audit });

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
      expect(result.checklist).toBeDefined();
    });

    it('deve lançar erro se audit não fornecido', async () => {
      await expect(
        system.execute({})
      ).rejects.toThrow('audit é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = system.onValidate({
        audit: {}
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(system.onValidate(null).valid).toBe(false);
      expect(system.onValidate({}).valid).toBe(false);
    });
  });
});
