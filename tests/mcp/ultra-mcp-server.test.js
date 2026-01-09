/**
 * Testes Unitários do Servidor MCP Sistema Ultra
 * 
 * Execute com: npm test tests/mcp/ultra-mcp-server.test.js
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../../');
const MCP_SERVER_PATH = join(PROJECT_ROOT, 'src/mcp/ultra-mcp-server.js');
const CONFIG_PATH = join(PROJECT_ROOT, 'config/config.json');

describe('Servidor MCP Sistema Ultra', () => {
  describe('Arquivos e Configuração', () => {
    it('deve ter arquivo do servidor MCP', () => {
      expect(existsSync(MCP_SERVER_PATH)).toBe(true);
    });

    it('deve ter arquivo de configuração', () => {
      expect(existsSync(CONFIG_PATH)).toBe(true);
    });

    it('deve ter configuração JSON válida', () => {
      const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
      expect(config).toBeDefined();
      expect(config.services).toBeDefined();
      expect(config.services.ollama).toBeDefined();
    });
  });

  describe('Dependências', () => {
    it('deve ter @modelcontextprotocol/sdk no package.json', async () => {
      const packageJson = JSON.parse(
        readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf-8')
      );
      expect(packageJson.dependencies['@modelcontextprotocol/sdk']).toBeDefined();
    });
  });

  describe('Importações', () => {
    it('deve importar servidor MCP sem erros', async () => {
      await expect(import(`file://${MCP_SERVER_PATH}`)).resolves.toBeDefined();
    });

    it('deve inicializar UltraSystem corretamente', async () => {
      const { loadConfig } = await import('../../src/utils/ConfigLoader.js');
      const { getUltraSystem } = await import('../../src/systems/UltraSystem.js');
      const { getLogger } = await import('../../src/utils/Logger.js');

      const configLoader = loadConfig(CONFIG_PATH);
      const config = configLoader.get();
      const logger = getLogger(config);
      const ultraSystem = getUltraSystem(config, logger);

      expect(ultraSystem).toBeDefined();
      expect(ultraSystem.knowledgeBase).toBeDefined();
      expect(ultraSystem.contextManager).toBeDefined();
      expect(ultraSystem.generator).toBeDefined();
      expect(ultraSystem.validator).toBeDefined();
      expect(ultraSystem.executionSystem).toBeDefined();
    });
  });
});
