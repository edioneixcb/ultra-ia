/**
 * Exportações dos sistemas da FASE 3
 */

// Sistemas
export { default as TestExpectationValidator, createTestExpectationValidator } from './TestExpectationValidator.js';
export { default as TestValidator, createTestValidator } from './TestValidator.js';
export { default as AccurateDocumentationSystem, createAccurateDocumentationSystem } from './AccurateDocumentationSystem.js';
export { default as MetaValidationSystem, createMetaValidationSystem } from './MetaValidationSystem.js';

// Integração
export { registerFase3Systems, defineFase3Schemas, initializeFase3Systems } from './registry-integration.js';
