/**
 * Coder Agent
 * 
 * Especialista em implementação.
 * Responsável por gerar o código seguindo a arquitetura definida.
 * Utiliza RAG (Gold Examples) e Chain-of-Thought para garantir qualidade.
 */

import AgentBase from '../AgentBase.js';
import { getGenerator } from '../../components/HallucinationPreventionGenerator.js';

class CoderAgent extends AgentBase {
  constructor(config = null, logger = null, generator = null) {
    super(config, logger);
    this.generator = generator || getGenerator(config, logger);
  }

  async process(context) {
    const { prompt, architecture, language } = context;

    this.logger?.info('CoderAgent: Iniciando implementação');

    if (!architecture) {
      return {
        approved: false,
        reason: 'Arquitetura não fornecida para o CoderAgent',
        score: 0
      };
    }

    // Prompt especializado para codificação com contexto arquitetural
    const coderPrompt = `
      Você é um Desenvolvedor Sênior Ultra-Especializado em ${language}.
      Sua tarefa é implementar a solução seguindo RIGOROSAMENTE a arquitetura definida.

      Solicitação: "${prompt}"
      
      Arquitetura Definida (Siga isto):
      - Padrão: ${architecture.pattern}
      - Interfaces: ${JSON.stringify(architecture.interfaces)}
      - Dependências: ${JSON.stringify(architecture.dependencies)}

      Diretrizes:
      1. Use Chain-of-Thought para lógica complexa (comentários explicativos).
      2. Implemente tratamento de erros defensivo (try-catch, validações).
      3. Siga Clean Code e SOLID.
      4. Apenas código, sem explicações em markdown fora do código.

      Gere o código completo agora.
    `;

    try {
      // O HallucinationPreventionGenerator já injeta Gold Examples via RAG se configurado
      const response = await this.generator.generate(coderPrompt, {
        language,
        temperature: 0.3, // Equilíbrio entre criatividade e precisão
        systemPrompt: "Você é um Desenvolvedor Expert. Gere apenas código de produção."
      });

      const generatedCode = response.code;

      if (!generatedCode || generatedCode.trim().length === 0) {
         return {
           approved: false,
           reason: "Código gerado vazio",
           data: null,
           score: 0
         };
      }

      this.logger?.info('CoderAgent: Implementação concluída', { length: generatedCode.length });

      return {
        approved: true,
        reason: "Implementação concluída com sucesso",
        data: {
          code: generatedCode,
          language
        },
        score: 0.9
      };

    } catch (error) {
      this.logger?.error('CoderAgent: Erro na implementação', { error: error.message });
      return {
        approved: false,
        reason: `Erro técnico na geração: ${error.message}`,
        data: null,
        score: 0
      };
    }
  }
}

export default CoderAgent;
