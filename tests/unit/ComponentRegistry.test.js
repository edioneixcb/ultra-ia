/**
 * Testes unitários para ComponentRegistry
 * 
 * Valida funcionalidades de registro, descoberta e resolução de dependências
 */

import { describe, it, expect, beforeEach } from 'vitest';
import ComponentRegistry, { createComponentRegistry } from '../../src/core/ComponentRegistry.js';

describe('ComponentRegistry', () => {
  let registry;
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

    registry = createComponentRegistry({
      logger: mockLogger,
      errorHandler: mockErrorHandler
    });
  });

  describe('register', () => {
    it('deve registrar componente sem dependências', () => {
      const factory = () => ({ name: 'TestComponent' });
      
      expect(() => {
        registry.register('test', factory, []);
      }).not.toThrow();

      expect(registry.has('test')).toBe(true);
    });

    it('deve registrar componente com dependências', () => {
      const depFactory = () => ({ name: 'Dependency' });
      const factory = (dep) => ({ name: 'Component', dependency: dep });
      
      registry.register('dependency', depFactory, []);
      registry.register('component', factory, ['dependency']);

      expect(registry.has('dependency')).toBe(true);
      expect(registry.has('component')).toBe(true);
    });

    it('deve lançar erro se componente já está registrado', () => {
      const factory = () => ({});
      
      registry.register('test', factory);
      
      expect(() => {
        registry.register('test', factory);
      }).toThrow('já está registrado');
    });

    it('deve lançar erro se dependência não existe', () => {
      const factory = () => ({});
      
      expect(() => {
        registry.register('component', factory, ['missing']);
      }).toThrow('Dependências faltando');
    });

    it('deve validar entrada inválida', () => {
      expect(() => {
        registry.register('', () => ({}));
      }).toThrow('string não vazia');

      expect(() => {
        registry.register('test', 'not-a-function');
      }).toThrow('função');

      expect(() => {
        registry.register('test', () => ({}), 'not-an-array');
      }).toThrow('array');
    });
  });

  describe('get', () => {
    it('deve criar instância de componente sem dependências', () => {
      const factory = () => ({ id: 123 });
      registry.register('test', factory);

      const instance = registry.get('test');

      expect(instance).toEqual({ id: 123 });
    });

    it('deve injetar dependências automaticamente', () => {
      const depFactory = () => ({ name: 'Dependency' });
      const factory = (dep) => ({ component: 'Test', dependency: dep });
      
      registry.register('dependency', depFactory);
      registry.register('component', factory, ['dependency']);

      const instance = registry.get('component');

      expect(instance.component).toBe('Test');
      expect(instance.dependency.name).toBe('Dependency');
    });

    it('deve usar contexto quando fornecido', () => {
      const depFactory = () => ({ name: 'Dependency' });
      const factory = (dep) => ({ dependency: dep });
      
      registry.register('dependency', depFactory);
      registry.register('component', factory, ['dependency']);

      const contextDep = { name: 'ContextDependency' };
      const instance = registry.get('component', { dependency: contextDep });

      expect(instance.dependency).toBe(contextDep);
    });

    it('deve lançar erro se componente não está registrado', () => {
      expect(() => {
        registry.get('missing');
      }).toThrow('não está registrado');
    });

    it('deve resolver dependências transitivas', () => {
      const level1 = () => ({ level: 1 });
      const level2 = (l1) => ({ level: 2, dependsOn: l1 });
      const level3 = (l2) => ({ level: 3, dependsOn: l2 });
      
      registry.register('level1', level1);
      registry.register('level2', level2, ['level1']);
      registry.register('level3', level3, ['level2']);

      const instance = registry.get('level3');

      expect(instance.level).toBe(3);
      expect(instance.dependsOn.level).toBe(2);
      expect(instance.dependsOn.dependsOn.level).toBe(1);
    });

    it('deve tratar dependências opcionais não registradas como null', () => {
      const factory = (dep) => ({ name: 'Component', optionalDep: dep });
      
      // Registrar com dependência opcional que não existe
      registry.register('component', factory, ['?OptionalDep']);
      
      const instance = registry.get('component');
      
      expect(instance.optionalDep).toBeNull();
    });

    it('deve injetar dependências opcionais quando registradas', () => {
      const depFactory = () => ({ name: 'Optional' });
      const factory = (dep) => ({ name: 'Component', optionalDep: dep });
      
      registry.register('OptionalDep', depFactory);
      registry.register('component', factory, ['?OptionalDep']);
      
      const instance = registry.get('component');
      
      expect(instance.optionalDep).not.toBeNull();
      expect(instance.optionalDep.name).toBe('Optional');
    });
  });

  describe('resolveDependencies', () => {
    it('deve retornar ordem correta de dependências', () => {
      registry.register('a', () => ({}));
      registry.register('b', () => ({}), ['a']);
      registry.register('c', () => ({}), ['b']);

      const order = registry.resolveDependencies('c');

      expect(order).toEqual(['a', 'b', 'c']);
    });

    it('deve detectar dependência circular', () => {
      // Registrar ambos primeiro (validação de dependências acontece no register)
      // Mas podemos criar uma situação onde a validação passa mas há ciclo na resolução
      const aFactory = () => ({ name: 'A' });
      const bFactory = () => ({ name: 'B' });
      
      // Para testar ciclo, precisamos registrar sem validação estrita
      // Mas nosso código valida no register, então vamos testar na resolução
      // Criando um registry temporário que permite isso
      const tempRegistry = createComponentRegistry();
      
      // Simular registro que passa validação mas cria ciclo na resolução
      tempRegistry.components.set('a', aFactory);
      tempRegistry.components.set('b', bFactory);
      tempRegistry.dependencies.set('a', ['b']);
      tempRegistry.dependencies.set('b', ['a']);

      expect(() => {
        tempRegistry.resolveDependencies('a');
      }).toThrow('Dependência circular');
    });

    it('deve lançar erro se componente não existe', () => {
      expect(() => {
        registry.resolveDependencies('missing');
      }).toThrow('não está registrado');
    });
  });

  describe('getAllRegistered', () => {
    it('deve retornar todos os componentes registrados', () => {
      registry.register('a', () => ({}));
      registry.register('b', () => ({}));
      registry.register('c', () => ({}));

      const all = registry.getAllRegistered();

      expect(all).toContain('a');
      expect(all).toContain('b');
      expect(all).toContain('c');
      expect(all.length).toBe(3);
    });

    it('deve retornar array vazio se nenhum componente registrado', () => {
      const all = registry.getAllRegistered();
      expect(all).toEqual([]);
    });
  });

  describe('has', () => {
    it('deve retornar true se componente existe', () => {
      registry.register('test', () => ({}));
      expect(registry.has('test')).toBe(true);
    });

    it('deve retornar false se componente não existe', () => {
      expect(registry.has('missing')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('deve remover componente sem dependentes', () => {
      registry.register('test', () => ({}));
      
      const removed = registry.unregister('test');

      expect(removed).toBe(true);
      expect(registry.has('test')).toBe(false);
    });

    it('deve lançar erro se componente tem dependentes', () => {
      registry.register('parent', () => ({}));
      registry.register('child', () => ({}), ['parent']);

      expect(() => {
        registry.unregister('parent');
      }).toThrow('outros componentes dependem dele');
    });

    it('deve retornar false se componente não existe', () => {
      const removed = registry.unregister('missing');
      expect(removed).toBe(false);
    });
  });

  describe('clear', () => {
    it('deve limpar todos os componentes', () => {
      registry.register('a', () => ({}));
      registry.register('b', () => ({}));

      registry.clear();

      expect(registry.getAllRegistered()).toEqual([]);
    });
  });
});
