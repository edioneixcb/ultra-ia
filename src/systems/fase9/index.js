/**
 * Exportações dos sistemas da FASE 9
 */

export { default as PlatformDetector, createPlatformDetector } from './PlatformDetector.js';
export { default as PlatformSpecificGenerator, createPlatformSpecificGenerator } from './PlatformSpecificGenerator.js';
export { default as CrossPlatformValidator, createCrossPlatformValidator } from './CrossPlatformValidator.js';
export { default as PlatformTestRunner, createPlatformTestRunner } from './PlatformTestRunner.js';

export { registerFase9Systems, defineFase9Schemas, initializeFase9Systems } from './registry-integration.js';
