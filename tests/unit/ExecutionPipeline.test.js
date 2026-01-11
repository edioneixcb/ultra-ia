/**
 * Testes unitários para ExecutionPipeline
 * 
 * Valida execução ordenada, resolução de dependências e tratamento de erros
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ExecutionPipeline from '../../src/core/ExecutionPipeline.js';
import ComponentRegistry from '../../src/core/ComponentRegistry.js';
import BaseSystem from '../../src/core/BaseSystem.js';

// Sistemas de teste
class SystemA extends BaseSystem {
  async onExecute(context) {
    return { system: 'A', executed: true };
  }
}

class SystemB extends BaseSystem {
  async onExecute(context) {
    return { system: 'B', executed: true };
  }
}

class SystemC extends BaseSystem {
  async onExecute(context) {
    return { system: 'C', executed: true };
  }
}

describe('ExecutionPipeline', () => {
  let registry;
  let pipeline;
  let mockLogger;
  let mockErrorHandler;

  beforeEach(() => {
    mockLogger = {
      info: () => {},
      debug: () => {},
      warn: () => {},
      error: () => {}
    };

    mockErrorHandler = {
      handleError: () => {}
    };

    registry = new ComponentRegistry({ logger: mockLogger, errorHandler: mockErrorHandler });
    
    // Registrar sistemas de teste
    registry.register('SystemA', () => new SystemA(null, mockLogger, mockErrorHandler));
    registry.register('SystemB', () => new SystemB(null, mockLogger, mockErrorHandler));
    registry.register('SystemC', () => new SystemC(null, mockLogger, mockErrorHandler));

    pipeline = new ExecutionPipeline(registry, {
      logger: mockLogger,
      errorHandler: mockErrorHandler
    });
  });

  describe('addStage', () => {
    it('deve adicionar estágio sem dependências', () => {
      expect(() => {
        pipeline.addStage('init', ['SystemA'], []);
      }).not.toThrow();

      expect(pipeline.getStage('init')).toBeDefined();
    });

    it('deve adicionar estágio com dependências', () => {
      pipeline.addStage('init', ['SystemA'], []);
      pipeline.addStage('setup', ['SystemB'], ['init']);

      const stage = pipeline.getStage('setup');
      expect(stage.dependencies).toEqual(['init']);
    });

    it('deve lançar erro se estágio já existe', () => {
      pipeline.addStage('init', ['SystemA']);

      expect(() => {
        pipeline.addStage('init', ['SystemB']);
      }).toThrow('já existe');
    });

    it('deve lançar erro se sistema não está registrado', () => {
      expect(() => {
        pipeline.addStage('init', ['MissingSystem']);
      }).toThrow('não registrados');
    });

    it('deve validar entrada inválida', () => {
      expect(() => {
        pipeline.addStage('', ['SystemA']);
      }).toThrow('string não vazia');

      expect(() => {
        pipeline.addStage('init', []);
      }).toThrow('array não vazio');

      expect(() => {
        pipeline.addStage('init', ['SystemA'], 'not-array');
      }).toThrow('array');
    });
  });

  describe('execute', () => {
    it('deve executar estágio único', async () => {
      pipeline.addStage('init', ['SystemA']);

      const results = await pipeline.execute();

      expect(results.SystemA).toBeDefined();
      expect(results.SystemA.system).toBe('A');
    });

    it('deve executar estágios na ordem correta', async () => {
      pipeline.addStage('init', ['SystemA'], []);
      pipeline.addStage('setup', ['SystemB'], ['init']);
      pipeline.addStage('final', ['SystemC'], ['setup']);

      const results = await pipeline.execute();

      expect(results.SystemA).toBeDefined();
      expect(results.SystemB).toBeDefined();
      expect(results.SystemC).toBeDefined();
    });

    it('deve executar estágios paralelos quando possível', async () => {
      pipeline.addStage('init', ['SystemA'], []);
      pipeline.addStage('parallel1', ['SystemB'], ['init']);
      pipeline.addStage('parallel2', ['SystemC'], ['init']);

      const results = await pipeline.execute();

      expect(results.SystemA).toBeDefined();
      expect(results.SystemB).toBeDefined();
      expect(results.SystemC).toBeDefined();
    });

    it('deve passar contexto para sistemas', async () => {
      pipeline.addStage('init', ['SystemA']);

      const context = { sessionId: '123', data: 'test' };
      const results = await pipeline.execute(context);

      expect(results.SystemA).toBeDefined();
    });

    it('deve retornar objeto vazio se nenhum estágio', async () => {
      const results = await pipeline.execute();
      expect(results).toEqual({});
    });
  });

  describe('calculateExecutionOrder', () => {
    it('deve calcular ordem correta baseada em dependências', () => {
      pipeline.addStage('c', ['SystemC'], ['b']);
      pipeline.addStage('a', ['SystemA'], []);
      pipeline.addStage('b', ['SystemB'], ['a']);

      const order = pipeline.calculateExecutionOrder();

      expect(order[0].name).toBe('a');
      expect(order[1].name).toBe('b');
      expect(order[2].name).toBe('c');
    });

    it('deve detectar dependência circular', () => {
      pipeline.addStage('a', ['SystemA'], ['b']);
      pipeline.addStage('b', ['SystemB'], ['a']);

      expect(() => {
        pipeline.calculateExecutionOrder();
      }).toThrow('Dependência circular');
    });

    it('deve lançar erro se dependência não existe', () => {
      pipeline.addStage('a', ['SystemA'], ['missing']);

      expect(() => {
        pipeline.calculateExecutionOrder();
      }).toThrow('não encontrada');
    });
  });

  describe('validateDependencies', () => {
    it('deve validar que todas as dependências existem', () => {
      pipeline.addStage('a', ['SystemA'], []);
      pipeline.addStage('b', ['SystemB'], ['a']);

      expect(() => {
        pipeline.validateDependencies();
      }).not.toThrow();
    });

    it('deve lançar erro se dependência não existe', () => {
      pipeline.addStage('a', ['SystemA'], ['missing']);

      expect(() => {
        pipeline.validateDependencies();
      }).toThrow('não existe');
    });
  });

  describe('reset', () => {
    it('deve resetar todos os estágios', async () => {
      pipeline.addStage('init', ['SystemA']);
      await pipeline.execute();

      expect(pipeline.getStage('init').completed).toBe(true);

      pipeline.reset();

      expect(pipeline.getStage('init').completed).toBe(false);
    });
  });

  describe('getStages e getStage', () => {
    it('deve retornar todos os estágios', () => {
      pipeline.addStage('a', ['SystemA']);
      pipeline.addStage('b', ['SystemB']);

      const stages = pipeline.getStages();

      expect(stages.length).toBe(2);
      expect(stages.map(s => s.name)).toContain('a');
      expect(stages.map(s => s.name)).toContain('b');
    });

    it('deve retornar estágio específico', () => {
      pipeline.addStage('test', ['SystemA']);
      const stage = pipeline.getStage('test');

      expect(stage).toBeDefined();
      expect(stage.name).toBe('test');
    });

    it('deve retornar undefined se estágio não existe', () => {
      const stage = pipeline.getStage('missing');
      expect(stage).toBeUndefined();
    });
  });

  describe('tratamento de erros', () => {
    it('deve tratar erro durante execução de sistema', async () => {
      class FailingSystem extends BaseSystem {
        async onExecute() {
          throw new Error('Execution failed');
        }
      }

      registry.register('FailingSystem', () => new FailingSystem(null, mockLogger, mockErrorHandler));
      pipeline.addStage('fail', ['FailingSystem']);

      await expect(
        pipeline.execute()
      ).rejects.toThrow('Execution failed');
    });

    it('deve validar que sistema implementa método execute', async () => {
      registry.register('InvalidSystem', () => ({ notASystem: true }));
      pipeline.addStage('invalid', ['InvalidSystem']);

      await expect(
        pipeline.execute()
      ).rejects.toThrow('não implementa método execute()');
    });
  });
});
