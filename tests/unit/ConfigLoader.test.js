/**
 * Testes unitários para ConfigLoader
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import ConfigLoader from '../../src/utils/ConfigLoader.js';

describe('ConfigLoader', () => {
  let testConfigDir;
  let testConfigPath;

  beforeEach(() => {
    // Criar diretório temporário para testes
    testConfigDir = join(tmpdir(), `config-test-${Date.now()}`);
    mkdirSync(testConfigDir, { recursive: true });
    testConfigPath = join(testConfigDir, 'config.json');
  });

  describe('loadFromFile', () => {
    it('deve carregar configuração válida do arquivo JSON', () => {
      const configData = {
        environment: 'test',
        port: 3000,
        services: {
          ollama: {
            url: 'http://localhost:11434',
            defaultModel: 'test-model'
          }
        }
      };

      writeFileSync(testConfigPath, JSON.stringify(configData), 'utf-8');

      const loader = new ConfigLoader();
      const loaded = loader.loadFromFile(testConfigPath);

      expect(loaded.environment).toBe('test');
      expect(loaded.port).toBe(3000);
      expect(loaded.services.ollama.url).toBe('http://localhost:11434');
    });

    it('deve retornar objeto vazio se arquivo não existe', () => {
      const loader = new ConfigLoader();
      const loaded = loader.loadFromFile('/caminho/inexistente/config.json');

      expect(loaded).toEqual({});
    });

    it('deve lançar erro se JSON é inválido', () => {
      writeFileSync(testConfigPath, 'invalid json', 'utf-8');

      const loader = new ConfigLoader();
      
      expect(() => {
        loader.loadFromFile(testConfigPath);
      }).toThrow();
    });
  });

  describe('loadFromEnv', () => {
    it('deve carregar configuração de variáveis de ambiente', () => {
      process.env.OLLAMA_URL = 'http://test:11434';
      process.env.OLLAMA_DEFAULT_MODEL = 'test-model-env';
      process.env.NODE_ENV = 'test-env';

      const loader = new ConfigLoader();
      const envConfig = loader.loadFromEnv();

      expect(envConfig.services.ollama.url).toBe('http://test:11434');
      expect(envConfig.services.ollama.defaultModel).toBe('test-model-env');
      expect(envConfig.environment).toBe('test-env');

      // Limpar
      delete process.env.OLLAMA_URL;
      delete process.env.OLLAMA_DEFAULT_MODEL;
      delete process.env.NODE_ENV;
    });
  });

  describe('mergeConfig', () => {
    it('deve mesclar configurações corretamente', () => {
      const base = {
        a: 1,
        b: { c: 2, d: 3 }
      };

      const override = {
        b: { c: 4 },
        e: 5
      };

      const loader = new ConfigLoader();
      const merged = loader.mergeConfig(base, override);

      expect(merged.a).toBe(1);
      expect(merged.b.c).toBe(4); // Sobrescrito
      expect(merged.b.d).toBe(3); // Mantido
      expect(merged.e).toBe(5); // Adicionado
    });
  });

  describe('expandPaths', () => {
    it('deve expandir ~ para home directory', () => {
      const config = {
        paths: {
          test: '~/test/path'
        }
      };

      const loader = new ConfigLoader();
      const expanded = loader.expandPaths(config);

      expect(expanded.paths.test).not.toContain('~');
      expect(expanded.paths.test).toContain(process.env.HOME || process.env.USERPROFILE);
    });

    it('deve expandir $HOME', () => {
      const config = {
        paths: {
          test: '$HOME/test/path'
        }
      };

      const loader = new ConfigLoader();
      const expanded = loader.expandPaths(config);

      expect(expanded.paths.test).not.toContain('$HOME');
    });
  });

  describe('validate', () => {
    it('deve validar configuração completa', () => {
      const config = {
        services: {
          ollama: {
            url: 'http://localhost:11434',
            defaultModel: 'test-model'
          }
        },
        paths: {
          systemRoot: '/test',
          knowledgeBase: '/test/kb',
          context: '/test/ctx',
          logs: '/test/logs'
        }
      };

      const loader = new ConfigLoader();
      loader.config = config;
      
      expect(() => loader.validate()).not.toThrow();
    });

    it('deve lançar erro se services.ollama não configurado', () => {
      const config = {
        paths: {
          systemRoot: '/test',
          knowledgeBase: '/test/kb',
          context: '/test/ctx',
          logs: '/test/logs'
        }
      };

      const loader = new ConfigLoader();
      loader.config = config;
      
      expect(() => loader.validate()).toThrow();
    });

    it('deve lançar erro se paths não configurado', () => {
      const config = {
        services: {
          ollama: {
            url: 'http://localhost:11434',
            defaultModel: 'test-model'
          }
        }
      };

      const loader = new ConfigLoader();
      loader.config = config;
      
      expect(() => loader.validate()).toThrow();
    });
  });

  describe('getValue', () => {
    it('deve retornar valor de caminho simples', () => {
      const loader = new ConfigLoader();
      loader.config = {
        test: 'value'
      };

      expect(loader.getValue('test')).toBe('value');
    });

    it('deve retornar valor de caminho aninhado', () => {
      const loader = new ConfigLoader();
      loader.config = {
        services: {
          ollama: {
            url: 'http://localhost:11434'
          }
        }
      };

      expect(loader.getValue('services.ollama.url')).toBe('http://localhost:11434');
    });

    it('deve retornar defaultValue se caminho não existe', () => {
      const loader = new ConfigLoader();
      loader.config = {};

      expect(loader.getValue('inexistente', 'default')).toBe('default');
    });
  });

  describe('load completo', () => {
    it('deve carregar e validar configuração completa', () => {
      const configData = {
        environment: 'test',
        services: {
          ollama: {
            url: 'http://localhost:11434',
            defaultModel: 'test-model'
          }
        },
        paths: {
          systemRoot: '/test',
          knowledgeBase: '/test/kb',
          context: '/test/ctx',
          logs: '/test/logs'
        }
      };

      writeFileSync(testConfigPath, JSON.stringify(configData), 'utf-8');

      const loader = new ConfigLoader();
      const config = loader.load(testConfigPath);

      expect(config.environment).toBe('test');
      expect(config.services.ollama.url).toBe('http://localhost:11434');
      expect(config.paths.systemRoot).toBe('/test');
    });
  });
});
