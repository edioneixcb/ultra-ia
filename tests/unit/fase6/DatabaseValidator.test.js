/**
 * Testes unitários para DatabaseValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import DatabaseValidator, { createDatabaseValidator } from '../../../src/systems/fase6/DatabaseValidator.js';

describe('DatabaseValidator', () => {
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

    validator = createDatabaseValidator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validations).toBeDefined();
    });
  });

  describe('validateMigration', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar migration correta', async () => {
      const code = `
        BEGIN;
        CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY);
        COMMIT;
      `;

      const result = await validator.validateMigration(code, {});

      expect(result).toBeDefined();
      expect(result.type).toBe('migration');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve executar validação de banco de dados', async () => {
      const result = await validator.execute({
        action: 'validate',
        code: 'BEGIN; COMMIT;',
        type: 'migration'
      });

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
    });
  });
});
