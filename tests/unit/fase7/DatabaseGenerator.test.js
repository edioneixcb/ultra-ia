/**
 * Testes unitários para DatabaseGenerator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import DatabaseGenerator, { createDatabaseGenerator } from '../../../src/systems/fase7/DatabaseGenerator.js';

describe('DatabaseGenerator', () => {
  let generator;
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

    generator = createDatabaseGenerator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await generator.initialize();
      expect(generator.generations).toBeDefined();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('deve gerar Migration', async () => {
      const result = await generator.execute({
        action: 'generate',
        type: 'migration',
        parameters: {
          migrationName: 'CreateUsers',
          tableName: 'users',
          columns: [
            { name: 'id', type: 'SERIAL PRIMARY KEY' },
            { name: 'name', type: 'VARCHAR(255)' }
          ]
        }
      });

      expect(result.code).toBeDefined();
      expect(result.code).toContain('users');
      expect(result.code).toContain('BEGIN');
      expect(result.code).toContain('COMMIT');
    });

    it('deve gerar RLS Policy', async () => {
      const result = await generator.execute({
        action: 'generate',
        type: 'rls-policy',
        parameters: { tableName: 'users' }
      });

      expect(result.code).toBeDefined();
      expect(result.code).toContain('users');
      expect(result.code).toContain('ROW LEVEL SECURITY');
    });
  });
});
