/**
 * Exportações dos sistemas da FASE 7
 */

export { default as ArchitectureGenerator, createArchitectureGenerator } from './ArchitectureGenerator.js';
export { default as SecurityGenerator, createSecurityGenerator } from './SecurityGenerator.js';
export { default as IntegrationGenerator, createIntegrationGenerator } from './IntegrationGenerator.js';
export { default as MobileGenerator, createMobileGenerator } from './MobileGenerator.js';
export { default as DatabaseGenerator, createDatabaseGenerator } from './DatabaseGenerator.js';

export { registerFase7Systems, defineFase7Schemas, initializeFase7Systems } from './registry-integration.js';
