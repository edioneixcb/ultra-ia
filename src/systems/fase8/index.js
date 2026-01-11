/**
 * Exportações dos sistemas da FASE 8
 */

export { default as IncrementalCodeGenerator, createIncrementalCodeGenerator } from './IncrementalCodeGenerator.js';
export { default as PatternLearner, createPatternLearner } from './PatternLearner.js';
export { default as MultiLayerValidatorEnhanced, createMultiLayerValidatorEnhanced } from './MultiLayerValidatorEnhanced.js';
export { default as SecureExecutionSystem, createSecureExecutionSystem } from './SecureExecutionSystem.js';

export { registerFase8Systems, defineFase8Schemas, initializeFase8Systems } from './registry-integration.js';
