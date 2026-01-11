/**
 * Testes unitários para ArchitectureValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ArchitectureValidator, { createArchitectureValidator } from '../../../src/systems/fase6/ArchitectureValidator.js';

describe('ArchitectureValidator', () => {
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

    validator = createArchitectureValidator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validations).toBeDefined();
    });
  });

  describe('validateCleanArchitecture', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar código com Clean Architecture correto', async () => {
      const code = `
        class UserRepository {
          async findById(id) { }
        }
      `;

      const result = await validator.validateCleanArchitecture(code, {});

      expect(result).toBeDefined();
      expect(result.type).toBe('clean-architecture');
    });

    it('deve detectar violação de dependência de camada', async () => {
      const code = `
        import { something } from 'infrastructure';
      `;

      const result = await validator.validateCleanArchitecture(code, {});

      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('validateRepositoryPattern', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar Repository Pattern correto', async () => {
      const code = `
        class IUserRepository {
          async findById(id) { }
          async findAll() { }
          async save(entity) { }
          async delete(id) { }
        }
      `;

      const result = await validator.validateRepositoryPattern(code, {});

      expect(result).toBeDefined();
      expect(result.type).toBe('repository');
    });

    it('deve detectar método faltando', async () => {
      const code = `
        class UserRepository {
          async findById(id) { }
        }
      `;

      const result = await validator.validateRepositoryPattern(code, {});

      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('validateUseCasePattern', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar Use Case Pattern correto', async () => {
      const code = `
        class CreateUserUseCase {
          constructor(userRepository) {
            this.repository = userRepository;
          }
          async execute(input) {
            this.validateInput(input);
            return await this.repository.save(input);
          }
        }
      `;

      const result = await validator.validateUseCasePattern(code, {});

      expect(result).toBeDefined();
      expect(result.type).toBe('usecase');
    });

    it('deve detectar método execute faltando', async () => {
      const code = `
        class CreateUserUseCase {
          constructor(repository) { }
        }
      `;

      const result = await validator.validateUseCasePattern(code, {});

      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve executar validação de Clean Architecture', async () => {
      const result = await validator.execute({
        action: 'validate',
        code: 'class Test { }',
        type: 'clean-architecture'
      });

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
    });

    it('deve lançar erro se action não fornecido', async () => {
      await expect(
        validator.execute({})
      ).rejects.toThrow('action é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = validator.onValidate({
        action: 'validate'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(validator.onValidate(null).valid).toBe(false);
      expect(validator.onValidate({}).valid).toBe(false);
    });
  });
});
