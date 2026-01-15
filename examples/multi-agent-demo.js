/**
 * Multi-Agent System Demo
 * 
 * Script de demonstração para visualizar o comitê de agentes em ação.
 * Utiliza mocks para não gastar tokens, mas exercita todo o fluxo arquitetural.
 * 
 * Uso: node examples/multi-agent-demo.js
 */

import registry from '../src/config/registry.js';
import { getLogger } from '../src/utils/Logger.js';

async function runDemo() {
  const logger = registry.get('Logger');
  const orchestrator = registry.get('AgentOrchestrator');
  
  console.log('\n🚀 Iniciando Demo do Sistema Multi-Agente Ultra-IA\n');

  // Configurar Mocks para a Demo
  // Isso simula as respostas dos LLMs para cada agente
  const generator = registry.get('Generator');
  
  // Mock inteligente que responde baseado no prompt
  generator.generate = async (prompt, options) => {
    // Simular delay de "pensamento"
    await new Promise(r => setTimeout(r, 500));

    // Resposta do Arquiteto
    if (prompt.includes('Arquiteto de Software')) {
      return {
        code: JSON.stringify({
          pattern: "Module Pattern",
          structure: ["src/auth/AuthService.js", "src/utils/validation.js"],
          dependencies: ["jsonwebtoken", "bcrypt"],
          interfaces: ["login(user, pass)", "validate(token)"],
          reasoning: "Estrutura modular para separação de responsabilidades."
        })
      };
    }

    // Resposta do Coder
    if (prompt.includes('Desenvolvedor Sênior')) {
      return {
        code: `
/**
 * AuthService - Gerencia autenticação
 */
import jwt from 'jsonwebtoken';

export class AuthService {
  async login(username, password) {
    // Implementação segura simulada
    if (!username || !password) throw new Error("Invalid credentials");
    return jwt.sign({ user: username }, 'secret');
  }
}
        `,
        language: 'javascript'
      };
    }

    // Respostas dos Validadores (aprovando com pequenas ressalvas)
    if (prompt.includes('Tech Lead') || prompt.includes('Auditor')) {
      return {
        code: JSON.stringify({
          approved: true,
          score: 95,
          issues: [],
          suggestions: ["Adicionar rotação de chaves"],
          safe: true,
          riskLevel: "LOW",
          vulnerabilities: []
        })
      };
    }

    // Resposta do Performance/UX
    if (prompt.includes('Engenheiro de Performance') || prompt.includes('DX')) {
      return {
        code: JSON.stringify({
          approved: true,
          timeComplexity: "O(1)",
          score: 90,
          issues: [],
          optimizations: []
        })
      };
    }

    // Resposta Ativa (Tester/Adversary)
    return {
      code: JSON.stringify({
        approved: true,
        score: 100,
        resilience_score: 98,
        vulnerabilities_found: [],
        testCode: "describe('Auth', () => { ... })"
      })
    };
  };

  // Executar Fluxo
  const context = {
    prompt: "Criar um sistema de autenticação seguro usando JWT",
    language: "javascript",
    requestId: `demo-${Date.now()}`,
    requirements: { valid: true }
  };

  console.log(`📝 Prompt: "${context.prompt}"`);
  console.log('🤖 Comitê de 8 Agentes convocado...\n');

  const result = await orchestrator.runCommittee(context);

  console.log('\n📊 Veredicto Final:', result.success ? '✅ APROVADO' : '❌ REJEITADO');
  console.log(`📈 Score Consenso: ${(result.score * 100).toFixed(1)}%`);
  
  if (result.verdict.reasons.length > 0) {
    console.log('📝 Razões:', result.verdict.reasons);
  }

  console.log('\n🔍 Detalhes por Agente:');
  Object.entries(result.agentResults).forEach(([agent, res]) => {
    const icon = res.approved ? '✅' : '❌';
    console.log(`  ${icon} ${agent.padEnd(20)} | Score: ${res.score || 'N/A'}`);
    if (res.reason && res.reason !== 'Auditoria concluída') {
        console.log(`     Obs: ${res.reason}`);
    }
  });

  if (result.success) {
    console.log('\n💻 Código Final Gerado:');
    console.log(result.finalCode);
  }
}

runDemo().catch(console.error);
