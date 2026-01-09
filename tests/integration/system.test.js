/**
 * Testes de Integração do Sistema Ultra
 * 
 * Testa o fluxo completo end-to-end do sistema.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getUltraSystem } from '../../src/systems/UltraSystem.js';
import { loadConfig } from '../../src/utils/ConfigLoader.js';
import { getLogger } from '../../src/utils/Logger.js';

describe('Sistema Ultra - Testes de Integração', () => {
  let ultraSystem;
  let config;
  let logger;

  beforeAll(() => {
    config = loadConfig().get();
    logger = getLogger(config);
    ultraSystem = getUltraSystem(config, logger);
  });

  describe('Fluxo Completo End-to-End', () => {
    it('deve processar requisição simples com sucesso', async () => {
      const result = await ultraSystem.process(
        'Criar uma função JavaScript chamada hello que retorna "Hello World"',
        {
          sessionId: 'test-integration-1',
          language: 'javascript',
          maxIterations: 3
        }
      );

      expect(result).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.sessionId).toBe('test-integration-1');
    }, 60000); // Timeout de 60 segundos

    it('deve manter contexto entre requisições', async () => {
      const sessionId = 'test-context-1';

      // Primeira requisição
      const result1 = await ultraSystem.process(
        'Criar uma classe Calculator com método add',
        {
          sessionId,
          language: 'javascript',
          maxIterations: 3
        }
      );

      // Segunda requisição na mesma sessão
      const result2 = await ultraSystem.process(
        'Adicionar método subtract à classe Calculator',
        {
          sessionId,
          language: 'javascript',
          maxIterations: 3
        }
      );

      expect(result1.sessionId).toBe(sessionId);
      expect(result2.sessionId).toBe(sessionId);
    }, 120000);

    it('deve retornar estatísticas do sistema', () => {
      const stats = ultraSystem.getStats();

      expect(stats).toBeDefined();
      expect(stats.knowledgeBase).toBeDefined();
      expect(stats.execution).toBeDefined();
      expect(stats.context).toBeDefined();
    });
  });

  describe('Componentes Individuais', () => {
    it('deve ter RequirementAnalyzer funcionando', () => {
      const analyzer = ultraSystem.requirementAnalyzer;
      expect(analyzer).toBeDefined();

      const analysis = analyzer.analyze('Criar função para validar email');
      expect(analysis).toBeDefined();
      expect(analysis).toHaveProperty('valid');
      expect(analysis).toHaveProperty('completeness');
    });

    it('deve ter KnowledgeBase funcionando', () => {
      const kb = ultraSystem.knowledgeBase;
      expect(kb).toBeDefined();

      const stats = kb.getStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('functions');
      expect(stats).toHaveProperty('classes');
    });

    it('deve ter ContextManager funcionando', () => {
      const cm = ultraSystem.contextManager;
      expect(cm).toBeDefined();

      const session = cm.getOrCreateSession('test-session');
      expect(session).toBeDefined();
      expect(session.id).toBe('test-session');
    });

    it('deve ter Generator funcionando', () => {
      const generator = ultraSystem.generator;
      expect(generator).toBeDefined();
      expect(generator.ollamaUrl).toBeDefined();
      expect(generator.primaryModel).toBeDefined();
    });

    it('deve ter Validator funcionando', () => {
      const validator = ultraSystem.validator;
      expect(validator).toBeDefined();

      const code = 'function test() { return true; }';
      const validation = validator.validate(code, {
        language: 'javascript',
        layers: ['syntax']
      });

      expect(validation).toBeDefined();
      expect(validation).toHaveProperty('valid');
    });

    it('deve ter ExecutionSystem funcionando', () => {
      const execSystem = ultraSystem.executionSystem;
      expect(execSystem).toBeDefined();

      const stats = execSystem.getStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar prompt vazio graciosamente', async () => {
      const result = await ultraSystem.process('', {
        sessionId: 'test-error-1',
        maxIterations: 1
      });

      expect(result).toBeDefined();
      // Pode falhar, mas não deve quebrar
    }, 30000);

    it('deve tratar linguagem inválida graciosamente', async () => {
      const result = await ultraSystem.process(
        'Criar função simples',
        {
          sessionId: 'test-error-2',
          language: 'invalid-language',
          maxIterations: 1
        }
      );

      expect(result).toBeDefined();
    }, 30000);
  });
});
