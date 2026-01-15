/**
 * UX Agent (Intuitividade)
 * 
 * Especialista em Experiência do Desenvolvedor (DX) e Usabilidade.
 * Analisa nomes de variáveis, clareza da API, documentação (JSDoc)
 * e facilidade de uso do código gerado.
 */

import AgentBase from '../AgentBase.js';
import { getGenerator } from '../../components/HallucinationPreventionGenerator.js';

class UXAgent extends AgentBase {
  constructor(config = null, logger = null, generator = null) {
    super(config, logger);
    this.generator = generator || getGenerator(config, logger);
  }

  async process(context) {
    const { code, language } = context;
    this.logger?.info('UXAgent: Analisando usabilidade/DX');

    const uxPrompt = `
      Você é um Especialista em DX (Developer Experience).
      Analise a usabilidade do código abaixo:
      1. Naming Conventions: Os nomes são claros e intuitivos? (Gramática correta?)
      2. Assinatura da API: Os argumentos fazem sentido? Ordem lógica?
      3. Documentação: Existe JSDoc/Docstring útil?
      4. Mensagens de Erro: São claras e acionáveis?
      5. Consistência: O estilo é consistente?

      Código:
      \`\`\`${language}
      ${code}
      \`\`\`

      Responda EXCLUSIVAMENTE com JSON:
      {
        "approved": boolean,
        "score": number (0-100),
        "issues": ["issue 1"],
        "suggestions": ["sugestão 1"]
      }
    `;

    try {
      const response = await this.generator.generate(uxPrompt, {
        language: 'json',
        temperature: 0.2
      });

      const jsonMatch = response.code.match(/\{[\s\S]*\}/);
      const ux = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!ux) return { approved: true, score: 0.5, reason: "Falha na análise de UX" };

      return {
        approved: ux.approved,
        reason: ux.issues.length > 0 ? `Problemas de UX: ${ux.issues.join(', ')}` : "Código intuitivo",
        data: ux,
        score: ux.score / 100
      };

    } catch (error) {
      return { approved: true, reason: `Erro na análise: ${error.message}`, score: 0.5 };
    }
  }
}

export default UXAgent;
