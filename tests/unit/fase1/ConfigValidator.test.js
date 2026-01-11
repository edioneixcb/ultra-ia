/**
 * Testes unitários para ConfigValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ConfigValidator, { createConfigValidator } from '../../../src/systems/fase1/ConfigValidator.js';

describe('ConfigValidator', () => {
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

    validator = createConfigValidator(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await validator.initialize();
      expect(validator.validations).toBeDefined();
    });
  });

  describe('detectProjectRoot', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve detectar raiz do projeto', () => {
      const root = validator.detectProjectRoot();

      expect(root).toBeDefined();
      expect(typeof root).toBe('string');
    });
  });

  describe('validateBuildConfig', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar configuração de build válida', async () => {
      const config = {
        paths: {},
        babel: {
          plugins: ['@babel/plugin-proposal-class-properties']
        }
      };

      const result = await validator.validateBuildConfig(config);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('valid');
    });

    it('deve detectar caminhos faltando', async () => {
      const config = {
        paths: {
          android: '/nonexistent/path'
        }
      };

      const result = await validator.validateBuildConfig(config);

      expect(result.issues.some(i => i.type === 'missing_path')).toBe(true);
    });
  });

  describe('validatePaths', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar caminhos válidos', async () => {
      const config = {
        paths: {
          src: './src'
        }
      };

      const result = await validator.validatePaths(config);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('correctedPaths');
    });

    it('deve corrigir caminhos relativos', async () => {
      const config = {
        paths: {
          test: 'tests'
        }
      };

      const result = await validator.validatePaths(config);

      expect(result.correctedPaths).toBeDefined();
      expect(result.correctedPaths.test).toBeDefined();
    });
  });

  describe('validateSDKCompatibility', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar compatibilidade de SDK', async () => {
      const config = {
        sdkAPIs: [
          {
            name: 'testAPI',
            deprecated: false
          }
        ]
      };

      const result = await validator.validateSDKCompatibility(config, '1.0.0');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('valid');
    });

    it('deve detectar APIs deprecated', async () => {
      const config = {
        sdkAPIs: [
          {
            name: 'oldAPI',
            deprecated: true,
            deprecatedSince: '0.9.0'
          }
        ]
      };

      const result = await validator.validateSDKCompatibility(config, '1.0.0');

      expect(result.issues.some(i => i.type === 'deprecated_api')).toBe(true);
    });
  });

  describe('validateDependencies', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve validar dependências', async () => {
      const config = {
        usedDependencies: ['axios'],
        declaredDependencies: ['axios', 'lodash']
      };

      const result = await validator.validateDependencies(config);

      expect(result.valid).toBe(true);
    });

    it('deve detectar dependências não declaradas', async () => {
      const config = {
        usedDependencies: ['axios', 'lodash'],
        declaredDependencies: ['axios']
      };

      const result = await validator.validateDependencies(config);

      expect(result.issues.some(i => i.type === 'undeclared_dependency')).toBe(true);
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('deve executar validação completa', async () => {
      const config = {
        paths: {},
        babel: { plugins: [] }
      };

      const result = await validator.execute({ config });

      expect(result.build).toBeDefined();
      expect(result.paths).toBeDefined();
      expect(result.dependencies).toBeDefined();
    });

    it('deve executar validação específica', async () => {
      const config = { paths: {} };

      const result = await validator.execute({
        config,
        validationType: 'paths'
      });

      expect(result.paths).toBeDefined();
      expect(result.build).toBeUndefined();
    });

    it('deve lançar erro se config não fornecido', async () => {
      await expect(
        validator.execute({})
      ).rejects.toThrow('config é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = validator.onValidate({
        config: {}
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(validator.onValidate(null).valid).toBe(false);
      expect(validator.onValidate({}).valid).toBe(false);
    });
  });
});
