/**
 * Testes unitários para PlatformDetector
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import PlatformDetector, { createPlatformDetector } from '../../../src/systems/fase9/PlatformDetector.js';

describe('PlatformDetector', () => {
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

    detector = createPlatformDetector(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await detector.initialize();
      expect(detector.detections).toBeDefined();
    });
  });

  describe('detectOS', () => {
    it('deve detectar sistema operacional', () => {
      const os = detector.detectOS();
      expect(os).toBeDefined();
      expect(os.name).toBeDefined();
      expect(os.platform).toBeDefined();
    });
  });

  describe('detectRuntime', () => {
    it('deve detectar runtime Node.js', () => {
      const runtime = detector.detectRuntime();
      expect(runtime).toBeDefined();
      expect(runtime.type).toBe('nodejs');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await detector.initialize();
    });

    it('deve executar detecção de plataforma', async () => {
      const result = await detector.execute({
        action: 'detect'
      });

      expect(result).toBeDefined();
      expect(result.platform).toBeDefined();
      expect(result.runtime).toBeDefined();
    });

    it('deve lançar erro se action não fornecido', async () => {
      await expect(
        detector.execute({})
      ).rejects.toThrow('action é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = detector.onValidate({
        action: 'detect'
      });
      expect(result.valid).toBe(true);
    });
  });
});
