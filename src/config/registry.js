/**
 * System Registry Bootstrap
 * 
 * Configura e exporta o ComponentRegistry global com todos os componentes do sistema registrados.
 * Atua como o ponto central de Injeção de Dependência.
 */

import { createComponentRegistry } from '../core/ComponentRegistry.js';
import { loadConfig } from '../utils/ConfigLoader.js';
import { getLogger } from '../utils/Logger.js';
import { getErrorHandler } from '../utils/ErrorHandler.js';
import ExecutionPipeline from '../core/ExecutionPipeline.js';

// Infraestrutura Proativa
import EventBus from '../infrastructure/EventBus.js';
import PersistentStorage from '../infrastructure/PersistentStorage.js';
import ConfigWatcher from '../infrastructure/ConfigWatcher.js';

// Componentes Base
import DynamicKnowledgeBase from '../components/DynamicKnowledgeBase.js';
import PersistentContextManager from '../components/PersistentContextManager.js';
import RequirementAnalyzer from '../components/RequirementAnalyzer.js';
import HallucinationPreventionGenerator from '../components/HallucinationPreventionGenerator.js';
import MultiLayerValidator from '../components/MultiLayerValidator.js';
import ExecutionFeedbackSystem from '../systems/ExecutionFeedbackSystem.js';

// Novos Componentes (Fases 1 e 2)
import GoldExampleSearcher from '../knowledge/GoldExampleSearcher.js';
import AntiPatternManager from '../knowledge/AntiPatternManager.js';
import ESLintValidator from '../validation/ESLintValidator.js';
import ASTParser from '../validation/ASTParser.js';

// Multi-Agent (Fase 3)
import AgentOrchestrator from '../agents/AgentOrchestrator.js';
import ArchitectAgent from '../agents/agents/ArchitectAgent.js';
import CoderAgent from '../agents/agents/CoderAgent.js';
import ReviewerAgent from '../agents/agents/ReviewerAgent.js';
import SecurityAgent from '../agents/agents/SecurityAgent.js';
import PerformanceAgent from '../agents/agents/PerformanceAgent.js';
import UXAgent from '../agents/agents/UXAgent.js';
import TesterAgent from '../agents/agents/TesterAgent.js';
import AdversaryAgent from '../agents/agents/AdversaryAgent.js';

// Fase 0 (Fundação Absoluta)
import BaselineManager from '../systems/fase0/BaselineManager.js';
import AntiSkipMechanism from '../systems/fase0/AntiSkipMechanism.js';
import AbsoluteCertaintyAnalyzer from '../systems/fase0/AbsoluteCertaintyAnalyzer.js';
import CheckpointManager from '../systems/fase0/CheckpointManager.js';
import ThreeERuleValidator from '../systems/fase0/ThreeERuleValidator.js';
import CompleteContractAnalyzer from '../systems/fase0/CompleteContractAnalyzer.js';

// Fase 1 (Prevenção Proativa)
import StaticAnalyzer from '../systems/fase1/StaticAnalyzer.js';
import ConfigValidator from '../systems/fase1/ConfigValidator.js';
import DecisionClassifier from '../systems/fase1/DecisionClassifier.js';
import EvidenceLevelValidator from '../systems/fase1/EvidenceLevelValidator.js';
import ChainOfThoughtValidator from '../systems/fase1/ChainOfThoughtValidator.js';
import ProactiveAnticipationSystem from '../systems/fase1/ProactiveAnticipationSystem.js';
import InlineValidatedCodeGenerator from '../systems/fase1/InlineValidatedCodeGenerator.js';
import ErrorHandlingValidator from '../systems/fase1/ErrorHandlingValidator.js';
import LoggingValidator from '../systems/fase1/LoggingValidator.js';
import TypeValidator from '../systems/fase1/TypeValidator.js';
import EnvironmentDetector from '../systems/fase1/EnvironmentDetector.js';
import EvidenceChainManager from '../systems/fase1/EvidenceChainManager.js';
import TraceabilityMatrixManager from '../systems/fase1/TraceabilityMatrixManager.js';

// Fase 2 (Resolução Inteligente)
import { registerFase2Systems } from '../systems/fase2/registry-integration.js';
import { createIntelligentSequentialResolver } from '../systems/fase2/IntelligentSequentialResolver.js';
import { createScoreCalculator } from '../systems/fase2/ScoreCalculator.js';
import { createMultiEnvironmentCompatibilityAnalyzer } from '../systems/fase2/MultiEnvironmentCompatibilityAnalyzer.js';
import { createForensicAnalyzer } from '../systems/fase2/ForensicAnalyzer.js';
import { createBatchResolver } from '../systems/fase2/BatchResolver.js';
import { createCoverageCalculator } from '../systems/fase2/CoverageCalculator.js';

// Fase 3 (Qualidade e Validação)
import { createTestExpectationValidator } from '../systems/fase3/TestExpectationValidator.js';
import { createTestValidator } from '../systems/fase3/TestValidator.js';
import { createAccurateDocumentationSystem } from '../systems/fase3/AccurateDocumentationSystem.js';
import { createMetaValidationSystem } from '../systems/fase3/MetaValidationSystem.js';

// Fase 9 (Multi-plataforma)
import BrowserAutomation from '../utils/BrowserAutomation.js';
import EmulatorController from '../utils/EmulatorController.js';

// Inicializar Configuração e Logger
const configLoader = loadConfig();
const config = configLoader.get();
const logger = getLogger(config);
const errorHandler = getErrorHandler(config, logger);

// Criar Registry Global
const registry = createComponentRegistry({ logger, errorHandler });

// 1. Registrar Infraestrutura
registry.register('Config', () => config, []);
registry.register('Logger', () => logger, []);
registry.register('ErrorHandler', () => errorHandler, []);

// Infraestrutura Proativa
registry.register('EventBus', (cfg, log) => new EventBus(cfg, log), ['Config', 'Logger']);
registry.register('PersistentStorage', (cfg, log) => new PersistentStorage(cfg, log), ['Config', 'Logger']);
registry.register('ConfigWatcher', (cfg, log) => {
  const watcher = new ConfigWatcher(cfg, log);
  if (cfg?.proactive?.configWatcher?.enabled !== false) {
    watcher.start();
  }
  return watcher;
}, ['Config', 'Logger']);

// 2. Registrar Componentes Base
registry.register('KnowledgeBase', 
  (cfg, log) => new DynamicKnowledgeBase(cfg, log), 
  ['Config', 'Logger']
);

registry.register('ContextManager', 
  (cfg, log) => new PersistentContextManager(cfg, log), 
  ['Config', 'Logger']
);

registry.register('RequirementAnalyzer', 
  (cfg, log) => new RequirementAnalyzer(cfg, log), 
  ['Config', 'Logger']
);

registry.register('Generator', 
  (cfg, log, err, kb) => new HallucinationPreventionGenerator(cfg, log, err, kb), 
  ['Config', 'Logger', 'ErrorHandler', 'KnowledgeBase']
);

registry.register('Validator', 
  (cfg, log, err) => new MultiLayerValidator(cfg, log, err), 
  ['Config', 'Logger', 'ErrorHandler']
);

registry.register('ExecutionSystem', 
  (cfg, log, err) => new ExecutionFeedbackSystem(cfg, log, err), 
  ['Config', 'Logger', 'ErrorHandler']
);

// 3. Registrar Novos Componentes (RAG + Validação Real)
registry.register('GoldExampleSearcher', (cfg, log) => new GoldExampleSearcher(cfg, log), ['Config', 'Logger']);
registry.register('AntiPatternManager', (cfg, log) => new AntiPatternManager(cfg, log), ['Config', 'Logger']);
registry.register('ESLintValidator', (cfg, log) => new ESLintValidator(cfg, log), ['Config', 'Logger']);
registry.register('ASTParser', (cfg, log) => new ASTParser(cfg, log), ['Config', 'Logger']);

// 4. Registrar Agentes
const agents = {
  'ArchitectAgent': ArchitectAgent,
  'CoderAgent': CoderAgent,
  'ReviewerAgent': ReviewerAgent,
  'SecurityAgent': SecurityAgent,
  'PerformanceAgent': PerformanceAgent,
  'UXAgent': UXAgent,
  'TesterAgent': TesterAgent,
  'AdversaryAgent': AdversaryAgent
};

Object.entries(agents).forEach(([name, Class]) => {
  registry.register(name, (cfg, log, gen) => new Class(cfg, log, gen), ['Config', 'Logger', 'Generator']);
});

// 5. Registrar Orquestrador
registry.register('AgentOrchestrator', 
  (cfg, log) => {
    const orchestrator = new AgentOrchestrator(cfg, log);
    // Registrar agentes no orquestrador
    Object.keys(agents).forEach(agentName => {
      orchestrator.registerAgent(agentName, registry.get(agentName));
    });
    return orchestrator;
  },
  ['Config', 'Logger']
);

// 6. Sistemas da Fase 0 (Fundação Absoluta)
registry.register('BaselineManager', (cfg, log) => new BaselineManager(cfg, log), ['Config', 'Logger']);
registry.register('AntiSkipMechanism', (cfg, log) => new AntiSkipMechanism(cfg, log), ['Config', 'Logger']);
registry.register('ThreeERuleValidator', (cfg, log) => new ThreeERuleValidator(cfg, log), ['Config', 'Logger']);
registry.register('CheckpointManager', (cfg, log) => new CheckpointManager(cfg, log), ['Config', 'Logger']);
registry.register('CompleteContractAnalyzer', (cfg, log) => new CompleteContractAnalyzer(cfg, log), ['Config', 'Logger']);

// AbsoluteCertaintyAnalyzer recebe ASTParser injetado
registry.register('AbsoluteCertaintyAnalyzer', 
  (cfg, log, err, parser) => new AbsoluteCertaintyAnalyzer(cfg, log, err, parser), 
  ['Config', 'Logger', 'ErrorHandler', 'ASTParser']
);

// 7. Sistemas da Fase 1 (Prevenção Proativa) - Registro Condicional Seguro
// Verifica flag para integração (default true se não especificado)
const enableFase1 = config?.features?.enableFase1Integration !== false;

if (enableFase1) {
  // Sistemas sem dependências extras ou com dependências base
  registry.register('DecisionClassifier', (cfg, log, err) => new DecisionClassifier(cfg, log, err), ['Config', 'Logger', 'ErrorHandler']);
  registry.register('EvidenceLevelValidator', (cfg, log, err) => new EvidenceLevelValidator(cfg, log, err), ['Config', 'Logger', 'ErrorHandler']);
  registry.register('ChainOfThoughtValidator', (cfg, log, err) => new ChainOfThoughtValidator(cfg, log, err), ['Config', 'Logger', 'ErrorHandler']);
  registry.register('ErrorHandlingValidator', (cfg, log, err) => new ErrorHandlingValidator(cfg, log, err), ['Config', 'Logger', 'ErrorHandler']);
  registry.register('LoggingValidator', (cfg, log, err) => new LoggingValidator(cfg, log, err), ['Config', 'Logger', 'ErrorHandler']);
  registry.register('ConfigValidator', (cfg, log, err) => new ConfigValidator(cfg, log, err), ['Config', 'Logger', 'ErrorHandler']);
  registry.register('EvidenceChainManager', (cfg, log, err) => new EvidenceChainManager(cfg, log, err), ['Config', 'Logger', 'ErrorHandler']);
  registry.register('TraceabilityMatrixManager', (cfg, log, err) => new TraceabilityMatrixManager(cfg, log, err), ['Config', 'Logger', 'ErrorHandler']);

  // Sistemas com ASTParser (opcional via fallback)
  registry.register('StaticAnalyzer', 
    (cfg, log, err, parser) => new StaticAnalyzer(cfg, log, err, parser || null), 
    ['Config', 'Logger', 'ErrorHandler', 'ASTParser'] // ASTParser opcional
  );
  
  registry.register('TypeValidator', 
    (cfg, log, err, parser) => new TypeValidator(cfg, log, err, parser || null), 
    ['Config', 'Logger', 'ErrorHandler', 'ASTParser'] // ASTParser opcional
  );

  // Sistemas com BaselineManager (opcional via fallback)
  registry.register('ProactiveAnticipationSystem', 
    (cfg, log, err, baseline) => new ProactiveAnticipationSystem(cfg, log, err, baseline || null), 
    ['Config', 'Logger', 'ErrorHandler', 'BaselineManager'] // BaselineManager opcional
  );
  
  registry.register('EnvironmentDetector', 
    (cfg, log, err, baseline) => new EnvironmentDetector(cfg, log, err, baseline || null), 
    ['Config', 'Logger', 'ErrorHandler', 'BaselineManager'] // BaselineManager opcional
  );

  // Sistemas com Generator (opcional via fallback)
  registry.register('InlineValidatedCodeGenerator', 
    (cfg, log, err, gen) => new InlineValidatedCodeGenerator(cfg, log, err, gen || null), 
    ['Config', 'Logger', 'ErrorHandler', 'Generator'] // Generator opcional
  );
}

// 8. Sistemas da Fase 2 (Resolução Inteligente) - Registro Condicional com Feature Flag
// Verifica flag para integração (default false para rollout gradual)
const enableFase2 = config?.features?.enableFase2Integration === true;

if (enableFase2) {
  logger?.info('Integrando sistemas da FASE 2 no registry principal');
  
  // Registrar sistemas da Fase 2 com dependências opcionais corretas
  registry.register('IntelligentSequentialResolver', 
    (cfg, log, err, astParser, baselineManager) => {
      // DockerSandbox será obtido via lazy loading dentro do IntelligentSequentialResolver se necessário
      return createIntelligentSequentialResolver(cfg, log, err, astParser || null, baselineManager || null);
    }, 
    ['Config', 'Logger', 'ErrorHandler', '?ASTParser', '?BaselineManager']
  );
  
  registry.register('ScoreCalculator', 
    () => createScoreCalculator(config, logger, errorHandler), 
    ['Config', 'Logger', 'ErrorHandler']
  );
  
  registry.register('MultiEnvironmentCompatibilityAnalyzer', 
    (cfg, log, err, envDetector) => createMultiEnvironmentCompatibilityAnalyzer(cfg, log, err, envDetector || null), 
    ['Config', 'Logger', 'ErrorHandler', '?EnvironmentDetector']
  );
  
  registry.register('ForensicAnalyzer', 
    (cfg, log, err, absoluteCertainty, evidenceChain) => createForensicAnalyzer(cfg, log, err, absoluteCertainty || null, evidenceChain || null), 
    ['Config', 'Logger', 'ErrorHandler', '?AbsoluteCertaintyAnalyzer', '?EvidenceChainManager']
  );
  
  registry.register('BatchResolver', 
    () => createBatchResolver(config, logger, errorHandler), 
    ['Config', 'Logger', 'ErrorHandler']
  );
  
  registry.register('CoverageCalculator', 
    () => createCoverageCalculator(config, logger, errorHandler), 
    ['Config', 'Logger', 'ErrorHandler']
  );
  
  logger?.info('Sistemas da FASE 2 registrados com sucesso');
} else {
  logger?.debug('Integração da FASE 2 desabilitada (enableFase2Integration = false)');
}

// 9. Sistemas da Fase 3 (Qualidade e Validação) - Registro Condicional com Feature Flag
// Verifica flag para integração (default false para rollout gradual)
const enableFase3 = config?.features?.enableFase3Integration === true;

if (enableFase3) {
  logger?.info('Integrando sistemas da FASE 3 no registry principal');
  
  // Registrar sistemas da Fase 3 com dependências opcionais corretas
  registry.register('TestExpectationValidator', 
    (cfg, log, err, threeERuleValidator) => createTestExpectationValidator(cfg, log, err, threeERuleValidator || null), 
    ['Config', 'Logger', 'ErrorHandler', '?ThreeERuleValidator']
  );
  
  registry.register('TestValidator', 
    (cfg, log, err, testExpectationValidator) => createTestValidator(cfg, log, err, testExpectationValidator || null), 
    ['Config', 'Logger', 'ErrorHandler', '?TestExpectationValidator']
  );
  
  registry.register('AccurateDocumentationSystem', 
    (cfg, log, err, evidenceChainManager, astParser) => createAccurateDocumentationSystem(cfg, log, err, evidenceChainManager || null, astParser || null), 
    ['Config', 'Logger', 'ErrorHandler', '?EvidenceChainManager', '?ASTParser']
  );
  
  registry.register('MetaValidationSystem', 
    () => createMetaValidationSystem(config, logger, errorHandler), 
    ['Config', 'Logger', 'ErrorHandler']
  );
  
  logger?.info('Sistemas da FASE 3 registrados com sucesso');
} else {
  logger?.debug('Integração da FASE 3 desabilitada (enableFase3Integration = false)');
}

// 9. Sistemas da Fase 9 (Multi-plataforma) - Registro Condicional
const enableBrowserAutomation = config?.fase9?.browserAutomation?.enabled !== false;
const enableEmulatorController = config?.fase9?.emulatorController?.enabled !== false;

if (enableBrowserAutomation) {
  registry.register('BrowserAutomation', (cfg, log, err) => new BrowserAutomation(cfg, log, err), ['Config', 'Logger', 'ErrorHandler']);
}

if (enableEmulatorController) {
  registry.register('EmulatorController', (cfg, log, err) => new EmulatorController(cfg, log, err), ['Config', 'Logger', 'ErrorHandler']);
}

// 10. Configurar Pipeline
const pipeline = new ExecutionPipeline(registry);
pipeline.addStage('Initialization', ['KnowledgeBase', 'ContextManager']);
if (enableFase1) {
  pipeline.addStage('ProactiveAnalysis', ['StaticAnalyzer', 'ConfigValidator', 'ProactiveAnticipationSystem']);
}
pipeline.addStage('Analysis', ['RequirementAnalyzer']);
pipeline.addStage('Generation', ['Generator']); // ou AgentOrchestrator dependendo do modo
pipeline.addStage('Validation', ['Validator', 'ESLintValidator']);

// Adicionar estágio de resolução se Fase 2 habilitada
if (enableFase2) {
  pipeline.addStage('Resolution', ['IntelligentSequentialResolver', 'BatchResolver', 'ForensicAnalyzer'], { conditional: true });
  logger?.debug('Estágio Resolution adicionado ao pipeline');
}

// Adicionar estágio de qualidade se Fase 3 habilitada
if (enableFase3) {
  pipeline.addStage('Quality', ['TestValidator', 'AccurateDocumentationSystem', 'MetaValidationSystem'], { conditional: true });
  logger?.debug('Estágio Quality adicionado ao pipeline');
}

registry.register('ExecutionPipeline', () => pipeline, []);

export default registry;
