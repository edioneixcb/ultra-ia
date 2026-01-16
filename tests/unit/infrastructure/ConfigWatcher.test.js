/**
 * Testes unitários para ConfigWatcher
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { loadConfig } from '../../../src/utils/ConfigLoader.js';
import { createLogger } from '../../../src/utils/Logger.js';
import { getEventBus } from '../../../src/infrastructure/EventBus.js';
import ConfigWatcher from '../../../src/infrastructure/ConfigWatcher.js';

describe('ConfigWatcher', () => {
  let baseDir;
  let configPath;
  let watcher;

  beforeEach(() => {
    baseDir = join(tmpdir(), `config-watcher-${Date.now()}`);
    mkdirSync(baseDir, { recursive: true });
    configPath = join(baseDir, 'config.json');

    const config = {
      environment: 'test',
      port: 3001,
      services: { ollama: { url: 'http://localhost:11434', defaultModel: 'test-model' } },
      paths: {
        systemRoot: baseDir,
        knowledgeBase: join(baseDir, 'kb'),
        context: join(baseDir, 'ctx'),
        logs: join(baseDir, 'logs')
      }
    };
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    process.env.ULTRA_CONFIG_PATH = configPath;
    loadConfig(configPath);
  });

  afterEach(() => {
    if (watcher) {
      watcher.stop();
    }
    delete process.env.ULTRA_CONFIG_PATH;
    try {
      loadConfig();
    } catch (_error) {
      // ignore reload errors
    }
    if (baseDir) {
      rmSync(baseDir, { recursive: true, force: true });
    }
  });

  it('deve emitir evento ao recarregar config', async () => {
    const config = loadConfig(configPath).get();
    const eventBus = getEventBus(config);
    const logger = createLogger(config);
    watcher = new ConfigWatcher(config, logger);
    watcher.start();

    const waitForChange = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 2000);
      eventBus.once('config:changed', (payload) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });

    const updated = { ...config, environment: 'test-updated' };
    writeFileSync(configPath, JSON.stringify(updated, null, 2));

    const result = await waitForChange;
    expect(result).toHaveProperty('changed');
  });
});
