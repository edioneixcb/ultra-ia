/**
 * Adversary Agent (Red Team)
 * 
 * Especialista em quebrar código.
 * Simula um atacante ou usuário malicioso/incompetente.
 * Gera inputs que visam causar crash, timeout ou comportamento inesperado.
 */

import AgentBase from '../AgentBase.js';
import { getGenerator } from '../../components/HallucinationPreventionGenerator.js';

class AdversaryAgent extends AgentBase {
  constructor(config = null, logger = null, generator = null) {
    super(config, logger);
    this.generator = generator || getGenerator(config, logger);
  }

  async process(context) {
    const { code, language } = context;
    this.logger?.info('AdversaryAgent: Iniciando ataque virtual');

    const attackPrompt = `
      Você é um Hacker / Pentester (Red Team).
      Seu objetivo é encontrar falhas no código abaixo.
      
      Gere uma lista de inputs "maliciosos" ou extremos que poderiam quebrar esse código:
      1. Buffer Overflow (strings gigantes).
      2. Type Confusion (enviar objeto onde espera string).
      3. Logic Bombs (valores negativos, zero, infinito).
      4. Injection Payloads (SQLi, XSS strings).

      Código:
      \`\`\`${language}
      ${code}
      \`\`\`

      Responda EXCLUSIVAMENTE com JSON:
      {
        "vulnerabilities_found": ["vuln 1", "vuln 2"],
        "attack_vectors": [
          {"input": "...", "expected_impact": "crash/leak/bypass"}
        ],
        "resilience_score": number (0-100)
      }
    `;

    try {
      const response = await this.generator.generate(attackPrompt, {
        language: 'json',
        temperature: 0.4 // Criatividade para achar brechas
      });

      const jsonMatch = response.code.match(/\{[\s\S]*\}/);
      const attackReport = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!attackReport) return { approved: true, score: 0.5, reason: "Falha na análise adversária" };

      // Se resilience_score for baixo, reprovar
      const score = attackReport.resilience_score / 100;
      const approved = score >= 0.7;

      return {
        approved,
        reason: approved ? "Código resiliente a ataques" : `Vulnerável a ataques: ${attackReport.vulnerabilities_found.join(', ')}`,
        data: attackReport,
        score
      };

    } catch (error) {
      return { approved: false, reason: `Erro no ataque: ${error.message}`, score: 0 };
    }
  }
}

export default AdversaryAgent;
