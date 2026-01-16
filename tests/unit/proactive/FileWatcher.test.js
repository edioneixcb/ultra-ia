/**
 * Testes unitários para FileWatcher
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { getEventBus } from '../../../src/infrastructure/EventBus.js';
import FileWatcher from '../../../src/proactive/FileWatcher.js';

describe('FileWatcher', () => {
  let baseDir;
  let watcher;
  let eventBus;

  beforeEach(() => {
    baseDir = join(tmpdir(), `filewatcher-${Date.now()}`);
    mkdirSync(baseDir, { recursive: true });
    const config = {
      paths: { logs: join(baseDir, 'logs') },
      proactive: { fileWatcher: { rootPath: baseDir, ignore: [] } }
    };
    eventBus = getEventBus(config);
    watcher = new FileWatcher(config);
  });

  afterEach(() => {
    if (watcher) {
      watcher.stop();
    }
  });

  it('deve emitir evento de criação de arquivo', async () => {
    watcher.start();
    await new Promise(resolve => setTimeout(resolve, 100));

    const waitForEvent = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 5000);
      eventBus.once('file:created', (payload) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });

    const filePath = join(baseDir, 'novo.txt');
    writeFileSync(filePath, 'hello');

    const payload = await waitForEvent;
    expect(payload.filePath).toBe(filePath);
  });
});
