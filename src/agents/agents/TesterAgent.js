/**
 * Tester Agent
 * 
 * Especialista em testes.
 * Gera casos de teste baseados em propriedades (Property-Based Testing) e
 * cenários de borda. Gera código de teste real para execução no Docker.
 */

import AgentBase from '../AgentBase.js';
import { getGenerator } from '../../components/HallucinationPreventionGenerator.js';

class TesterAgent extends AgentBase {
  constructor(config = null, logger = null, generator = null) {
    super(config, logger);
    this.generator = generator || getGenerator(config, logger);
  }

  async process(context) {
    const { code, language } = context;
    this.logger?.info('TesterAgent: Gerando suite de testes');

    const testPrompt = `
      Você é um QA Engineer especialista em Testes Automatizados.
      Gere uma suíte de testes completa para o código abaixo.
      
      Diretrizes:
      1. Use o framework padrão da linguagem (Jest para JS/TS, unittest para Python).
      2. Cubra o "Happy Path" (casos de sucesso).
      3. Cubra "Edge Cases" (inputs vazios, nulos, extremos).
      4. Use Property-Based Testing se possível (geração de inputs aleatórios).
      
      Código:
      \`\`\`${language}
      ${code}
      \`\`\`

      Gere APENAS o código do arquivo de teste.
    `;

    try {
      const response = await this.generator.generate(testPrompt, {
        language,
        temperature: 0.2
      });

      const testCode = response.code;

      if (!testCode) return { approved: false, reason: "Falha ao gerar testes", score: 0 };

      // Opcional: Validar se o teste roda (seria a próxima etapa na integração)
      
      return {
        approved: true,
        reason: "Testes gerados com sucesso",
        data: { testCode },
        score: 1.0
      };

    } catch (error) {
      return { approved: false, reason: `Erro na geração de testes: ${error.message}`, score: 0 };
    }
  }
}

export default TesterAgent;
