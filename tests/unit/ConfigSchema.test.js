/**
 * Testes unitários para ConfigSchema
 * 
 * Valida definição de schemas, validação type-safe e merge de defaults
 */

import { describe, it, expect, beforeEach } from 'vitest';
import ConfigSchema, { createConfigSchema } from '../../src/core/ConfigSchema.js';

describe('ConfigSchema', () => {
  let schema;
  let mockLogger;
  let mockErrorHandler;

  beforeEach(() => {
    mockLogger = {
      info: () => {},
      warn: () => {},
      error: () => {}
    };

    mockErrorHandler = {
      handleError: () => {}
    };

    schema = createConfigSchema({
      logger: mockLogger,
      errorHandler: mockErrorHandler
    });
  });

  describe('defineSystem', () => {
    it('deve definir schema para sistema', () => {
      const systemSchema = {
        type: 'object',
        properties: {
          host: { type: 'string', required: true },
          port: { type: 'number', default: 5432 }
        }
      };

      expect(() => {
        schema.defineSystem('database', systemSchema, { port: 5432 });
      }).not.toThrow();

      expect(schema.hasSchema('database')).toBe(true);
    });

    it('deve lançar erro se schema já está definido', () => {
      const systemSchema = { type: 'object' };
      
      schema.defineSystem('test', systemSchema);
      
      expect(() => {
        schema.defineSystem('test', systemSchema);
      }).toThrow('já está definido');
    });

    it('deve validar defaults contra schema', () => {
      const systemSchema = {
        type: 'object',
        properties: {
          port: { type: 'number' }
        }
      };

      expect(() => {
        schema.defineSystem('test', systemSchema, { port: 'invalid' });
      }).toThrow('Defaults inválidos');
    });

    it('deve validar entrada inválida', () => {
      expect(() => {
        schema.defineSystem('', { type: 'string' });
      }).toThrow('string não vazia');

      expect(() => {
        schema.defineSystem('test', null);
      }).toThrow('objeto');

      expect(() => {
        schema.defineSystem('test', {});
      }).toThrow('propriedade "type"');
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      schema.defineSystem('database', {
        type: 'object',
        properties: {
          host: { type: 'string', required: true },
          port: { type: 'number', min: 1, max: 65535 },
          enabled: { type: 'boolean' }
        }
      });
    });

    it('deve validar configuração válida', () => {
      const config = {
        host: 'localhost',
        port: 5432,
        enabled: true
      };

      const result = schema.validate(config, 'database');

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('deve retornar erros para configuração inválida', () => {
      const config = {
        host: 'localhost',
        port: 'invalid',
        enabled: true
      };

      const result = schema.validate(config, 'database');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve validar campo obrigatório faltando', () => {
      const config = {
        port: 5432
      };

      const result = schema.validate(config, 'database');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('obrigatório'))).toBe(true);
    });

    it('deve validar constraints (min, max)', () => {
      const config = {
        host: 'localhost',
        port: 70000
      };

      const result = schema.validate(config, 'database');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('máximo'))).toBe(true);
    });

    it('deve lançar erro se schema não encontrado', () => {
      expect(() => {
        schema.validate({}, 'missing');
      }).toThrow('não encontrado');
    });
  });

  describe('mergeDefaults', () => {
    beforeEach(() => {
      schema.defineSystem('database', {
        type: 'object',
        properties: {
          host: { type: 'string' },
          port: { type: 'number' },
          timeout: { type: 'number' }
        }
      }, {
        port: 5432,
        timeout: 5000
      });
    });

    it('deve mesclar defaults com configuração', () => {
      const config = { host: 'localhost' };
      const merged = schema.mergeDefaults(config, 'database');

      expect(merged.host).toBe('localhost');
      expect(merged.port).toBe(5432);
      expect(merged.timeout).toBe(5000);
    });

    it('deve sobrescrever defaults com configuração fornecida', () => {
      const config = { host: 'localhost', port: 3306 };
      const merged = schema.mergeDefaults(config, 'database');

      expect(merged.port).toBe(3306); // Sobrescrito
      expect(merged.timeout).toBe(5000); // Do default
    });

    it('deve fazer merge profundo de objetos aninhados', () => {
      schema.defineSystem('nested', {
        type: 'object',
        properties: {
          db: {
            type: 'object',
            properties: {
              host: { type: 'string' },
              port: { type: 'number' }
            }
          }
        }
      }, {
        db: { host: 'localhost', port: 5432 }
      });

      const config = { db: { host: 'remote' } };
      const merged = schema.mergeDefaults(config, 'nested');

      expect(merged.db.host).toBe('remote');
      expect(merged.db.port).toBe(5432);
    });
  });

  describe('validate - tipos específicos', () => {
    it('deve validar array com items', () => {
      schema.defineSystem('list', {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 10
      });

      expect(schema.validate(['a', 'b'], 'list').valid).toBe(true);
      expect(schema.validate([], 'list').valid).toBe(false);
      expect(schema.validate(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'], 'list').valid).toBe(false);
    });

    it('deve validar string com pattern e enum', () => {
      schema.defineSystem('string', {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['dev', 'prod', 'test'] },
          pattern: { type: 'string', pattern: '^[a-z]+$' }
        }
      });

      expect(schema.validate({ mode: 'dev', pattern: 'abc' }, 'string').valid).toBe(true);
      expect(schema.validate({ mode: 'invalid', pattern: 'abc' }, 'string').valid).toBe(false);
      expect(schema.validate({ mode: 'dev', pattern: 'ABC' }, 'string').valid).toBe(false);
    });

    it('deve validar com validator customizado', () => {
      schema.defineSystem('custom', {
        type: 'object',
        properties: {
          value: {
            type: 'number',
            validator: (val) => {
              if (val % 2 === 0) return true;
              return 'deve ser par';
            }
          }
        }
      });

      expect(schema.validate({ value: 2 }, 'custom').valid).toBe(true);
      expect(schema.validate({ value: 3 }, 'custom').valid).toBe(false);
    });
  });

  describe('getSchema e getDefaults', () => {
    it('deve retornar schema definido', () => {
      const systemSchema = { type: 'object' };
      schema.defineSystem('test', systemSchema, { default: 'value' });

      expect(schema.getSchema('test')).toBe(systemSchema);
      expect(schema.getDefaults('test')).toEqual({ default: 'value' });
    });

    it('deve retornar undefined/objeto vazio se não encontrado', () => {
      expect(schema.getSchema('missing')).toBeUndefined();
      expect(schema.getDefaults('missing')).toEqual({});
    });
  });

  describe('getAllSystems', () => {
    it('deve retornar todos os sistemas com schema', () => {
      schema.defineSystem('a', { type: 'string' });
      schema.defineSystem('b', { type: 'number' });
      schema.defineSystem('c', { type: 'boolean' });

      const all = schema.getAllSystems();

      expect(all).toContain('a');
      expect(all).toContain('b');
      expect(all).toContain('c');
      expect(all.length).toBe(3);
    });
  });
});
