/**
 * Architect Agent
 * 
 * Especialista em estrutura e padrões.
 * Responsável por definir a arquitetura do código antes da implementação.
 * Analisa requisitos e define: estrutura de arquivos, padrões (Clean/Hexagonal), e grafo de dependências.
 */

import AgentBase from '../AgentBase.js';
import { getGenerator } from '../../components/HallucinationPreventionGenerator.js';

class ArchitectAgent extends AgentBase {
  constructor(config = null, logger = null, generator = null) {
    super(config, logger);
    this.generator = generator || getGenerator(config, logger);
  }

  async process(context) {
    const { prompt, requirements, language } = context;

    this.logger?.info('ArchitectAgent: Analisando estrutura');

    // Prompt especializado para arquitetura
    const architectPrompt = `
      Você é um Arquiteto de Software Sênior Ultra-Especializado.
      Sua tarefa é definir a estrutura ideal para a solicitação do usuário.
      
      Solicitação: "${prompt}"
      Linguagem: ${language}
      Requisitos identificados: ${JSON.stringify(requirements)}

      Defina:
      1. Padrão de projeto a ser usado (ex: Factory, Strategy, Singleton).
      2. Estrutura de arquivos/pastas ideal (se aplicável).
      3. Dependências necessárias (libs externas).
      4. Interfaces principais (assinaturas de métodos públicos).

      Responda EXCLUSIVAMENTE com um objeto JSON neste formato:
      {
        "pattern": "Nome do Padrão",
        "structure": ["file1.js", "folder/file2.js"],
        "dependencies": ["lib1", "lib2"],
        "interfaces": ["method1(arg): return", "method2()"],
        "reasoning": "Explicação breve da escolha arquitetural"
      }
    `;

    try {
      const response = await this.generator.generate(architectPrompt, {
        language,
        temperature: 0.2, // Baixa temperatura para precisão estrutural
        systemPrompt: "Você é um Arquiteto de Software. Responda apenas JSON válido."
      });

      // Extrair JSON da resposta (pode vir envolto em markdown code block)
      const jsonMatch = response.code.match(/\{[\s\S]*\}/);
      const architecture = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!architecture) {
        throw new Error("Falha ao parsear resposta do Arquiteto");
      }

      // Validação básica da arquitetura
      if (!architecture.pattern || !architecture.interfaces) {
         return {
           approved: false,
           reason: "Arquitetura incompleta gerada pelo LLM",
           data: null,
           score: 0.0
         };
      }

      this.logger?.info('ArchitectAgent: Arquitetura definida', { pattern: architecture.pattern });

      return {
        approved: true,
        reason: "Arquitetura sólida definida",
        data: architecture,
        score: 0.95
      };

    } catch (error) {
      this.logger?.error('ArchitectAgent: Erro na geração', { error: error.message });
      return {
        approved: false,
        reason: `Erro técnico: ${error.message}`,
        data: null,
        score: 0
      };
    }
  }
}

export default ArchitectAgent;
