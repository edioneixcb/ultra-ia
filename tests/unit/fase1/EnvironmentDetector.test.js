/**
 * Testes unitários para EnvironmentDetector
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import EnvironmentDetector, { createEnvironmentDetector } from '../../../src/systems/fase1/EnvironmentDetector.js';

describe('EnvironmentDetector', () => {
  let detector;
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

    detector = createEnvironmentDetector(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await detector.initialize();
      expect(detector.detections).toBeDefined();
    });
  });

  describe('detectNodeJS', () => {
    beforeEach(async () => {
      await detector.initialize();
    });

    it('deve detectar Node.js se disponível', async () => {
      const result = await detector.detectNodeJS();

      // Node.js deve estar disponível no ambiente de teste
      expect(result).toBeDefined();
      expect(result).toHaveProperty('found');
    });
  });

  describe('detectPython', () => {
    beforeEach(async () => {
      await detector.initialize();
    });

    it('deve tentar detectar Python', async () => {
      const result = await detector.detectPython();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('found');
    });
  });

  describe('detectDocker', () => {
    beforeEach(async () => {
      await detector.initialize();
    });

    it('deve tentar detectar Docker', async () => {
      const result = await detector.detectDocker();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('found');
    });
  });

  describe('detectTools', () => {
    beforeEach(async () => {
      await detector.initialize();
    });

    it('deve detectar ferramentas disponíveis', async () => {
      const result = await detector.detectTools();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('git');
      expect(result).toHaveProperty('npm');
    });
  });

  describe('detectAll', () => {
    beforeEach(async () => {
      await detector.initialize();
    });

    it('deve detectar todos os ambientes', async () => {
      const result = await detector.detectAll();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('nodejs');
      expect(result).toHaveProperty('python');
      expect(result).toHaveProperty('docker');
      expect(result).toHaveProperty('tools');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await detector.initialize();
    });

    it('deve executar detecção completa', async () => {
      const result = await detector.execute({});

      expect(result).toBeDefined();
      expect(result.nodejs).toBeDefined();
      expect(result.python).toBeDefined();
      expect(result.docker).toBeDefined();
      expect(result.tools).toBeDefined();
    });
  });

  describe('validate', () => {
    it('deve sempre validar contexto (opcional)', () => {
      const result = detector.onValidate({});
      expect(result.valid).toBe(true);
    });
  });
});
