/**
 * Exportações dos sistemas da FASE 2
 */

// Sistemas
export { default as IntelligentSequentialResolver, createIntelligentSequentialResolver } from './IntelligentSequentialResolver.js';
export { default as ScoreCalculator, createScoreCalculator } from './ScoreCalculator.js';
export { default as MultiEnvironmentCompatibilityAnalyzer, createMultiEnvironmentCompatibilityAnalyzer } from './MultiEnvironmentCompatibilityAnalyzer.js';
export { default as ForensicAnalyzer, createForensicAnalyzer } from './ForensicAnalyzer.js';
export { default as BatchResolver, createBatchResolver } from './BatchResolver.js';
export { default as CoverageCalculator, createCoverageCalculator } from './CoverageCalculator.js';

// Integração
export { registerFase2Systems, defineFase2Schemas, initializeFase2Systems } from './registry-integration.js';
