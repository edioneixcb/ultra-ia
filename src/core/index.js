/**
 * Core Infrastructure Systems
 * 
 * Exporta todos os sistemas de infraestrutura da FASE PRÉ-REQUISITO:
 * - ComponentRegistry: Registro e descoberta de componentes
 * - BaseSystem: Interface base para sistemas
 * - ConfigSchema: Configuração extensível e type-safe
 * - ExecutionPipeline: Pipeline de execução ordenada
 * 
 * @module core
 */

export { default as ComponentRegistry, getComponentRegistry, createComponentRegistry } from './ComponentRegistry.js';
export { default as BaseSystem } from './BaseSystem.js';
export { default as ConfigSchema, getConfigSchema, createConfigSchema } from './ConfigSchema.js';
export { default as ExecutionPipeline } from './ExecutionPipeline.js';
