/**
 * Teste E2E do fluxo proativo
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { getEventBus } from '../../src/infrastructure/EventBus.js';
import FileWatcher from '../../src/proactive/FileWatcher.js';
import CognitiveContextEngine from '../../src/cognitive/CognitiveContextEngine.js';
import InterceptorLayer from '../../src/proactive/InterceptorLayer.js';
import AgentMemoryBridge from '../../src/memory/AgentMemoryBridge.js';
import MutationSelfHealing from '../../src/healing/MutationSelfHealing.js';

describe('Fluxo proativo E2E', () => {
  it('deve executar fluxo completo básico', async () => {
    const baseDir = join(tmpdir(), `e2e-proactive-${Date.now()}`);
    mkdirSync(baseDir, { recursive: true });
    const config = {
      paths: { logs: join(baseDir, 'logs'), proactive: join(baseDir, 'data') },
      proactive: { fileWatcher: { rootPath: baseDir, ignore: [] } },
      execution: { docker: { enabled: false } }
    };

    // FileWatcher
    const eventBus = getEventBus(config);
    const watcher = new FileWatcher(config);
    watcher.start();
    await new Promise(resolve => setTimeout(resolve, 100));

    const fileEvent = new Promise((resolve) => {
      eventBus.once('file:created', (payload) => resolve(payload));
    });

    const filePath = join(baseDir, 'sample.js');
    writeFileSync(filePath, 'const a = 1;');
    const payload = await fileEvent;
    expect(payload.filePath).toBe(filePath);
    watcher.stop();

    // Cognitive Context
    const engine = new CognitiveContextEngine(config);
    const enriched = engine.enrichContext({ filePath, content: 'const a = 1;' });
    expect(enriched.style).toBeDefined();

    // InterceptorLayer
    const interceptor = new InterceptorLayer(config);
    const intercept = await interceptor.analyze('ultra_execute_code', { code: 'eval(\"2+2\")' });
    expect(intercept.blocked).toBe(true);

    // Agent Memory
    const memory = new AgentMemoryBridge(config);
    memory.storeMemory('TesterAgent', 'memo', { type: 'success' });
    const memories = memory.recall('TesterAgent', null, 5);
    expect(memories.length).toBeGreaterThan(0);

    // Self-healing
    const healer = new MutationSelfHealing(config);
    const healResult = await healer.heal('const a = b;', 'b is not defined');
    expect(healResult.success).toBe(false);
  }, 20000);
});
