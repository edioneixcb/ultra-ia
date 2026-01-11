/**
 * Exportações dos sistemas da FASE 4
 */

// Sistemas
export { default as KnowledgeBaseIndexer, createKnowledgeBaseIndexer } from './KnowledgeBaseIndexer.js';
export { default as KnowledgeBaseManager, createKnowledgeBaseManager } from './KnowledgeBaseManager.js';
export { default as PatternDocumentationSystem, createPatternDocumentationSystem } from './PatternDocumentationSystem.js';
export { default as TemplateGenerator, createTemplateGenerator } from './TemplateGenerator.js';

// Integração
export { registerFase4Systems, defineFase4Schemas, initializeFase4Systems } from './registry-integration.js';
