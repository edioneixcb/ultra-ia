/**
 * Testes unitários para ProactiveContractNegotiator
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import ProactiveContractNegotiator from '../../../src/guardians/ProactiveContractNegotiator.js';
import { createLogger } from '../../../src/utils/Logger.js';

describe('ProactiveContractNegotiator', () => {
  it('deve verificar contrato de classe', async () => {
    const baseDir = join(tmpdir(), `contract-test-${Date.now()}`);
    mkdirSync(baseDir, { recursive: true });
    const filePath = join(baseDir, 'MyService.js');
    writeFileSync(filePath, 'class MyService { method() { return true; } }');

    const config = { paths: { logs: join(baseDir, 'logs'), systemRoot: baseDir } };
    const logger = createLogger(config);
    const negotiator = new ProactiveContractNegotiator(config, logger);

    const result = await negotiator.verifyContract(
      { className: 'MyService', methodName: 'method' },
      { basePath: baseDir }
    );

    expect(result.exists).toBe(true);
    rmSync(baseDir, { recursive: true, force: true });
  });
});
