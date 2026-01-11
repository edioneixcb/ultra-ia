/**
 * Exportações dos sistemas da FASE 5
 */

// Sistemas
export { default as ArchitectureTemplateManager, createArchitectureTemplateManager } from './ArchitectureTemplateManager.js';
export { default as SecurityTemplateManager, createSecurityTemplateManager } from './SecurityTemplateManager.js';
export { default as IntegrationTemplateManager, createIntegrationTemplateManager } from './IntegrationTemplateManager.js';
export { default as MobileTemplateManager, createMobileTemplateManager } from './MobileTemplateManager.js';
export { default as DatabaseTemplateManager, createDatabaseTemplateManager } from './DatabaseTemplateManager.js';

// Integração
export { registerFase5Systems, defineFase5Schemas, initializeFase5Systems } from './registry-integration.js';
