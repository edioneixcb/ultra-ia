/**
 * Exportações dos sistemas da FASE 1
 */

// Sistemas
export { default as DecisionClassifier, createDecisionClassifier } from './DecisionClassifier.js';
export { default as EvidenceLevelValidator, createEvidenceLevelValidator } from './EvidenceLevelValidator.js';
export { default as ChainOfThoughtValidator, createChainOfThoughtValidator } from './ChainOfThoughtValidator.js';
export { default as ProactiveAnticipationSystem, createProactiveAnticipationSystem } from './ProactiveAnticipationSystem.js';
export { default as InlineValidatedCodeGenerator, createInlineValidatedCodeGenerator } from './InlineValidatedCodeGenerator.js';
export { default as ErrorHandlingValidator, createErrorHandlingValidator } from './ErrorHandlingValidator.js';
export { default as LoggingValidator, createLoggingValidator } from './LoggingValidator.js';
export { default as TypeValidator, createTypeValidator } from './TypeValidator.js';
export { default as EnvironmentDetector, createEnvironmentDetector } from './EnvironmentDetector.js';
export { default as EvidenceChainManager, createEvidenceChainManager } from './EvidenceChainManager.js';
export { default as StaticAnalyzer, createStaticAnalyzer } from './StaticAnalyzer.js';
export { default as ConfigValidator, createConfigValidator } from './ConfigValidator.js';
export { default as TraceabilityMatrixManager, createTraceabilityMatrixManager } from './TraceabilityMatrixManager.js';

// Integração
export { registerFase1Systems, defineFase1Schemas, initializeFase1Systems } from './registry-integration.js';
