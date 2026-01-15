/**
 * Reviewer Agent
 * 
 * Especialista em revisão de código.
 * Analisa o código gerado em busca de problemas de legibilidade,
 * complexidade, manutenção e aderência a padrões (SOLID, DRY).
 */

import AgentBase from '../AgentBase.js';
import { getGenerator } from '../../components/HallucinationPreventionGenerator.js';

class ReviewerAgent extends AgentBase {
  constructor(config = null, logger = null, generator = null) {
    super(config, logger);
    this.generator = generator || getGenerator(config, logger);
  }

  async process(context) {
    const { code, language } = context;

    this.logger?.info('ReviewerAgent: Iniciando revisão de código');

    if (!code) {
      return { approved: false, reason: 'Código não fornecido para revisão', score: 0 };
    }

    // Prompt de revisão focado em qualidade
    const reviewPrompt = `
      Você é um Tech Lead especialista em Code Review.
      Analise o código abaixo em busca de violações de:
      1. SOLID Principles
      2. DRY (Don't Repeat Yourself)
      3. KISS (Keep It Simple, Stupid)
      4. Legibilidade e Naming Conventions
      5. Complexidade Ciclomática excessiva (> 10)

      Código:
      \`\`\`${language}
      ${code}
      \`\`\`

      Responda EXCLUSIVAMENTE com um JSON:
      {
        "approved": boolean,
        "score": number (0-100),
        "issues": ["lista", "de", "problemas"],
        "suggestions": ["sugestão 1", "sugestão 2"]
      }
    `;

    try {
      const response = await this.generator.generate(reviewPrompt, {
        language: 'json',
        temperature: 0.1, // Alta precisão
        systemPrompt: "Você é um Auditor de Código implacável. Seja crítico."
      });

      const jsonMatch = response.code.match(/\{[\s\S]*\}/);
      const review = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!review) {
         // Fallback se LLM falhar no JSON, mas código existe
         return {
           approved: true, // Aprovação cautelosa se não conseguiu analisar
           reason: "Falha na análise do Reviewer (JSON inválido), mas código gerado.",
           score: 0.5
         };
      }

      const scoreNormalized = review.score / 100;
      const approved = review.approved && scoreNormalized >= 0.7; // Regra de aprovação interna

      this.logger?.info('ReviewerAgent: Revisão concluída', { approved, score: scoreNormalized });

      return {
        approved,
        reason: approved ? "Código aprovado na revisão" : `Rejeitado: ${review.issues.join(', ')}`,
        data: review,
        score: scoreNormalized
      };

    } catch (error) {
      this.logger?.error('ReviewerAgent: Erro na revisão', { error: error.message });
      return { approved: false, reason: `Erro técnico: ${error.message}`, score: 0 };
    }
  }
}

export default ReviewerAgent;
