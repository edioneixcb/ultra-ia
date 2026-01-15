/**
 * Sistema de Consenso
 * 
 * Implementa a lógica de votação ponderada e veto para o comitê de agentes.
 * Garante que decisões críticas respeitem critérios de segurança e qualidade.
 * 
 * Funcionalidades:
 * - Votação ponderada por peso do agente
 * - Lógica de VETO (bloqueio imediato por agentes críticos)
 * - Voto de minerva pelo orquestrador
 * - Cálculo de score de confiança
 */

import { getLogger } from '../utils/Logger.js';

class ConsensusSystem {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    
    // Pesos padrão dos agentes (podem ser sobrescritos via config)
    this.weights = config?.consensus?.weights || {
      'SecurityAgent': 2.0,    // Peso dobrado + Poder de Veto
      'TesterAgent': 1.5,      // Peso alto + Poder de Veto
      'ArchitectAgent': 1.5,   // Peso alto na estrutura
      'CoderAgent': 1.0,       // Executor
      'ReviewerAgent': 1.0,    // Revisor
      'PerformanceAgent': 1.0, // Performance
      'UXAgent': 1.0,          // Usabilidade
      'AdversaryAgent': 1.2    // Peso maior por ser adversarial
    };

    // Agentes com poder de veto
    this.vetoPower = config?.consensus?.vetoPower || ['SecurityAgent', 'TesterAgent'];
    
    // Limiar de aprovação (0-1)
    this.approvalThreshold = config?.consensus?.threshold || 0.7;
  }

  /**
   * Avalia os resultados dos agentes e gera um veredicto
   * @param {Object} agentResults - Mapa de resultados { AgentName: { approved: boolean, reason: string, score: number } }
   * @returns {Object} Veredicto final { approved: boolean, score: number, reasons: [], vetoed: boolean }
   */
  evaluate(agentResults) {
    let totalWeight = 0;
    let approvalScore = 0;
    const reasons = [];
    let vetoed = false;
    let vetoReason = null;

    for (const [agentName, result] of Object.entries(agentResults)) {
      const weight = this.weights[agentName] || 1.0;
      totalWeight += weight;

      // Verificar VETO
      if (this.vetoPower.includes(agentName) && result.approved === false) {
        vetoed = true;
        vetoReason = `VETO por ${agentName}: ${result.reason}`;
        this.logger?.warn(vetoReason);
      }

      // Calcular score ponderado
      if (result.approved) {
        // Se o agente retornou um score (0-1), usamos ponderado pelo peso
        // Se não, assumimos 1.0 (aprovado total)
        const confidence = typeof result.score === 'number' ? result.score : 1.0;
        approvalScore += confidence * weight;
      } else {
        reasons.push(`[${agentName}] Rejeitado: ${result.reason}`);
      }
    }

    // Se houve veto, reprovação imediata
    if (vetoed) {
      return {
        approved: false,
        score: 0,
        reasons: [vetoReason, ...reasons],
        vetoed: true,
        vetoSource: vetoReason.split(':')[0]
      };
    }

    // Calcular média ponderada final
    const finalScore = totalWeight > 0 ? approvalScore / totalWeight : 0;
    const approved = finalScore >= this.approvalThreshold;

    this.logger?.info('Consenso calculado', { 
      approved, 
      score: finalScore.toFixed(2), 
      threshold: this.approvalThreshold 
    });

    return {
      approved,
      score: finalScore,
      reasons: approved ? [] : reasons,
      vetoed: false
    };
  }

  /**
   * Resolve conflitos via voto de minerva (Orquestrador)
   * @param {boolean} orchestratorDecision 
   * @param {Object} currentVerdict 
   */
  resolveTie(orchestratorDecision, currentVerdict) {
    if (currentVerdict.vetoed) {
      return currentVerdict; // Veto não pode ser derrubado por minerva simples
    }
    
    // Se a decisão está muito próxima do limiar (zona de incerteza)
    const margin = 0.05;
    if (Math.abs(currentVerdict.score - this.approvalThreshold) <= margin) {
      this.logger?.info('Voto de minerva aplicado', { decision: orchestratorDecision });
      return {
        ...currentVerdict,
        approved: orchestratorDecision,
        reasons: [...currentVerdict.reasons, `Voto de Minerva: ${orchestratorDecision ? 'Aprovado' : 'Rejeitado'}`]
      };
    }

    return currentVerdict;
  }
}

export default ConsensusSystem;
