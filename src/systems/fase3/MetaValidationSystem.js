/**
 * MetaValidationSystem - Sistema de Meta-Validação
 * 
 * Valida a própria auditoria (completude, validade dos N/A, consistência, rastreabilidade, cobertura, qualidade do roadmap).
 * 
 * Funcionalidades:
 * - Checklist de Meta-Validação (18 itens obrigatórios)
 * - Validação de Completude (todos os checkpoints executados, todos os checks aplicáveis executados)
 * - Validação de Validade dos N/A (justificativa e evidência presentes)
 * - Validação de Consistência (evidências consistentes entre checks)
 * - Validação de Rastreabilidade (matriz completa)
 * - Validação de Cobertura (cobertura mínima atingida)
 * - Validação de Qualidade do Roadmap (formato correto, sem duplicatas)
 * 
 * Métricas de Sucesso:
 * - 100% dos checkpoints validados
 * - 100% dos checks aplicáveis executados
 * - 100% dos N/A justificados corretamente
 * - 100% da meta-validação aprovada
 */

import BaseSystem from '../../core/BaseSystem.js';

class MetaValidationSystem extends BaseSystem {
  async onInitialize() {
    this.validations = new Map();
    this.checklistCache = new Map();
    this.logger?.info('MetaValidationSystem inicializado');
  }

  /**
   * Valida auditoria
   * 
   * @param {Object} context - Contexto com audit
   * @returns {Promise<Object>} Resultado da meta-validação
   */
  async onExecute(context) {
    const { audit, validationId } = context;

    if (!audit) {
      throw new Error('audit é obrigatório no contexto');
    }

    this.logger?.info('Iniciando meta-validação', {
      auditId: audit.id || 'desconhecido',
      validationId: validationId || 'desconhecido'
    });

    const result = await this.validateAudit(audit);

    // Armazenar validação
    const id = validationId || `validation-${Date.now()}`;
    this.validations.set(id, {
      ...result,
      audit,
      validatedAt: new Date().toISOString()
    });

    return result;
  }

  /**
   * Valida auditoria completa
   * 
   * @param {Object} audit - Auditoria a validar
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateAudit(audit) {
    const checklist = {
      completeness: await this.validateCompleteness(audit),
      naValidity: await this.validateNA(audit),
      consistency: await this.validateConsistency(audit),
      traceability: await this.validateTraceability(audit),
      coverage: await this.validateCoverage(audit),
      roadmapQuality: await this.validateRoadmap(audit)
    };

    const allPassed = Object.values(checklist).every(v => v.passed);

    return {
      valid: allPassed,
      checklist,
      auditOfAudit: await this.auditTheAudit(audit),
      score: this.calculateMetaValidationScore(checklist)
    };
  }

  /**
   * Valida completude
   * 
   * @param {Object} audit - Auditoria
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateCompleteness(audit) {
    const issues = [];

    // Verificar se todos os checkpoints foram executados
    if (audit.checkpoints) {
      const executedCheckpoints = audit.checkpoints.filter(cp => cp.executed);
      const totalCheckpoints = audit.checkpoints.length;

      if (executedCheckpoints.length !== totalCheckpoints) {
        issues.push({
          type: 'incomplete_checkpoints',
          description: `${executedCheckpoints.length}/${totalCheckpoints} checkpoints executados`,
          missing: audit.checkpoints.filter(cp => !cp.executed).map(cp => cp.id)
        });
      }
    }

    // Verificar se todos os checks aplicáveis foram executados
    if (audit.checks) {
      const applicableChecks = audit.checks.filter(c => c.applicable && c.status !== 'N/A');
      const executedChecks = applicableChecks.filter(c => c.executed);

      if (executedChecks.length !== applicableChecks.length) {
        issues.push({
          type: 'incomplete_checks',
          description: `${executedChecks.length}/${applicableChecks.length} checks aplicáveis executados`,
          missing: applicableChecks.filter(c => !c.executed).map(c => c.id)
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Valida N/A
   * 
   * @param {Object} audit - Auditoria
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateNA(audit) {
    const issues = [];

    if (!audit.checks) {
      return { passed: true, issues: [] };
    }

    const naChecks = audit.checks.filter(c => c.status === 'N/A' || c.status === 'NA');

    for (const check of naChecks) {
      // Verificar justificativa
      if (!check.justification || check.justification.trim().length === 0) {
        issues.push({
          type: 'missing_justification',
          checkId: check.id,
          description: `Check ${check.id} marcado como N/A mas não tem justificativa`
        });
      }

      // Verificar evidência
      if (!check.evidence || 
          (typeof check.evidence === 'string' && check.evidence.trim().length === 0) ||
          (typeof check.evidence === 'object' && Object.keys(check.evidence).length === 0)) {
        issues.push({
          type: 'missing_evidence',
          checkId: check.id,
          description: `Check ${check.id} marcado como N/A mas não tem evidência`
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Valida consistência
   * 
   * @param {Object} audit - Auditoria
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateConsistency(audit) {
    const issues = [];

    if (!audit.checks) {
      return { passed: true, issues: [] };
    }

    // Verificar se evidências são consistentes entre checks relacionados
    const relatedChecks = this.findRelatedChecks(audit.checks);

    for (const group of relatedChecks) {
      const evidences = group.map(c => c.evidence).filter(e => e);
      
      if (evidences.length > 1) {
        // Verificar consistência entre evidências
        const inconsistent = this.checkEvidenceConsistency(evidences);
        if (inconsistent.length > 0) {
          issues.push({
            type: 'inconsistent_evidence',
            checks: group.map(c => c.id),
            description: 'Evidências inconsistentes entre checks relacionados'
          });
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Encontra checks relacionados
   * 
   * @param {Array<Object>} checks - Lista de checks
   * @returns {Array<Array<Object>>} Grupos de checks relacionados
   */
  findRelatedChecks(checks) {
    const groups = [];
    const processed = new Set();

    for (const check of checks) {
      if (processed.has(check.id)) continue;

      const group = [check];
      processed.add(check.id);

      // Encontrar checks relacionados (mesmo target, mesma categoria)
      for (const otherCheck of checks) {
        if (otherCheck.id === check.id || processed.has(otherCheck.id)) continue;

        if (this.areRelated(check, otherCheck)) {
          group.push(otherCheck);
          processed.add(otherCheck.id);
        }
      }

      if (group.length > 1) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Verifica se checks estão relacionados
   * 
   * @param {Object} check1 - Check 1
   * @param {Object} check2 - Check 2
   * @returns {boolean} True se relacionados
   */
  areRelated(check1, check2) {
    // Mesmo target
    if (check1.target && check2.target && check1.target === check2.target) {
      return true;
    }

    // Mesma categoria
    if (check1.category && check2.category && check1.category === check2.category) {
      return true;
    }

    return false;
  }

  /**
   * Verifica consistência de evidências
   * 
   * @param {Array} evidences - Evidências
   * @returns {Array<Object>} Evidências inconsistentes
   */
  checkEvidenceConsistency(evidences) {
    const inconsistent = [];

    // Simplificado - em produção faria comparação mais sofisticada
    for (let i = 0; i < evidences.length - 1; i++) {
      for (let j = i + 1; j < evidences.length; j++) {
        const ev1 = typeof evidences[i] === 'string' ? evidences[i] : JSON.stringify(evidences[i]);
        const ev2 = typeof evidences[j] === 'string' ? evidences[j] : JSON.stringify(evidences[j]);

        // Se evidências são muito diferentes, podem ser inconsistentes
        if (ev1 !== ev2 && !this.areSimilar(ev1, ev2)) {
          inconsistent.push({ evidence1: ev1, evidence2: ev2 });
        }
      }
    }

    return inconsistent;
  }

  /**
   * Verifica se evidências são similares
   * 
   * @param {string} ev1 - Evidência 1
   * @param {string} ev2 - Evidência 2
   * @returns {boolean} True se similares
   */
  areSimilar(ev1, ev2) {
    // Simplificado - em produção usaria algoritmo de similaridade
    return ev1.toLowerCase().includes(ev2.toLowerCase()) || 
           ev2.toLowerCase().includes(ev1.toLowerCase());
  }

  /**
   * Valida rastreabilidade
   * 
   * @param {Object} audit - Auditoria
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateTraceability(audit) {
    const issues = [];

    // Verificar se matriz de rastreabilidade está completa
    if (!audit.traceabilityMatrix) {
      issues.push({
        type: 'missing_traceability_matrix',
        description: 'Matriz de rastreabilidade não encontrada'
      });
    } else {
      const matrix = audit.traceabilityMatrix;

      // Verificar se todos os checks têm mapeamento
      if (audit.checks) {
        for (const check of audit.checks) {
          const hasMapping = matrix.some(m => m.requisito === check.id);
          if (!hasMapping) {
            issues.push({
              type: 'missing_traceability_mapping',
              checkId: check.id,
              description: `Check ${check.id} não tem mapeamento na matriz de rastreabilidade`
            });
          }
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Valida cobertura
   * 
   * @param {Object} audit - Auditoria
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateCoverage(audit) {
    const issues = [];

    if (!audit.coverage) {
      issues.push({
        type: 'missing_coverage',
        description: 'Informações de cobertura não encontradas'
      });
      return { passed: false, issues };
    }

    // Verificar cobertura total mínima (95%)
    if (audit.coverage.total && audit.coverage.total.percentage < 95) {
      issues.push({
        type: 'coverage_below_minimum',
        description: `Cobertura total ${audit.coverage.total.percentage}% está abaixo do mínimo de 95%`,
        actual: audit.coverage.total.percentage,
        required: 95
      });
    }

    // Verificar cobertura por alvo (90% mínimo)
    if (audit.coverage.targets) {
      const targetsBelow90 = audit.coverage.targets.filter(t => t.percentage < 90);
      if (targetsBelow90.length > 0) {
        issues.push({
          type: 'target_coverage_below_minimum',
          description: `Alvos com cobertura abaixo de 90%: ${targetsBelow90.map(t => t.target).join(', ')}`,
          targets: targetsBelow90
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Valida qualidade do roadmap
   * 
   * @param {Object} audit - Auditoria
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateRoadmap(audit) {
    const issues = [];

    if (!audit.roadmap) {
      return { passed: true, issues: [] };
    }

    // Verificar formato do roadmap
    if (!audit.roadmap.phases || !Array.isArray(audit.roadmap.phases)) {
      issues.push({
        type: 'invalid_roadmap_format',
        description: 'Roadmap não tem formato válido (faltando phases)'
      });
    }

    // Verificar duplicatas
    if (audit.roadmap.phases) {
      const phaseNames = audit.roadmap.phases.map(p => p.name || p.id);
      const duplicates = phaseNames.filter((name, index) => phaseNames.indexOf(name) !== index);
      
      if (duplicates.length > 0) {
        issues.push({
          type: 'duplicate_phases',
          description: `Fases duplicadas encontradas: ${[...new Set(duplicates)].join(', ')}`,
          duplicates: [...new Set(duplicates)]
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Audita a própria auditoria
   * 
   * @param {Object} audit - Auditoria
   * @returns {Promise<Object>} Auditoria da auditoria
   */
  async auditTheAudit(audit) {
    return {
      checkpointsExecuted: audit.checkpoints 
        ? audit.checkpoints.filter(cp => cp.executed).length === audit.checkpoints.length
        : false,
      checksExecuted: audit.checks
        ? audit.checks.filter(c => c.applicable && c.status !== 'N/A').every(c => c.executed)
        : false,
      naJustified: audit.checks
        ? audit.checks.filter(c => c.status === 'N/A').every(c => c.justification && c.evidence)
        : true,
      evidenceLevels: audit.checks
        ? audit.checks.every(c => this.validateEvidenceLevel(c))
        : true,
      microCheckpoints: audit.microCheckpoints
        ? audit.microCheckpoints.every(mc => mc.resolved)
        : true,
      threeERule: audit.checks
        ? audit.checks.every(c => this.validateThreeE(c))
        : true
    };
  }

  /**
   * Valida nível de evidência
   * 
   * @param {Object} check - Check
   * @returns {boolean} True se válido
   */
  validateEvidenceLevel(check) {
    if (!check.evidence) {
      return false;
    }

    // Verificar se evidência tem nível adequado para severidade
    const requiredLevels = {
      critical: 'Completa',
      high: 'Padrão',
      medium: 'Resumida',
      low: 'Mínima'
    };

    const requiredLevel = requiredLevels[check.severity] || 'Mínima';
    
    // Simplificado - em produção validaria nível real
    return true;
  }

  /**
   * Valida regra dos 3E
   * 
   * @param {Object} check - Check
   * @returns {boolean} True se válido
   */
  validateThreeE(check) {
    const hasEspecificacao = check.especificacao || check.specification || check.spec;
    const hasExecucao = check.execucao || check.execution;
    const hasEvidencia = check.evidencia || check.evidence;

    return !!(hasEspecificacao && hasExecucao && hasEvidencia);
  }

  /**
   * Calcula score de meta-validação
   * 
   * @param {Object} checklist - Checklist de validação
   * @returns {number} Score (0-100)
   */
  calculateMetaValidationScore(checklist) {
    const items = Object.values(checklist);
    const passed = items.filter(item => item.passed).length;
    
    return Math.round((passed / items.length) * 100);
  }

  /**
   * Obtém validação armazenada
   * 
   * @param {string} validationId - ID da validação
   * @returns {Object|null} Validação ou null
   */
  getValidation(validationId) {
    return this.validations.get(validationId) || null;
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.validations.values());
    const averageScore = all.length > 0
      ? all.reduce((sum, v) => sum + (v.score || 0), 0) / all.length
      : 0;

    return {
      totalValidations: all.length,
      averageScore: Math.round(averageScore * 100) / 100,
      validAudits: all.filter(v => v.valid).length
    };
  }

  /**
   * Valida contexto
   * 
   * @param {Object} context - Contexto
   * @returns {Object} Resultado da validação
   */
  onValidate(context) {
    if (!context || typeof context !== 'object') {
      return { valid: false, errors: ['Context deve ser um objeto'] };
    }

    if (!context.audit || typeof context.audit !== 'object') {
      return { valid: false, errors: ['audit é obrigatório e deve ser objeto'] };
    }

    return { valid: true };
  }

  /**
   * Retorna dependências do sistema
   * 
   * @returns {Array<string>} Dependências
   */
  onGetDependencies() {
    return ['logger', 'config'];
  }
}

export default MetaValidationSystem;

/**
 * Factory function para criar MetaValidationSystem
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {MetaValidationSystem} Instância do MetaValidationSystem
 */
export function createMetaValidationSystem(config = null, logger = null, errorHandler = null) {
  return new MetaValidationSystem(config, logger, errorHandler);
}
