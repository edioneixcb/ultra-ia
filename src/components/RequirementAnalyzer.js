/**
 * Analisador de Requisitos
 * 
 * Analisa requisitos do usuário e identifica:
 * - Ambiguidades
 * - Requisitos faltantes
 * - Requisitos conflitantes
 * - Requisitos implícitos
 * - Validação de requisitos
 * 
 * Funcionalidades:
 * - Análise de texto de requisitos
 * - Detecção de padrões problemáticos
 * - Sugestões de melhorias
 * - Validação de completude
 */

import { getConfigLoader } from '../utils/ConfigLoader.js';
import { getLogger } from '../utils/Logger.js';
import { getCacheManager } from '../utils/CacheManager.js';

class RequirementAnalyzer {
  constructor(config = null, logger = null) {
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

    this.config = config;
    this.logger = logger;
    this.cacheManager = getCacheManager(config, logger);

    // Padrões de ambiguidade
    this.ambiguityPatterns = [
      { pattern: /\b(melhor|otimizado|rápido|eficiente)\b/i, type: 'performance', severity: 'medium' },
      { pattern: /\b(fácil|simples|intuitivo)\b/i, type: 'usability', severity: 'low' },
      { pattern: /\b(seguro|protegido)\b/i, type: 'security', severity: 'high' },
      { pattern: /\b(alguns|algumas|vários|muitos)\b/i, type: 'quantification', severity: 'medium' },
      { pattern: /\b(quando necessário|se necessário|se possível)\b/i, type: 'conditionality', severity: 'medium' },
      { pattern: /\b(etc|e assim por diante|entre outros)\b/i, type: 'incompleteness', severity: 'high' }
    ];

    // Palavras-chave de requisitos faltantes
    this.missingRequirementKeywords = [
      'não especificado',
      'não mencionado',
      'não definido',
      'sem especificar',
      'sem mencionar'
    ];

    // Padrões de requisitos técnicos comuns
    this.technicalRequirementPatterns = [
      { category: 'performance', keywords: ['tempo', 'latência', 'throughput', 'velocidade', 'performance'] },
      { category: 'security', keywords: ['autenticação', 'autorização', 'criptografia', 'segurança', 'privacidade'] },
      { category: 'scalability', keywords: ['escala', 'escalabilidade', 'carga', 'usuários simultâneos'] },
      { category: 'reliability', keywords: ['disponibilidade', 'confiabilidade', 'backup', 'recuperação'] },
      { category: 'compatibility', keywords: ['compatibilidade', 'versão', 'plataforma', 'browser'] },
      { category: 'usability', keywords: ['interface', 'usabilidade', 'acessibilidade', 'ux'] }
    ];
  }

  /**
   * Analisa requisitos e retorna análise completa
   * @param {string} requirements - Texto dos requisitos
   * @param {object} context - Contexto adicional (opcional)
   * @returns {object} Análise completa dos requisitos
   */
  analyze(requirements, context = {}) {
    // Verificar cache
    const cacheKey = `analyze:${requirements.substring(0, 100)}`;
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!requirements || typeof requirements !== 'string' || requirements.trim().length === 0) {
      return {
        valid: false,
        errors: ['Requisitos vazios ou inválidos'],
        warnings: [],
        suggestions: [],
        completeness: 0,
        ambiguities: []
      };
    }

    const analysis = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      ambiguities: [],
      missingRequirements: [],
      completeness: 0,
      technicalCoverage: {}
    };

    // Detectar ambiguidades
    analysis.ambiguities = this.detectAmbiguities(requirements);

    // Detectar requisitos faltantes
    analysis.missingRequirements = this.detectMissingRequirements(requirements, context);

    // Validar completude
    analysis.completeness = this.calculateCompleteness(requirements, context);

    // Analisar cobertura técnica
    analysis.technicalCoverage = this.analyzeTechnicalCoverage(requirements);

    // Gerar sugestões
    analysis.suggestions = this.generateSuggestions(analysis);

    // Determinar se há erros críticos
    const criticalIssues = analysis.ambiguities.filter(a => a.severity === 'high').length;
    if (criticalIssues > 0 || analysis.completeness < 0.5) {
      analysis.valid = false;
      analysis.errors.push(`${criticalIssues} ambiguidades críticas encontradas`);
      if (analysis.completeness < 0.5) {
        analysis.errors.push('Completude muito baixa (< 50%)');
      }
    }

    // Adicionar warnings para problemas médios
    const mediumIssues = analysis.ambiguities.filter(a => a.severity === 'medium').length;
    if (mediumIssues > 0) {
      analysis.warnings.push(`${mediumIssues} ambiguidades médias encontradas`);
    }

    this.logger?.info('Análise de requisitos concluída', {
      completeness: analysis.completeness,
      ambiguities: analysis.ambiguities.length,
      missingRequirements: analysis.missingRequirements.length
    });

    // Armazenar em cache
    this.cacheManager.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Detecta ambiguidades no texto
   * @param {string} requirements - Texto dos requisitos
   * @returns {Array<object>} Lista de ambiguidades encontradas
   */
  detectAmbiguities(requirements) {
    const ambiguities = [];

    for (const pattern of this.ambiguityPatterns) {
      const matches = requirements.matchAll(new RegExp(pattern.pattern.source, 'gi'));
      for (const match of matches) {
        const context = this.getContextAround(requirements, match.index, 50);
        ambiguities.push({
          type: pattern.type,
          severity: pattern.severity,
          text: match[0],
          context,
          position: match.index,
          suggestion: this.getSuggestionForAmbiguity(pattern.type)
        });
      }
    }

    return ambiguities;
  }

  /**
   * Detecta requisitos faltantes baseado em contexto
   * @param {string} requirements - Texto dos requisitos
   * @param {object} context - Contexto adicional
   * @returns {Array<object>} Lista de requisitos faltantes sugeridos
   */
  detectMissingRequirements(requirements, context = {}) {
    const missing = [];

    // Verificar se requisitos técnicos importantes estão presentes
    const requirementsLower = requirements.toLowerCase();

    for (const techPattern of this.technicalRequirementPatterns) {
      const hasKeyword = techPattern.keywords.some(keyword => 
        requirementsLower.includes(keyword)
      );

      if (!hasKeyword && context.requireTechnicalDetails) {
        missing.push({
          category: techPattern.category,
          suggestion: `Considerar adicionar requisitos de ${techPattern.category}`,
          importance: 'medium'
        });
      }
    }

    // Verificar palavras-chave de requisitos faltantes explícitos
    for (const keyword of this.missingRequirementKeywords) {
      if (requirementsLower.includes(keyword)) {
        missing.push({
          category: 'explicit',
          suggestion: 'Requisito explicitamente marcado como faltante',
          importance: 'high'
        });
      }
    }

    return missing;
  }

  /**
   * Calcula completude dos requisitos (0-1)
   * @param {string} requirements - Texto dos requisitos
   * @param {object} context - Contexto adicional
   * @returns {number} Score de completude (0-1)
   */
  calculateCompleteness(requirements, context = {}) {
    let score = 0;
    const maxScore = 10;

    // Comprimento mínimo (requisitos muito curtos são incompletos)
    if (requirements.length > 100) score += 2;
    else if (requirements.length > 50) score += 1;

    // Presença de verbos de ação (indica requisitos funcionais)
    const actionVerbs = ['criar', 'implementar', 'desenvolver', 'fazer', 'adicionar', 'remover', 'modificar'];
    const hasActionVerbs = actionVerbs.some(verb => requirements.toLowerCase().includes(verb));
    if (hasActionVerbs) score += 2;

    // Presença de requisitos não-funcionais
    const nonFunctionalKeywords = ['performance', 'segurança', 'escalabilidade', 'confiabilidade'];
    const hasNonFunctional = nonFunctionalKeywords.some(keyword => 
      requirements.toLowerCase().includes(keyword)
    );
    if (hasNonFunctional) score += 2;

    // Presença de exemplos ou casos de uso
    const hasExamples = requirements.includes('exemplo') || 
                        requirements.includes('caso de uso') ||
                        requirements.includes('cenário');
    if (hasExamples) score += 1;

    // Presença de validações ou testes
    const hasValidation = requirements.includes('validar') ||
                          requirements.includes('testar') ||
                          requirements.includes('verificar');
    if (hasValidation) score += 1;

    // Presença de tratamento de erros
    const hasErrorHandling = requirements.includes('erro') ||
                            requirements.includes('exceção') ||
                            requirements.includes('falha');
    if (hasErrorHandling) score += 1;

    // Presença de especificações técnicas
    const hasTechnicalSpecs = requirements.includes('tecnologia') ||
                              requirements.includes('framework') ||
                              requirements.includes('biblioteca') ||
                              requirements.includes('api');
    if (hasTechnicalSpecs) score += 1;

    return Math.min(score / maxScore, 1.0);
  }

  /**
   * Analisa cobertura técnica dos requisitos
   * @param {string} requirements - Texto dos requisitos
   * @returns {object} Cobertura por categoria técnica
   */
  analyzeTechnicalCoverage(requirements) {
    const coverage = {};
    const requirementsLower = requirements.toLowerCase();

    for (const techPattern of this.technicalRequirementPatterns) {
      const matchedKeywords = techPattern.keywords.filter(keyword =>
        requirementsLower.includes(keyword)
      );
      coverage[techPattern.category] = {
        covered: matchedKeywords.length > 0,
        keywordsFound: matchedKeywords,
        coverage: matchedKeywords.length / techPattern.keywords.length
      };
    }

    return coverage;
  }

  /**
   * Gera sugestões baseadas na análise
   * @param {object} analysis - Resultado da análise
   * @returns {Array<string>} Lista de sugestões
   */
  generateSuggestions(analysis) {
    const suggestions = [];

    // Sugestões baseadas em ambiguidades
    if (analysis.ambiguities.length > 0) {
      const highSeverity = analysis.ambiguities.filter(a => a.severity === 'high');
      if (highSeverity.length > 0) {
        suggestions.push(`Clarificar ${highSeverity.length} ambiguidade(s) crítica(s) encontrada(s)`);
      }
    }

    // Sugestões baseadas em completude
    if (analysis.completeness < 0.7) {
      suggestions.push('Adicionar mais detalhes aos requisitos para aumentar completude');
    }

    // Sugestões baseadas em requisitos faltantes
    if (analysis.missingRequirements.length > 0) {
      const highImportance = analysis.missingRequirements.filter(m => m.importance === 'high');
      if (highImportance.length > 0) {
        suggestions.push(`Considerar adicionar ${highImportance.length} requisito(s) crítico(s) faltante(s)`);
      }
    }

    // Sugestões baseadas em cobertura técnica
    const uncoveredCategories = Object.keys(analysis.technicalCoverage).filter(
      cat => !analysis.technicalCoverage[cat].covered
    );
    if (uncoveredCategories.length > 0) {
      suggestions.push(`Considerar adicionar requisitos sobre: ${uncoveredCategories.join(', ')}`);
    }

    return suggestions;
  }

  /**
   * Obtém contexto ao redor de uma posição no texto
   * @param {string} text - Texto completo
   * @param {number} position - Posição
   * @param {number} contextLength - Tamanho do contexto
   * @returns {string} Contexto extraído
   */
  getContextAround(text, position, contextLength = 50) {
    const start = Math.max(0, position - contextLength);
    const end = Math.min(text.length, position + contextLength);
    return text.substring(start, end);
  }

  /**
   * Obtém sugestão para tipo de ambiguidade
   * @param {string} ambiguityType - Tipo de ambiguidade
   * @returns {string} Sugestão
   */
  getSuggestionForAmbiguity(ambiguityType) {
    const suggestions = {
      'performance': 'Especificar métricas concretas (ex: tempo de resposta < 100ms)',
      'usability': 'Definir critérios objetivos de usabilidade',
      'security': 'Especificar medidas de segurança específicas',
      'quantification': 'Usar números específicos em vez de termos vagos',
      'conditionality': 'Definir condições específicas e critérios de decisão',
      'incompleteness': 'Listar todos os itens explicitamente em vez de usar "etc"'
    };

    return suggestions[ambiguityType] || 'Clarificar requisito';
  }

  /**
   * Valida requisitos específicos
   * @param {string} requirements - Texto dos requisitos
   * @param {Array<string>} requiredElements - Elementos obrigatórios
   * @returns {object} Resultado da validação
   */
  validateRequirements(requirements, requiredElements = []) {
    const validation = {
      valid: true,
      missing: [],
      found: []
    };

    const requirementsLower = requirements.toLowerCase();

    for (const element of requiredElements) {
      const elementLower = element.toLowerCase();
      if (requirementsLower.includes(elementLower)) {
        validation.found.push(element);
      } else {
        validation.missing.push(element);
        validation.valid = false;
      }
    }

    return validation;
  }

  /**
   * Extrai requisitos estruturados do texto
   * @param {string} requirements - Texto dos requisitos
   * @returns {object} Requisitos estruturados
   */
  extractStructuredRequirements(requirements) {
    const structured = {
      functional: [],
      nonFunctional: [],
      constraints: [],
      assumptions: []
    };

    // Padrões simples para extração
    const lines = requirements.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (const line of lines) {
      const lineLower = line.toLowerCase();

      // Requisitos funcionais (verbos de ação)
      if (/^(criar|implementar|desenvolver|fazer|adicionar|remover|modificar)/i.test(line)) {
        structured.functional.push(line);
      }

      // Requisitos não-funcionais
      if (/(performance|segurança|escalabilidade|confiabilidade|usabilidade)/i.test(line)) {
        structured.nonFunctional.push(line);
      }

      // Restrições
      if (/^(deve|não deve|não pode|obrigatório|requerido)/i.test(line)) {
        structured.constraints.push(line);
      }

      // Assumptions
      if (/^(assumindo|assumir|presumindo)/i.test(line)) {
        structured.assumptions.push(line);
      }
    }

    return structured;
  }
}

// Singleton instance
let instance = null;

/**
 * Obtém instância singleton do RequirementAnalyzer
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {RequirementAnalyzer} Instância
 */
export function getRequirementAnalyzer(config = null, logger = null) {
  if (!instance) {
    instance = new RequirementAnalyzer(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do RequirementAnalyzer
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {RequirementAnalyzer} Nova instância
 */
export function createRequirementAnalyzer(config = null, logger = null) {
  return new RequirementAnalyzer(config, logger);
}

export default RequirementAnalyzer;
