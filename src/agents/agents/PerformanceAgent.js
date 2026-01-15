/**
 * Performance Agent
 * 
 * Especialista em performance e otimização.
 * Analisa complexidade algorítmica (Big O), uso de memória e
 * identifica gargalos potenciais (loops aninhados, recursão sem cauda).
 */

import AgentBase from '../AgentBase.js';
import { getGenerator } from '../../components/HallucinationPreventionGenerator.js';

class PerformanceAgent extends AgentBase {
  constructor(config = null, logger = null, generator = null) {
    super(config, logger);
    this.generator = generator || getGenerator(config, logger);
  }

  async process(context) {
    const { code, language } = context;
    this.logger?.info('PerformanceAgent: Analisando performance');

    const perfPrompt = `
      Você é um Engenheiro de Performance Sênior.
      Analise o código abaixo em busca de ineficiências:
      1. Complexidade de Tempo (Big O) - Identifique O(n^2) ou pior.
      2. Complexidade de Espaço - Identifique alocações desnecessárias.
      3. Loops aninhados desnecessários.
      4. Operações síncronas bloqueantes (I/O).
      5. Memory Leaks (listeners não removidos, closures infinitos).

      Código:
      \`\`\`${language}
      ${code}
      \`\`\`

      Responda EXCLUSIVAMENTE com JSON:
      {
        "approved": boolean,
        "timeComplexity": "O(1) | O(n) | O(n^2) | ...",
        "spaceComplexity": "O(1) | O(n) | ...",
        "issues": ["issue 1", "issue 2"],
        "optimizations": ["opt 1", "opt 2"]
      }
    `;

    try {
      const response = await this.generator.generate(perfPrompt, {
        language: 'json',
        temperature: 0.1
      });

      const jsonMatch = response.code.match(/\{[\s\S]*\}/);
      const perf = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!perf) return { approved: true, score: 0.5, reason: "Falha na análise de performance" };

      // Penalizar O(n^2) ou pior
      let score = 1.0;
      if (perf.timeComplexity.includes('^') || perf.timeComplexity.includes('!')) score -= 0.3;
      if (perf.issues.length > 0) score -= (perf.issues.length * 0.1);

      return {
        approved: perf.approved && score >= 0.6,
        reason: perf.issues.length > 0 ? `Problemas de performance: ${perf.issues.join(', ')}` : "Performance adequada",
        data: perf,
        score: Math.max(0, score)
      };

    } catch (error) {
      return { approved: true, reason: `Erro na análise: ${error.message}`, score: 0.5 };
    }
  }
}

export default PerformanceAgent;
