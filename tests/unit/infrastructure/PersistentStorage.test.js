/**
 * Testes unitários para PersistentStorage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { existsSync, rmSync } from 'fs';
import PersistentStorage from '../../../src/infrastructure/PersistentStorage.js';
import { createLogger } from '../../../src/utils/Logger.js';

describe('PersistentStorage', () => {
  let baseDir;
  let storage;

  beforeEach(() => {
    const logsDir = join(tmpdir(), 'ultra-ia-test-logs');
    baseDir = join(tmpdir(), `proactive-storage-${Date.now()}`);
    const config = {
      paths: {
        proactive: join(baseDir, 'data'),
        logs: logsDir
      },
      logging: {
        level: 'info'
      }
    };
    const logger = createLogger(config);
    storage = new PersistentStorage(config, logger);
  });

  afterEach(() => {
    try {
      storage.close();
    } catch (_error) {
      // ignorar falhas de cleanup
    }
    if (existsSync(baseDir)) {
      rmSync(baseDir, { recursive: true, force: true });
    }
  });

  it('deve criar arquivo de banco de dados', () => {
    const dbPath = join(baseDir, 'data', 'proactive.db');
    expect(existsSync(dbPath)).toBe(true);
  });

  it('deve registrar evento no log', () => {
    storage.logEvent('test:event', { hello: 'world' }, { traceId: 't-1' });
    const db = storage.getConnection();
    const row = db.prepare('SELECT event, payload, metadata FROM event_log WHERE event = ?').get('test:event');
    expect(row).toBeDefined();
    expect(JSON.parse(row.payload)).toEqual({ hello: 'world' });
    expect(JSON.parse(row.metadata)).toEqual({ traceId: 't-1' });
  });
});
