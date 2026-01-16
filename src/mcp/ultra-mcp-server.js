#!/usr/bin/env node
/**
 * Sistema Ultra MCP Server
 * 
 * Integra o Sistema Ultra com o Cursor IDE via Model Context Protocol.
 * Expõe todas as funcionalidades do Sistema Ultra como ferramentas MCP.
 * 
 * Funcionalidades expostas:
 * - Geração de código completo
 * - Análise de requisitos
 * - Indexação de codebase
 * - Busca na Knowledge Base
 * - Validação de código
 * - Execução de código
 * - Gerenciamento de contexto
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getUltraSystem } from '../systems/UltraSystem.js';
import { loadConfig } from '../utils/ConfigLoader.js';
import { getLogger } from '../utils/Logger.js';
import { getInterceptorLayer } from '../proactive/InterceptorLayer.js';
import { getCognitiveContextEngine } from '../cognitive/CognitiveContextEngine.js';
import { getAgentMemoryBridge } from '../memory/AgentMemoryBridge.js';
import { getMutationSelfHealing } from '../healing/MutationSelfHealing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar configuração
const configPath = process.env.ULTRA_CONFIG_PATH || join(__dirname, '../../config/config.json');
const configLoader = loadConfig(configPath);
const config = configLoader.get();
const logger = getLogger(config);
const ultraSystem = getUltraSystem(config, logger);

class UltraMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'ultra-system',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.interceptorLayer = getInterceptorLayer(config, logger);
    this.cognitiveEngine = getCognitiveContextEngine(config, logger);
    this.memoryBridge = getAgentMemoryBridge(config, logger);
    this.selfHealer = getMutationSelfHealing(config, logger);
    this.setupHandlers();
  }

  setupHandlers() {
    // Listar ferramentas disponíveis
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'ultra_generate_code',
            description: 'Gera código completo usando Sistema Ultra (análise, geração, validação, execução). Retorna código validado e testado.',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'Descrição do código a ser gerado (ex: "Criar função para validar email")',
                },
                language: {
                  type: 'string',
                  enum: ['javascript', 'python', 'typescript', 'js', 'py', 'ts'],
                  description: 'Linguagem do código',
                  default: 'javascript',
                },
                sessionId: {
                  type: 'string',
                  description: 'ID da sessão para manter contexto (padrão: "cursor-session")',
                  default: 'cursor-session',
                },
                expectedOutput: {
                  type: 'string',
                  description: 'Output esperado para validação (opcional)',
                },
                maxIterations: {
                  type: 'number',
                  description: 'Máximo de iterações de refinamento (padrão: 10)',
                  default: 10,
                },
              },
              required: ['prompt'],
            },
          },
          {
            name: 'ultra_analyze_requirements',
            description: 'Analisa requisitos e identifica ambiguidades, requisitos faltantes e sugestões de melhoria',
            inputSchema: {
              type: 'object',
              properties: {
                requirements: {
                  type: 'string',
                  description: 'Texto dos requisitos a analisar',
                },
              },
              required: ['requirements'],
            },
          },
          {
            name: 'ultra_index_codebase',
            description: 'Indexa codebase para Knowledge Base (permite busca de padrões e exemplos)',
            inputSchema: {
              type: 'object',
              properties: {
                codebasePath: {
                  type: 'string',
                  description: 'Caminho do codebase a indexar',
                },
              },
              required: ['codebasePath'],
            },
          },
          {
            name: 'ultra_search_knowledge',
            description: 'Busca funções, classes ou padrões na Knowledge Base',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Query de busca (ex: "função validar email")',
                },
                topK: {
                  type: 'number',
                  description: 'Número máximo de resultados',
                  default: 5,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'ultra_validate_code',
            description: 'Valida código em múltiplas camadas (sintaxe, estrutura, segurança, boas práticas)',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Código a validar',
                },
                language: {
                  type: 'string',
                  enum: ['javascript', 'python', 'typescript', 'js', 'py', 'ts'],
                  description: 'Linguagem do código',
                  default: 'javascript',
                },
              },
              required: ['code', 'language'],
            },
          },
          {
            name: 'ultra_execute_code',
            description: 'Executa código em sandbox isolado (Docker) e retorna resultado',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Código a executar',
                },
                language: {
                  type: 'string',
                  enum: ['javascript', 'python', 'typescript', 'js', 'py', 'ts'],
                  description: 'Linguagem do código',
                  default: 'javascript',
                },
                expectedOutput: {
                  type: 'string',
                  description: 'Output esperado para validação (opcional)',
                },
              },
              required: ['code', 'language'],
            },
          },
          {
            name: 'ultra_get_context',
            description: 'Obtém contexto persistente de uma sessão',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'ID da sessão',
                  default: 'cursor-session',
                },
                maxTokens: {
                  type: 'number',
                  description: 'Máximo de tokens (padrão: 5000)',
                  default: 5000,
                },
              },
            },
          },
          {
            name: 'ultra_get_stats',
            description: 'Obtém estatísticas do sistema (Knowledge Base, execuções, contexto)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'ultra_analyze_impact',
            description: 'Analisa impacto de mudança em arquivo específico',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Caminho do arquivo modificado'
                },
                depth: {
                  type: 'number',
                  description: 'Profundidade de análise (1-5)',
                  default: 3
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'ultra_get_agent_memory',
            description: 'Recupera memórias de um agente específico',
            inputSchema: {
              type: 'object',
              properties: {
                agentName: {
                  type: 'string',
                  description: 'Nome do agente'
                },
                memoryType: {
                  type: 'string',
                  description: 'Tipo da memória (decision, error, success, pattern)'
                }
              },
              required: ['agentName']
            }
          },
          {
            name: 'ultra_run_guardians',
            description: 'Executa guardiões preditivos em código',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Código a analisar'
                },
                runDependencyScan: {
                  type: 'boolean',
                  description: 'Executar scan de dependências',
                  default: false
                }
              },
              required: ['code']
            }
          },
          {
            name: 'ultra_self_heal',
            description: 'Tenta auto-corrigir código com erros',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Código com erro'
                },
                error: {
                  type: 'string',
                  description: 'Mensagem de erro'
                },
                maxMutations: {
                  type: 'number',
                  default: 5
                }
              },
              required: ['code', 'error']
            }
          },
        ],
      };
    });

    // Executar ferramentas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const interception = await this.interceptorLayer.analyze(name, args);
        if (interception.blocked) {
          return {
            content: [
              {
                type: 'text',
                text: interception.reason || 'Bloqueado por interceptação'
              }
            ],
            isError: true
          };
        }
        let result;

        switch (name) {
          case 'ultra_generate_code':
            result = await this.generateCode(args);
            break;
          case 'ultra_analyze_requirements':
            result = await this.analyzeRequirements(args);
            break;
          case 'ultra_index_codebase':
            result = await this.indexCodebase(args);
            break;
          case 'ultra_search_knowledge':
            result = await this.searchKnowledge(args);
            break;
          case 'ultra_validate_code':
            result = await this.validateCode(args);
            break;
          case 'ultra_execute_code':
            result = await this.executeCode(args);
            break;
          case 'ultra_get_context':
            result = await this.getContext(args);
            break;
          case 'ultra_get_stats':
            result = await this.getStats(args);
            break;
          case 'ultra_analyze_impact':
            result = await this.analyzeImpact(args);
            break;
          case 'ultra_get_agent_memory':
            result = await this.getAgentMemory(args);
            break;
          case 'ultra_run_guardians':
            result = await this.runGuardians(args);
            break;
          case 'ultra_self_heal':
            result = await this.selfHeal(args);
            break;
          default:
            throw new Error(`Ferramenta desconhecida: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger?.error('Erro em ferramenta MCP', {
          tool: name,
          error: error.message,
          stack: error.stack
        });

        return {
          content: [
            {
              type: 'text',
              text: `Erro: ${error.message}\n\nDetalhes: ${error.stack || 'N/A'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Gera código completo
   */
  async generateCode(args) {
    const {
      prompt,
      language = 'javascript',
      sessionId = 'cursor-session',
      expectedOutput = null,
      maxIterations = 10,
    } = args;

    const result = await ultraSystem.process(prompt, {
      sessionId,
      language,
      expectedOutput,
      maxIterations,
      enableRefinement: true,
    });

    if (result.success && result.result) {
      return `✅ Código gerado com sucesso!\n\n` +
             `Linguagem: ${result.result.language}\n` +
             `Iterações: ${result.iterations}\n` +
             `Duração: ${(result.duration / 1000).toFixed(2)}s\n` +
             `Score de Validação: ${result.result.validation.score}/100\n` +
             `${result.result.execution.success ? '✅ Execução bem-sucedida' : '⚠️ Execução com erros'}\n` +
             `${result.result.execution.stdout ? `Output: ${result.result.execution.stdout}` : ''}\n\n` +
             `\`\`\`${result.result.language}\n${result.result.code}\n\`\`\``;
    } else {
      return `❌ Erro ao gerar código:\n${result.error?.message || 'Erro desconhecido'}\n\n` +
             `Sugestões: ${result.error?.suggestions?.join(', ') || 'Nenhuma'}`;
    }
  }

  /**
   * Analisa requisitos
   */
  async analyzeRequirements(args) {
    const { requirements } = args;
    const analyzer = ultraSystem.requirementAnalyzer;
    const analysis = analyzer.analyze(requirements);

    return `Análise de Requisitos:\n\n` +
           `Válido: ${analysis.valid ? '✅' : '❌'}\n` +
           `Completude: ${(analysis.completeness * 100).toFixed(1)}%\n` +
           `Ambiguidades: ${analysis.ambiguities.length}\n` +
           `Requisitos Faltantes: ${analysis.missingRequirements.length}\n\n` +
           `${analysis.errors.length > 0 ? `Erros:\n${analysis.errors.map(e => `- ${e}`).join('\n')}\n\n` : ''}` +
           `${analysis.warnings.length > 0 ? `Avisos:\n${analysis.warnings.map(w => `- ${w}`).join('\n')}\n\n` : ''}` +
           `${analysis.suggestions.length > 0 ? `Sugestões:\n${analysis.suggestions.map(s => `- ${s}`).join('\n')}` : ''}`;
  }

  /**
   * Indexa codebase
   */
  async indexCodebase(args) {
    const { codebasePath } = args;
    const stats = await ultraSystem.indexCodebase(codebasePath);

    return `✅ Codebase indexado com sucesso!\n\n` +
           `Arquivos indexados: ${stats.filesIndexed}\n` +
           `Funções encontradas: ${stats.totalFunctions}\n` +
           `Classes encontradas: ${stats.totalClasses}\n` +
           `Total de arquivos: ${stats.totalFiles}`;
  }

  /**
   * Busca na Knowledge Base
   */
  async searchKnowledge(args) {
    const { query, topK = 5 } = args;
    const results = await ultraSystem.knowledgeBase.search(query, topK);

    if (results.length === 0) {
      return `Nenhum resultado encontrado para "${query}"`;
    }

    return `Resultados encontrados (${results.length}):\n\n` +
           results.map((r, i) => 
             `${i + 1}. ${r.type === 'function' ? 'Função' : 'Classe'}: ${r.name}\n` +
             `   Arquivo: ${r.file}\n` +
             `   Linguagem: ${r.language}\n` +
             `   Similaridade: ${(r.similarity * 100).toFixed(1)}%\n` +
             `   \`\`\`${r.language}\n${r.code.substring(0, 200)}${r.code.length > 200 ? '...' : ''}\n\`\`\``
           ).join('\n\n');
  }

  /**
   * Valida código
   */
  async validateCode(args) {
    const { code, language = 'javascript' } = args;
    const validator = ultraSystem.validator;
    const validation = await validator.validate(code, { language });

    return `Validação Multi-Camadas:\n\n` +
           `Válido: ${validation.valid ? '✅' : '❌'}\n` +
           `Score: ${validation.score}/100\n` +
           `Camadas Verificadas: ${validation.metadata.layersChecked.join(', ')}\n` +
           `Total de Problemas: ${validation.metadata.totalIssues}\n\n` +
           `${validation.errors.length > 0 ? `Erros:\n${validation.errors.map(e => `- ${e}`).join('\n')}\n\n` : ''}` +
           `${validation.warnings.length > 0 ? `Avisos:\n${validation.warnings.map(w => `- ${w}`).join('\n')}\n\n` : ''}` +
           `${validation.suggestions.length > 0 ? `Sugestões:\n${validation.suggestions.map(s => `- ${s}`).join('\n')}` : ''}`;
  }

  /**
   * Executa código
   */
  async executeCode(args) {
    const {
      code,
      language = 'javascript',
      expectedOutput = null,
    } = args;

    const executionSystem = ultraSystem.executionSystem;
    const result = await executionSystem.execute(code, {
      language,
      sessionId: 'cursor-session',
      expectedOutput,
    });

    return `Execução em Sandbox:\n\n` +
           `Sucesso: ${result.success ? '✅' : '❌'}\n` +
           `Exit Code: ${result.exitCode}\n` +
           `${result.stdout ? `Output:\n${result.stdout}\n` : ''}` +
           `${result.stderr ? `Erros:\n${result.stderr}\n` : ''}` +
           `${result.matchesExpected !== null ? `\nOutput corresponde ao esperado: ${result.matchesExpected ? '✅' : '❌'}` : ''}` +
           `${result.errors.length > 0 ? `\n\nErros detectados:\n${result.errors.map(e => `- ${e}`).join('\n')}` : ''}` +
           `${result.suggestions.length > 0 ? `\n\nSugestões:\n${result.suggestions.map(s => `- ${s}`).join('\n')}` : ''}`;
  }

  /**
   * Obtém contexto
   */
  async getContext(args) {
    const {
      sessionId = 'cursor-session',
      maxTokens = 5000,
    } = args;

    const contextManager = ultraSystem.contextManager;
    const context = await contextManager.getFormattedContext(sessionId, maxTokens);

    if (context.length === 0) {
      return `Nenhum contexto encontrado para sessão "${sessionId}"`;
    }

    return `Contexto da Sessão "${sessionId}":\n\n` +
           context.map((msg, i) => 
             `${i + 1}. [${msg.role.toUpperCase()}]\n${msg.content.substring(0, 500)}${msg.content.length > 500 ? '...' : ''}`
           ).join('\n\n');
  }

  /**
   * Obtém estatísticas
   */
  async getStats(args) {
    const stats = ultraSystem.getStats();

    return `Estatísticas do Sistema Ultra:\n\n` +
           `Knowledge Base:\n` +
           `  - Funções: ${stats.knowledgeBase.functions}\n` +
           `  - Classes: ${stats.knowledgeBase.classes}\n` +
           `  - Arquivos: ${stats.knowledgeBase.files}\n` +
           `  - Exemplos Positivos: ${stats.knowledgeBase.goldExamples || 0}\n` +
           `  - Anti-padrões: ${stats.knowledgeBase.antiPatterns || 0}\n\n` +
           `Contexto:\n` +
           `  - Sessões Ativas: ${stats.context.sessions}\n\n` +
           `Execução:\n` +
           `  - Total: ${stats.execution.total}\n` +
           `  - Taxa de Sucesso: ${stats.execution.successRate.toFixed(1)}%\n` +
           `  - Duração Média: ${stats.execution.averageDuration?.toFixed(0) || 0}ms`;
  }

  /**
   * Analisa impacto de arquivo
   */
  async analyzeImpact(args) {
    const { filePath, depth = 3 } = args;
    const result = this.cognitiveEngine.analyzeImpact(filePath, depth);
    return `Impacto analisado:\n\n` +
           `Arquivo: ${filePath}\n` +
           `Profundidade: ${depth}\n` +
           `Arquivos impactados: ${result.impactedFiles.length}\n` +
           `${result.impactedFiles.map(f => `- ${f}`).join('\n')}`;
  }

  /**
   * Recupera memória de agente
   */
  async getAgentMemory(args) {
    const { agentName, memoryType = null } = args;
    const memories = this.memoryBridge.recall(agentName, memoryType, 10);
    return `Memórias de ${agentName}:\n\n` +
           `Total: ${memories.length}\n` +
           memories.map((m, i) => `${i + 1}. [${m.memoryType}] ${m.content}`).join('\n');
  }

  /**
   * Executa guardiões preditivos
   */
  async runGuardians(args) {
    const { code, runDependencyScan = false } = args;
    const validation = await ultraSystem.validator.validate(code, {
      layers: ['guardians'],
      runDependencyScan
    });
    return `Guardiões executados:\n\n` +
           `Válido: ${validation.valid ? '✅' : '❌'}\n` +
           `Score: ${validation.score}/100\n` +
           `${validation.errors.length ? `Erros: ${validation.errors.join('; ')}\n` : ''}` +
           `${validation.warnings.length ? `Avisos: ${validation.warnings.join('; ')}\n` : ''}`;
  }

  /**
   * Tenta auto-correção via self-healing
   */
  async selfHeal(args) {
    const { code, error, maxMutations = 5 } = args;
    const result = await this.selfHealer.heal(code, error, { maxMutations });
    if (!result.success) {
      return `Self-healing falhou após ${result.attempts} tentativas.`;
    }
    return `Self-healing bem-sucedido:\n\n\`\`\`javascript\n${result.code}\n\`\`\``;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger?.info('Sistema Ultra MCP Server rodando');
    console.error('Sistema Ultra MCP Server conectado ao Cursor');
  }
}

const server = new UltraMCPServer();
server.run().catch((error) => {
  console.error('Erro ao iniciar servidor MCP:', error);
  process.exit(1);
});
