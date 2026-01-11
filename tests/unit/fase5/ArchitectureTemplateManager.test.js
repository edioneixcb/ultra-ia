/**
 * Testes unitários para ArchitectureTemplateManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ArchitectureTemplateManager, { createArchitectureTemplateManager } from '../../../src/systems/fase5/ArchitectureTemplateManager.js';

describe('ArchitectureTemplateManager', () => {
  let manager;
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

    manager = createArchitectureTemplateManager(mockConfig, mockLogger, mockErrorHandler);
  });

  describe('initialize', () => {
    it('deve inicializar corretamente', async () => {
      await manager.initialize();
      expect(manager.templates).toBeDefined();
      expect(manager.templates.size).toBeGreaterThan(0);
    });
  });

  describe('getTemplate', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve retornar template de Domain Entity', () => {
      const template = manager.getTemplate('domain-entity');
      expect(template).toBeDefined();
      expect(template.name).toBe('Domain Entity');
    });

    it('deve retornar template de Use Case', () => {
      const template = manager.getTemplate('usecase');
      expect(template).toBeDefined();
      expect(template.name).toBe('Use Case');
    });

    it('deve retornar null para template inexistente', () => {
      const template = manager.getTemplate('nonexistent');
      expect(template).toBeNull();
    });
  });

  describe('generateFromTemplate', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve gerar código de Domain Entity', async () => {
      const result = await manager.generateFromTemplate('domain-entity', {
        EntityName: 'User'
      });

      expect(result.code).toBeDefined();
      expect(result.code).toContain('class User');
      expect(result.validation).toBeDefined();
    });

    it('deve gerar código de Use Case', async () => {
      const result = await manager.generateFromTemplate('usecase', {
        UseCaseName: 'CreateUser',
        repositoryName: 'User'
      });

      expect(result.code).toBeDefined();
      expect(result.code).toContain('CreateUserUseCase');
    });

    it('deve lançar erro se template não existe', async () => {
      await expect(
        manager.generateFromTemplate('nonexistent', {})
      ).rejects.toThrow('Template não encontrado');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('deve executar geração de template', async () => {
      const result = await manager.execute({
        action: 'generate',
        templateId: 'domain-entity',
        parameters: { EntityName: 'User' }
      });

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
    });

    it('deve executar listagem de templates', async () => {
      const result = await manager.execute({
        action: 'listTemplates'
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('deve lançar erro se action não fornecido', async () => {
      await expect(
        manager.execute({})
      ).rejects.toThrow('action é obrigatório');
    });
  });

  describe('validate', () => {
    it('deve validar contexto válido', () => {
      const result = manager.onValidate({
        action: 'generate'
      });
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar contexto inválido', () => {
      expect(manager.onValidate(null).valid).toBe(false);
      expect(manager.onValidate({}).valid).toBe(false);
    });
  });
});
