import { describe, it, expect, vi, beforeEach } from 'vitest';
import AgentOrchestrator from '../../src/agents/AgentOrchestrator.js';
import ArchitectAgent from '../../src/agents/agents/ArchitectAgent.js';
import CoderAgent from '../../src/agents/agents/CoderAgent.js';
import ReviewerAgent from '../../src/agents/agents/ReviewerAgent.js';
import SecurityAgent from '../../src/agents/agents/SecurityAgent.js';
import PerformanceAgent from '../../src/agents/agents/PerformanceAgent.js';
import UXAgent from '../../src/agents/agents/UXAgent.js';
import TesterAgent from '../../src/agents/agents/TesterAgent.js';
import AdversaryAgent from '../../src/agents/agents/AdversaryAgent.js';

// Mock do gerador para não chamar LLM real
const mockGenerator = {
  generate: vi.fn()
};

const mockConfig = {
  multiAgent: { maxConcurrent: 4, timeout: 5000 },
  consensus: { threshold: 0.7 }
};

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

describe('Multi-Agent Flow Integration', () => {
  let orchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator = new AgentOrchestrator(mockConfig, mockLogger);

    // Configurar agentes com mock generator
    const agents = [
      new ArchitectAgent(mockConfig, mockLogger),
      new CoderAgent(mockConfig, mockLogger),
      new ReviewerAgent(mockConfig, mockLogger),
      new SecurityAgent(mockConfig, mockLogger),
      new PerformanceAgent(mockConfig, mockLogger),
      new UXAgent(mockConfig, mockLogger),
      new TesterAgent(mockConfig, mockLogger),
      new AdversaryAgent(mockConfig, mockLogger)
    ];

    agents.forEach(agent => {
      agent.generator = mockGenerator;
      // Mock do ASTParser para SecurityAgent
      if (agent.name === 'SecurityAgent') {
        agent.astParser = { parse: () => ({ securityIssues: [] }) };
      }
      orchestrator.registerAgent(agent.constructor.name, agent);
    });
  });

  it('deve executar o fluxo completo com sucesso', async () => {
    // 1. Mock Architect Response
    mockGenerator.generate.mockResolvedValueOnce({
      code: JSON.stringify({
        pattern: 'Module',
        interfaces: ['init()'],
        dependencies: []
      })
    });

    // 2. Mock Coder Response
    mockGenerator.generate.mockResolvedValueOnce({
      code: 'function init() { return true; }'
    });

    // 3. Mocks para validadores paralelos (Reviewer, Security, Perf, UX, Tester, Adversary)
    // Importante: mockResolvedValue retorna o MESMO valor para todas as chamadas subsequentes
    mockGenerator.generate.mockResolvedValue({
      code: JSON.stringify({ approved: true, score: 90, issues: [], vulnerabilities: [], riskLevel: 'LOW', safe: true, timeComplexity: 'O(1)', spaceComplexity: 'O(1)', resilience_score: 95, vulnerabilities_found: [] })
    });

    const result = await orchestrator.runCommittee({
      prompt: 'Criar função de init',
      language: 'javascript',
      requestId: 'test-req-1'
    });

    // Debug se falhar
    if (!result.success) {
      console.error('Falha no teste:', result);
    }

    expect(result.success).toBe(true);
    expect(result.score).toBeGreaterThan(0.8);
    expect(result.finalCode).toBeDefined();
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Iniciando comitê'), expect.any(Object));
  });

  it('deve bloquear com VETO de segurança', async () => {
    // 1. Architect OK
    mockGenerator.generate.mockResolvedValueOnce({
      code: JSON.stringify({ pattern: 'Module', interfaces: [], dependencies: [] })
    });

    // 2. Coder OK
    mockGenerator.generate.mockResolvedValueOnce({
      code: 'eval(input);'
    });

    // 3. Security VETO - precisa ser configurado para o SecurityAgent especificamente
    // Como os agentes rodam em paralelo, o mockResolvedValue sequencial pode ser tricky.
    // Melhor usar mockImplementation para diferenciar pelo prompt.
    
    mockGenerator.generate.mockImplementation(async (prompt) => {
      if (prompt.includes('Arquiteto')) {
        return { code: JSON.stringify({ pattern: 'Module', interfaces: [], dependencies: [] }) };
      }
      if (prompt.includes('Desenvolvedor')) {
         return { code: 'eval(input);' };
      }
      if (prompt.includes('Segurança')) {
        return {
          code: JSON.stringify({ safe: false, riskLevel: 'CRITICAL', vulnerabilities: ['Eval Injection'] })
        };
      }
      // Outros agentes aprovam
      return { 
        code: JSON.stringify({ approved: true, score: 90, issues: [], timeComplexity: 'O(1)', spaceComplexity: 'O(1)', resilience_score: 95, vulnerabilities_found: [] }) 
      };
    });

    const result = await orchestrator.runCommittee({
      prompt: 'Código inseguro',
      language: 'javascript',
      requestId: 'test-veto'
    });

    expect(result.success).toBe(false);
    // Verificar se verdict existe antes de acessar
    expect(result.verdict).toBeDefined();
    if (result.verdict) {
        expect(result.verdict.vetoed).toBe(true);
        expect(result.verdict.reasons[0]).toContain('VETO');
    }
  });
});
