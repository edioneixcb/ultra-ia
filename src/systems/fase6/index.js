/**
 * Exportações dos sistemas da FASE 6
 */

// Sistemas
export { default as ArchitectureValidator, createArchitectureValidator } from './ArchitectureValidator.js';
export { default as SecurityValidatorEnhanced, createSecurityValidatorEnhanced } from './SecurityValidatorEnhanced.js';
export { default as IntegrationValidator, createIntegrationValidator } from './IntegrationValidator.js';
export { default as MobileValidator, createMobileValidator } from './MobileValidator.js';
export { default as DatabaseValidator, createDatabaseValidator } from './DatabaseValidator.js';

// Integração
export { registerFase6Systems, defineFase6Schemas, initializeFase6Systems } from './registry-integration.js';
