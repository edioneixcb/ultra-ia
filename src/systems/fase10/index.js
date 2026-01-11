/**
 * Exportações dos sistemas da FASE 10
 */

export { default as SystemIntegrator, createSystemIntegrator } from './SystemIntegrator.js';
export { default as EndToEndTestRunner, createEndToEndTestRunner } from './EndToEndTestRunner.js';
export { default as FinalValidator, createFinalValidator } from './FinalValidator.js';

export { registerFase10Systems, defineFase10Schemas, initializeFase10Systems } from './registry-integration.js';
