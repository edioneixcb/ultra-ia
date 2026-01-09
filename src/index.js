/**
 * Ponto de Entrada Principal do Sistema Ultra
 * 
 * Inicializa e exporta o UltraSystem para uso.
 */

import { loadConfig } from './utils/ConfigLoader.js';
import { getLogger } from './utils/Logger.js';
import { getErrorHandler } from './utils/ErrorHandler.js';
import { getAsyncErrorHandler } from './utils/AsyncErrorHandler.js';
import { getUltraSystem } from './systems/UltraSystem.js';

// Inicializar sistema
const configLoader = loadConfig();
const config = configLoader.get();
const logger = getLogger(config);
const errorHandler = getErrorHandler(config, logger);

// Registrar handlers globais de erros assíncronos ANTES de inicializar outros componentes
const asyncErrorHandler = getAsyncErrorHandler(config, logger, errorHandler);
asyncErrorHandler.register();

const ultraSystem = getUltraSystem(config, logger, errorHandler);

// Exportar componentes principais
export {
  ultraSystem,
  config,
  logger,
  errorHandler,
  configLoader,
  asyncErrorHandler
};

// Exportar UltraSystem como default
export default ultraSystem;

// Se executado diretamente, mostrar informações
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Sistema Ultra de IA Offline');
  console.log('================================\n');
  console.log('Componentes inicializados:');
  console.log('  ✅ Config System');
  console.log('  ✅ Logger');
  console.log('  ✅ Error Handler');
  console.log('  ✅ Requirement Analyzer');
  console.log('  ✅ Knowledge Base');
  console.log('  ✅ Context Manager');
  console.log('  ✅ Code Generator');
  console.log('  ✅ Multi-Layer Validator');
  console.log('  ✅ Execution Feedback System');
  console.log('  ✅ Ultra System\n');
  
  const stats = ultraSystem.getStats();
  console.log('Estatísticas:');
  console.log(`  Knowledge Base: ${stats.knowledgeBase.functions} funções, ${stats.knowledgeBase.classes} classes`);
  console.log(`  Context Sessions: ${stats.context.sessions}`);
  console.log('\nSistema pronto para uso!');
  console.log('\nExemplo de uso:');
  console.log('  import ultraSystem from "./src/index.js";');
  console.log('  const result = await ultraSystem.process("Criar função para validar email");');
}
