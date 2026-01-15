/**
 * Security Agent
 * 
 * Especialista em segurança de software.
 * Analisa o código em busca de vulnerabilidades, injeção de código e
 * exposição de dados sensíveis. Utiliza AST Parser para Taint Analysis básica.
 */

import AgentBase from '../AgentBase.js';
import { getGenerator } from '../../components/HallucinationPreventionGenerator.js';
import ASTParser from '../../validation/ASTParser.js';

class SecurityAgent extends AgentBase {
  constructor(config = null, logger = null, generator = null) {
    super(config, logger);
    this.generator = generator || getGenerator(config, logger);
    this.astParser = new ASTParser(config, logger);
  }

  async process(context) {
    const { code, language } = context;

    this.logger?.info('SecurityAgent: Iniciando auditoria de segurança');

    if (!code) return { approved: false, reason: 'Código ausente', score: 0 };

    // 1. Análise Estática via AST (Taint Analysis básica)
    const astResult = this.astParser.parse(code, language);
    let securityScore = 1.0;
    const issues = [];

    if (astResult.securityIssues && astResult.securityIssues.length > 0) {
      issues.push(...astResult.securityIssues.map(i => `AST: ${i.message}`));
      // Penalidade grave para problemas detectados via AST
      securityScore -= (astResult.securityIssues.length * 0.3);
    }

    // 2. Análise Semântica via LLM (OWASP Top 10)
    const securityPrompt = `
      Você é um Especialista em Segurança de Aplicações (AppSec).
      Analise o código abaixo buscando vulnerabilidades do OWASP Top 10:
      1. Injection (SQL, Command, NoSQL)
      2. Broken Authentication
      3. Sensitive Data Exposure (Secrets hardcoded)
      4. XML External Entities (XXE)
      5. Broken Access Control
      6. Security Misconfiguration
      7. Cross-Site Scripting (XSS)
      8. Insecure Deserialization
      9. Using Components with Known Vulnerabilities
      10. Insufficient Logging & Monitoring

      Código:
      \`\`\`${language}
      ${code}
      \`\`\`

      Responda EXCLUSIVAMENTE com JSON:
      {
        "safe": boolean,
        "vulnerabilities": ["vuln 1", "vuln 2"],
        "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
      }
    `;

    try {
      const response = await this.generator.generate(securityPrompt, {
        language: 'json',
        temperature: 0.0, // Zero criatividade, apenas fatos
        systemPrompt: "Você é um Auditor de Segurança paranóico."
      });

      const jsonMatch = response.code.match(/\{[\s\S]*\}/);
      const audit = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (audit) {
        if (!audit.safe) {
          issues.push(...audit.vulnerabilities.map(v => `LLM: ${v}`));
          if (audit.riskLevel === 'CRITICAL') securityScore -= 1.0;
          if (audit.riskLevel === 'HIGH') securityScore -= 0.5;
          if (audit.riskLevel === 'MEDIUM') securityScore -= 0.2;
        }
      }

      // Normalizar score (min 0)
      securityScore = Math.max(0, securityScore);
      const approved = securityScore >= 0.8; // Alta exigência para segurança

      this.logger?.info('SecurityAgent: Auditoria concluída', { approved, score: securityScore, issuesCount: issues.length });

      return {
        approved,
        reason: approved ? "Segurança aprovada" : `Vulnerabilidades detectadas: ${issues.join(', ')}`,
        data: { issues, astSecurity: astResult.securityIssues, llmAudit: audit },
        score: securityScore
      };

    } catch (error) {
      this.logger?.error('SecurityAgent: Erro na auditoria', { error: error.message });
      // Falha segura: em caso de erro, reprovar
      return { approved: false, reason: `Erro técnico na auditoria: ${error.message}`, score: 0 };
    }
  }
}

export default SecurityAgent;
