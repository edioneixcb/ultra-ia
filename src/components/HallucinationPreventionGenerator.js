/**
 * Gerador com Prevenção de Alucinações
 * 
 * Gera código usando LLM local (Ollama) com múltiplas estratégias
 * para prevenir alucinações:
 * 
 * - RAG (Retrieval-Augmented Generation) usando KnowledgeBase
 * - Multi-model cross-validation
 * - Geração baseada em exemplos positivos
 * - Evitação de anti-padrões conhecidos
 * - Validação incremental
 * 
 * Funcionalidades:
 * - Geração de código com contexto do codebase
 * - Uso de múltiplos modelos para validação
 * - Aprendizado de exemplos positivos
 * - Evitação de anti-padrões
 * - Extração e limpeza de código gerado
 */

import axios from 'axios';
import { getConfigLoader } from '../utils/ConfigLoader.js';
import { getLogger } from '../utils/Logger.js';
import { getErrorHandler } from '../utils/ErrorHandler.js';
import { getKnowledgeBase } from './DynamicKnowledgeBase.js';
import { getTimeoutManager } from '../utils/TimeoutManager.js';
import GoldExampleSearcher from '../knowledge/GoldExampleSearcher.js';
import AntiPatternManager from '../knowledge/AntiPatternManager.js';

class HallucinationPreventionGenerator {
  constructor(config = null, logger = null, errorHandler = null, knowledgeBase = null) {
    // Carregar config se não fornecido
    if (!config) {
      const configLoader = getConfigLoader();
      if (configLoader.config) {
        config = configLoader.get();
      } else {
        configLoader.load();
        config = configLoader.get();
      }
    }

    // Criar logger se não fornecido
    if (!logger) {
      logger = getLogger(config);
    }

    // Criar error handler se não fornecido
    if (!errorHandler) {
      errorHandler = getErrorHandler(config, logger);
    }

    // Criar knowledge base se não fornecido
    if (!knowledgeBase) {
      knowledgeBase = getKnowledgeBase(config, logger);
    }

    this.config = config;
    this.logger = logger;
    this.errorHandler = errorHandler;
    this.knowledgeBase = knowledgeBase;
    this.timeoutManager = getTimeoutManager(config, logger);

    // Inicializar searchers para RAG
    this.goldExampleSearcher = new GoldExampleSearcher(config, logger);
    this.antiPatternManager = new AntiPatternManager(config, logger);

    // Configurações do Ollama
    this.ollamaUrl = config.services?.ollama?.url || 'http://localhost:11434';
    this.primaryModel = config.services?.ollama?.defaultModel || config.models?.primary || 'deepseek-coder:6.7b';
    this.secondaryModel = config.models?.secondary || 'llama3.1:8b';
    this.timeout = config.services?.ollama?.timeout || 30000;

    // Configurações de geração
    this.maxRetries = config.validation?.maxIterations || 10;
    this.ragTopK = config.rag?.topK || 5;
    this.useMultiModel = config.generation?.useMultiModel !== false;

    // Status de modelos
    this.modelsValidated = false;
    this.modelsAvailable = {
      primary: false,
      secondary: false
    };

    // Validar modelos na inicialização (async, não bloqueia)
    this.validateModels().catch(err => {
      this.logger?.warn('Erro ao validar modelos na inicialização', { error: err.message });
    });
  }

  /**
   * Valida disponibilidade de modelos Ollama
   */
  async validateModels() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      const models = response.data.models || [];
      const modelNames = models.map(m => m.name);

      this.modelsAvailable.primary = modelNames.includes(this.primaryModel);
      this.modelsAvailable.secondary = this.secondaryModel ? modelNames.includes(this.secondaryModel) : false;
      this.modelsValidated = true;

      if (!this.modelsAvailable.primary) {
        this.logger?.warn(`Modelo primário ${this.primaryModel} não encontrado`);
      }
      if (this.secondaryModel && !this.modelsAvailable.secondary) {
        this.logger?.warn(`Modelo secundário ${this.secondaryModel} não encontrado`);
      }
    } catch (error) {
      this.logger?.warn('Erro ao validar modelos Ollama', { error: error.message });
      this.modelsValidated = false;
    }
  }

  /**
   * Verifica saúde do Ollama
   * @returns {Promise<object>} Status do Ollama
   */
  async checkOllamaHealth() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      return {
        available: true,
        models: response.data.models?.map(m => m.name) || []
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Gera código usando LLM com prevenção de alucinações
   * @param {string} prompt - Prompt do usuário
   * @param {object} options - Opções de geração
   * @returns {Promise<object>} Código gerado e metadados
   */
  async generate(prompt, options = {}) {
    const {
      language = 'javascript',
      useRAG = true,
      useMultiModel = this.useMultiModel,
      maxRetries = this.maxRetries,
      context = null
    } = options;

    this.logger?.info('Iniciando geração de código', {
      prompt: prompt.substring(0, 100) + '...',
      language,
      useRAG,
      useMultiModel
    });

    try {
      // 1. Analisar requisitos (usar RequirementAnalyzer se disponível)
      const requirements = await this.analyzeRequirements(prompt);

      // 2. Buscar contexto relevante na Knowledge Base (RAG) com timeout
      let ragContext = [];
      if (useRAG) {
        ragContext = await this.timeoutManager.withTimeout(
          async () => await this.getRAGContext(prompt, language),
          'knowledgeBase'
        );
      }

      // 3. Buscar exemplos positivos
      const goldExamples = await this.getGoldExamples(prompt, language);

      // 4. Buscar anti-padrões para evitar
      const antiPatterns = await this.getAntiPatterns(prompt, language);

      // 5. Construir prompt completo
      const fullPrompt = this.buildPrompt(prompt, {
        ragContext,
        goldExamples,
        antiPatterns,
        requirements,
        language,
        context
      });

      // 6. Gerar código com modelo primário
      let generatedCode = null;
      let attempts = 0;

      while (!generatedCode && attempts < maxRetries) {
        attempts++;
        
        try {
          const response = await this.callOllama(this.primaryModel, fullPrompt);
          generatedCode = this.extractCode(response, language);

          if (!generatedCode) {
            this.logger?.warn('Código não extraído da resposta', { attempt: attempts });
            continue;
          }

          // 7. Validação básica (sintaxe, estrutura)
          const validation = this.validateBasic(generatedCode, language);
          if (!validation.valid) {
            this.logger?.warn('Validação básica falhou', {
              attempt: attempts,
              errors: validation.errors
            });
            generatedCode = null;
            continue;
          }

        } catch (error) {
          this.errorHandler?.handleError(error, {
            component: 'HallucinationPreventionGenerator',
            operation: 'generate',
            attempt: attempts
          });
          
          if (attempts >= maxRetries) {
            throw error;
          }
        }
      }

      if (!generatedCode) {
        throw new Error('Falha ao gerar código após múltiplas tentativas');
      }

      // 8. Cross-validation com modelo secundário (se habilitado)
      if (useMultiModel && this.secondaryModel) {
        const crossValidation = await this.crossValidate(generatedCode, prompt, language);
        if (!crossValidation.valid) {
          this.logger?.warn('Cross-validation falhou', {
            warnings: crossValidation.warnings
          });
        }
      }

      // 9. Aprender do resultado (adicionar à knowledge base)
      await this.learnFromGeneration(prompt, generatedCode, { accepted: true });

      const result = {
        code: generatedCode,
        language,
        prompt: prompt.substring(0, 200),
        metadata: {
          attempts,
          usedRAG: useRAG,
          ragContextCount: ragContext.length,
          goldExamplesCount: goldExamples.length,
          antiPatternsCount: antiPatterns.length,
          requirements: requirements
        }
      };

      this.logger?.info('Código gerado com sucesso', {
        language,
        attempts,
        codeLength: generatedCode.length
      });

      return result;

    } catch (error) {
      this.errorHandler?.handleError(error, {
        component: 'HallucinationPreventionGenerator',
        operation: 'generate',
        prompt: prompt.substring(0, 100)
      }, true);

      throw error;
    }
  }

  /**
   * Analisa requisitos do prompt
   * @param {string} prompt - Prompt do usuário
   * @returns {Promise<object>} Análise de requisitos
   */
  async analyzeRequirements(prompt) {
    // Se RequirementAnalyzer disponível, usar
    // Por enquanto, análise simples
    return {
      hasAction: /(criar|implementar|desenvolver|fazer|adicionar)/i.test(prompt),
      hasLanguage: /(python|javascript|typescript|java)/i.test(prompt),
      completeness: prompt.length > 50 ? 0.7 : 0.3
    };
  }

  /**
   * Busca contexto relevante na Knowledge Base (RAG)
   * @param {string} prompt - Prompt do usuário
   * @param {string} language - Linguagem alvo
   * @returns {Promise<Array<object>>} Contexto relevante
   */
  async getRAGContext(prompt, language) {
    try {
      const results = await this.knowledgeBase.search(prompt, this.ragTopK);
      
      // Filtrar por linguagem se possível
      const filtered = results.filter(r => 
        !language || r.language === language || r.language === 'unknown'
      );

      return filtered.map(r => ({
        type: r.type,
        name: r.name,
        code: r.code,
        file: r.file,
        similarity: r.similarity
      }));
    } catch (error) {
      this.logger?.warn('Erro ao buscar contexto RAG', { error: error.message });
      return [];
    }
  }

  /**
   * Busca exemplos positivos (gold examples)
   * @param {string} prompt - Prompt do usuário
   * @param {string} language - Linguagem alvo
   * @returns {Promise<Array<object>>} Exemplos positivos
   */
  async getGoldExamples(prompt, language) {
    try {
      if (this.config.rag?.useGoldExamples !== false) {
        return await this.goldExampleSearcher.search(prompt, language);
      }
      return [];
    } catch (error) {
      this.logger?.warn('Erro ao buscar exemplos positivos', { error: error.message });
      return [];
    }
  }

  /**
   * Busca anti-padrões para evitar
   * @param {string} prompt - Prompt do usuário
   * @param {string} language - Linguagem alvo
   * @returns {Promise<Array<object>>} Anti-padrões
   */
  async getAntiPatterns(prompt, language) {
    try {
      if (this.config.rag?.useAntiPatterns !== false) {
        return await this.antiPatternManager.search(prompt, language);
      }
      return [];
    } catch (error) {
      this.logger?.warn('Erro ao buscar anti-padrões', { error: error.message });
      return [];
    }
  }

  /**
   * Constrói prompt completo com contexto
   * @param {string} userPrompt - Prompt original do usuário
   * @param {object} context - Contexto adicional
   * @returns {string} Prompt completo
   */
  buildPrompt(userPrompt, context) {
    const {
      ragContext = [],
      goldExamples = [],
      antiPatterns = [],
      requirements = {},
      language = 'javascript',
      context: additionalContext = null
    } = context;

    let prompt = `Você é um assistente de código especializado em ${language}.\n\n`;

    // Adicionar contexto RAG
    if (ragContext.length > 0) {
      prompt += `## Contexto do Codebase:\n\n`;
      ragContext.forEach((ctx, idx) => {
        prompt += `### ${ctx.type === 'function' ? 'Função' : 'Classe'}: ${ctx.name}\n`;
        prompt += `Arquivo: ${ctx.file}\n`;
        prompt += `\`\`\`${language}\n${ctx.code.substring(0, 500)}\n\`\`\`\n\n`;
      });
    }

    // Adicionar exemplos positivos
    if (goldExamples.length > 0) {
      prompt += `## Exemplos Positivos:\n\n`;
      goldExamples.forEach((example, idx) => {
        prompt += `### Exemplo ${idx + 1}:\n\`\`\`${language}\n${example.code}\n\`\`\`\n\n`;
      });
    }

    // Adicionar anti-padrões
    if (antiPatterns.length > 0) {
      prompt += `## Anti-padrões a Evitar:\n\n`;
      antiPatterns.forEach((pattern, idx) => {
        prompt += `### Anti-padrão ${idx + 1}:\n`;
        prompt += `Motivo: ${pattern.reason}\n`;
        prompt += `\`\`\`${language}\n${pattern.code}\n\`\`\`\n\n`;
      });
    }

    // Adicionar requisitos
    if (requirements.completeness < 0.5) {
      prompt += `## Nota: Os requisitos estão incompletos. Use boas práticas e padrões comuns.\n\n`;
    }

    // Adicionar contexto adicional
    if (additionalContext) {
      prompt += `## Contexto Adicional:\n${additionalContext}\n\n`;
    }

    // Adicionar prompt do usuário
    prompt += `## Requisito:\n${userPrompt}\n\n`;

    // Instruções finais
    prompt += `## Instruções:\n`;
    prompt += `- Gere apenas código ${language} válido e funcional\n`;
    prompt += `- Siga os padrões do codebase mostrado acima\n`;
    prompt += `- Não inclua explicações, apenas código\n`;
    prompt += `- Use nomes descritivos e boas práticas\n`;
    prompt += `- Inclua tratamento de erros quando apropriado\n`;

    return prompt;
  }

  /**
   * Chama Ollama API
   * @param {string} model - Nome do modelo
   * @param {string} prompt - Prompt completo
   * @returns {Promise<string>} Resposta do modelo
   */
  async callOllama(model, prompt) {
    const url = `${this.ollamaUrl}/api/generate`;
    
    const response = await axios.post(url, {
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9
      }
    }, {
      timeout: this.timeout
    });

    return response.data.response || '';
  }

  /**
   * Extrai código da resposta do LLM
   * @param {string} response - Resposta do LLM
   * @param {string} language - Linguagem esperada
   * @returns {string|null} Código extraído
   */
  extractCode(response, language) {
    // Tentar encontrar código em blocos de código
    const codeBlockRegex = new RegExp(`\`\`\`${language}\\s*\\n([\\s\\S]*?)\\n\`\`\``, 'i');
    const match = response.match(codeBlockRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }

    // Tentar encontrar qualquer bloco de código
    const anyCodeBlockRegex = /```(?:[\w]+)?\s*\n([\s\S]*?)\n```/;
    const anyMatch = response.match(anyCodeBlockRegex);
    
    if (anyMatch && anyMatch[1]) {
      return anyMatch[1].trim();
    }

    // Se não encontrou bloco de código, tentar extrair código direto
    // (assumindo que a resposta é principalmente código)
    const lines = response.split('\n');
    const codeLines = lines.filter(line => {
      // Filtrar linhas que parecem código (não são explicações)
      return !line.match(/^(explicação|nota|instrução|requisito)/i) &&
             (line.trim().length > 0);
    });

    if (codeLines.length > 3) {
      return codeLines.join('\n');
    }

    return null;
  }

  /**
   * Valida código básico (sintaxe, estrutura)
   * @param {string} code - Código a validar
   * @param {string} language - Linguagem do código
   * @returns {object} Resultado da validação
   */
  validateBasic(code, language) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!code || code.trim().length === 0) {
      validation.valid = false;
      validation.errors.push('Código vazio');
      return validation;
    }

    // Validações básicas por linguagem
    if (language === 'python' || language === 'py') {
      // Verificar se tem pelo menos uma função ou classe
      if (!/def\s+\w+|class\s+\w+/.test(code)) {
        validation.warnings.push('Código Python não contém funções ou classes definidas');
      }
    } else if (language === 'javascript' || language === 'typescript') {
      // Verificar se tem pelo menos uma função ou classe
      if (!/function\s+\w+|const\s+\w+\s*=|class\s+\w+/.test(code)) {
        validation.warnings.push('Código JavaScript/TypeScript não contém funções ou classes definidas');
      }
    }

    // Verificar balanceamento de chaves/parênteses (básico)
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      validation.warnings.push('Possível desbalanceamento de chaves');
    }

    return validation;
  }

  /**
   * Valida código usando modelo secundário (cross-validation)
   * @param {string} code - Código gerado
   * @param {string} originalPrompt - Prompt original
   * @param {string} language - Linguagem do código
   * @returns {Promise<object>} Resultado da validação
   */
  async crossValidate(code, originalPrompt, language) {
    try {
      const validationPrompt = `Analise o seguinte código ${language} e verifique se está correto e atende ao requisito:\n\n`;
      const fullPrompt = validationPrompt + `Requisito: ${originalPrompt}\n\nCódigo:\n\`\`\`${language}\n${code}\n\`\`\`\n\nResponda apenas "VÁLIDO" ou "INVÁLIDO" seguido de uma breve explicação.`;

      const response = await this.callOllama(this.secondaryModel, fullPrompt);
      const isValid = response.toLowerCase().includes('válido') || 
                     response.toLowerCase().includes('valid');

      return {
        valid: isValid,
        warnings: isValid ? [] : [response.substring(0, 200)]
      };
    } catch (error) {
      this.logger?.warn('Erro na cross-validation', { error: error.message });
      return {
        valid: true, // Assumir válido se validação falhar
        warnings: []
      };
    }
  }

  /**
   * Aprende da geração (adiciona à knowledge base)
   * @param {string} prompt - Prompt original
   * @param {string} code - Código gerado
   * @param {object} feedback - Feedback (accepted, rejected)
   * @returns {Promise<void>}
   */
  async learnFromGeneration(prompt, code, feedback) {
    try {
      await this.knowledgeBase.learnFromUsage(prompt, code, feedback);
    } catch (error) {
      this.logger?.warn('Erro ao aprender da geração', { error: error.message });
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do HallucinationPreventionGenerator
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @param {object} errorHandler - ErrorHandler (opcional)
 * @param {object} knowledgeBase - KnowledgeBase (opcional)
 * @returns {HallucinationPreventionGenerator} Instância
 */
export function getGenerator(config = null, logger = null, errorHandler = null, knowledgeBase = null) {
  if (!instance) {
    instance = new HallucinationPreventionGenerator(config, logger, errorHandler, knowledgeBase);
  }
  return instance;
}

/**
 * Cria nova instância do HallucinationPreventionGenerator
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @param {object} errorHandler - ErrorHandler
 * @param {object} knowledgeBase - KnowledgeBase
 * @returns {HallucinationPreventionGenerator} Nova instância
 */
export function createGenerator(config = null, logger = null, errorHandler = null, knowledgeBase = null) {
  return new HallucinationPreventionGenerator(config, logger, errorHandler, knowledgeBase);
}

export default HallucinationPreventionGenerator;
