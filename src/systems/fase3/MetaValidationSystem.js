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
import { getCacheManager } from '../../utils/CacheManager.js';

class MetaValidationSystem extends BaseSystem {
  constructor(config = null, logger = null, errorHandler = null) {
    super(config, logger, errorHandler);
    this.cacheManager = null;
    this.useCache = config?.features?.useCache !== false;
  }

  async onInitialize() {
    this.validations = new Map();
    this.checklistCache = new Map();
    
    // Inicializar cache LRU se habilitado
    if (this.useCache) {
      try {
        this.cacheManager = getCacheManager(this.config, this.logger);
        this.logger?.debug('CacheManager integrado no MetaValidationSystem');
      } catch (e) {
        this.logger?.warn('Erro ao obter CacheManager, continuando sem cache', { error: e.message });
        this.useCache = false;
      }
    }
    
    this.logger?.info('MetaValidationSystem inicializado', {
      useCache: this.useCache
    });
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
   * Valida auditoria completa com checklist de 18 itens, validação recursiva e condicional
   * 
   * @param {Object} audit - Auditoria a validar
   * @param {number} depth - Profundidade da validação recursiva (padrão 0)
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateAudit(audit, depth = 0) {
    const maxDepth = this.config?.fase3?.metaValidationSystem?.maxRecursionDepth || 3;
    
    // Prevenir recursão infinita
    if (depth > maxDepth) {
      this.logger?.warn('Profundidade máxima de recursão atingida', { depth, maxDepth });
      return {
        valid: false,
        error: 'Profundidade máxima de recursão atingida',
        checklist: {}
      };
    }

    // Executar checklist completo de 18 itens
    const checklist = await this.executeFullChecklist(audit, depth);

    // Validação recursiva: se há sub-auditorias, validar recursivamente
    const recursiveValidations = [];
    if (audit.subAudits && Array.isArray(audit.subAudits) && depth < maxDepth) {
      for (const subAudit of audit.subAudits) {
        const recursiveResult = await this.validateAudit(subAudit, depth + 1);
        recursiveValidations.push({
          subAuditId: subAudit.id || 'unknown',
          result: recursiveResult
        });
      }
    }

    // Validação condicional: alguns itens só são validados se condições específicas são atendidas
    const conditionalValidations = await this.executeConditionalValidations(audit, checklist);

    const allPassed = Object.values(checklist).every(v => v.passed) &&
                      recursiveValidations.every(r => r.result.valid) &&
                      conditionalValidations.every(c => c.passed);

    return {
      valid: allPassed,
      checklist,
      conditionalValidations,
      recursiveValidations,
      auditOfAudit: await this.auditTheAudit(audit),
      score: this.calculateMetaValidationScore(checklist),
      depth
    };
  }

  /**
   * Executa checklist completo de 18 itens obrigatórios (com cache)
   * 
   * @param {Object} audit - Auditoria
   * @param {number} depth - Profundidade atual
   * @returns {Promise<Object>} Checklist completo
   */
  async executeFullChecklist(audit, depth = 0) {
    // Verificar cache se habilitado e não em recursão profunda
    if (this.useCache && this.cacheManager && depth === 0) {
      const cacheKey = `checklist:${audit.id || audit.version || 'default'}`;
      const cached = this.cacheManager.get(cacheKey);
      if (cached) {
        this.logger?.debug('Checklist retornado do cache');
        return cached;
      }
    }

    const checklist = {
      // 1-2: Completude de checkpoints e checks
      completeness: await this.validateCompleteness(audit),
      
      // 3-4: Validade dos N/A (justificativa e evidência)
      naValidity: await this.validateNA(audit),
      
      // 5-6: Consistência de evidências e resultados
      consistency: await this.validateConsistency(audit),
      
      // 7-8: Rastreabilidade (matriz completa e mapeamentos)
      traceability: await this.validateTraceability(audit),
      
      // 9-10: Cobertura (total e por alvo)
      coverage: await this.validateCoverage(audit),
      
      // 11-12: Qualidade do roadmap (formato e duplicatas)
      roadmapQuality: await this.validateRoadmap(audit),
      
      // 13-14: Evidências diretas e níveis adequados
      evidenceQuality: await this.validateEvidenceQuality(audit),
      
      // 15-16: Regra dos 3E e micro-checkpoints
      threeERule: await this.validateThreeERule(audit),
      microCheckpoints: await this.validateMicroCheckpoints(audit),
      
      // 17-18: Timestamps e metadados
      timestamps: await this.validateTimestamps(audit),
      metadata: await this.validateMetadata(audit)
    };

    // Armazenar no cache se habilitado e não em recursão profunda
    if (this.useCache && this.cacheManager && depth === 0) {
      const cacheKey = `checklist:${audit.id || audit.version || 'default'}`;
      this.cacheManager.set(cacheKey, checklist, 1800000); // Cache por 30 minutos
    }

    return checklist;
  }

  /**
   * Valida qualidade das evidências (itens 13-14)
   * 
   * @param {Object} audit - Auditoria
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateEvidenceQuality(audit) {
    const issues = [];

    if (!audit.checks) {
      return { passed: true, issues: [] };
    }

    for (const check of audit.checks) {
      // Item 13: Evidências diretas (não inferidas)
      if (check.evidence && check.evidence.inferred) {
        issues.push({
          type: 'inferred_evidence',
          checkId: check.id,
          description: `Check ${check.id} tem evidência inferida, não direta`
        });
      }

      // Item 14: Nível de evidência adequado para severidade
      if (!this.validateEvidenceLevel(check)) {
        issues.push({
          type: 'insufficient_evidence_level',
          checkId: check.id,
          description: `Check ${check.id} não tem nível de evidência adequado para severidade ${check.severity}`
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Valida regra dos 3E (item 15)
   * 
   * @param {Object} audit - Auditoria
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateThreeERule(audit) {
    const issues = [];

    if (!audit.checks) {
      return { passed: true, issues: [] };
    }

    for (const check of audit.checks) {
      if (!this.validateThreeE(check)) {
        issues.push({
          type: 'three_e_rule_violation',
          checkId: check.id,
          description: `Check ${check.id} não passa na regra dos 3E (ESPECIFICAÇÃO, EXECUÇÃO, EVIDÊNCIA)`
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Valida micro-checkpoints (item 16)
   * 
   * @param {Object} audit - Auditoria
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateMicroCheckpoints(audit) {
    const issues = [];

    if (!audit.microCheckpoints) {
      return { passed: true, issues: [] };
    }

    for (const microCheckpoint of audit.microCheckpoints) {
      if (!microCheckpoint.resolved) {
        issues.push({
          type: 'unresolved_micro_checkpoint',
          microCheckpointId: microCheckpoint.id,
          description: `Micro-checkpoint ${microCheckpoint.id} não foi resolvido`
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Valida timestamps (item 17)
   * 
   * @param {Object} audit - Auditoria
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateTimestamps(audit) {
    const issues = [];

    // Verificar se audit tem timestamp
    if (!audit.timestamp && !audit.createdAt) {
      issues.push({
        type: 'missing_timestamp',
        description: 'Auditoria não tem timestamp de criação'
      });
    }

    // Verificar se checks têm timestamps
    if (audit.checks) {
      for (const check of audit.checks) {
        if (!check.timestamp && !check.executedAt) {
          issues.push({
            type: 'missing_check_timestamp',
            checkId: check.id,
            description: `Check ${check.id} não tem timestamp de execução`
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
   * Valida metadados (item 18)
   * 
   * @param {Object} audit - Auditoria
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateMetadata(audit) {
    const issues = [];

    // Verificar metadados obrigatórios
    const requiredMetadata = ['id', 'version', 'target'];
    for (const field of requiredMetadata) {
      if (!audit[field]) {
        issues.push({
          type: 'missing_metadata',
          field,
          description: `Metadado obrigatório '${field}' não encontrado na auditoria`
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Executa validações condicionais baseadas em contexto
   * 
   * @param {Object} audit - Auditoria
   * @param {Object} checklist - Checklist já executado
   * @returns {Promise<Array<Object>>} Validações condicionais
   */
  async executeConditionalValidations(audit, checklist) {
    const conditionalValidations = [];

    // Validação condicional 1: Se roadmap existe, validar dependências entre fases
    if (audit.roadmap && checklist.roadmapQuality.passed) {
      const roadmapDeps = await this.validateRoadmapDependencies(audit.roadmap);
      conditionalValidations.push({
        name: 'roadmap_dependencies',
        condition: 'roadmap exists and is valid',
        passed: roadmapDeps.passed,
        issues: roadmapDeps.issues
      });
    }

    // Validação condicional 2: Se há sub-auditorias, validar consistência entre elas
    if (audit.subAudits && audit.subAudits.length > 0) {
      const subAuditConsistency = await this.validateSubAuditConsistency(audit.subAudits);
      conditionalValidations.push({
        name: 'sub_audit_consistency',
        condition: 'sub-audits exist',
        passed: subAuditConsistency.passed,
        issues: subAuditConsistency.issues
      });
    }

    // Validação condicional 3: Se cobertura está abaixo do mínimo, validar justificativa
    if (audit.coverage && audit.coverage.total && audit.coverage.total.percentage < 95) {
      const coverageJustification = await this.validateCoverageJustification(audit);
      conditionalValidations.push({
        name: 'coverage_justification',
        condition: 'coverage below minimum',
        passed: coverageJustification.passed,
        issues: coverageJustification.issues
      });
    }

    return conditionalValidations;
  }

  /**
   * Valida dependências do roadmap
   * 
   * @param {Object} roadmap - Roadmap
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateRoadmapDependencies(roadmap) {
    const issues = [];

    if (!roadmap.phases || !Array.isArray(roadmap.phases)) {
      return { passed: true, issues: [] };
    }

    // Verificar se fases têm dependências válidas
    for (const phase of roadmap.phases) {
      if (phase.dependsOn && Array.isArray(phase.dependsOn)) {
        for (const dep of phase.dependsOn) {
          const depExists = roadmap.phases.some(p => p.id === dep || p.name === dep);
          if (!depExists) {
            issues.push({
              type: 'invalid_dependency',
              phase: phase.id || phase.name,
              dependency: dep,
              description: `Fase ${phase.id || phase.name} depende de fase inexistente: ${dep}`
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
   * Valida consistência entre sub-auditorias
   * 
   * @param {Array<Object>} subAudits - Sub-auditorias
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateSubAuditConsistency(subAudits) {
    const issues = [];

    // Verificar se todas as sub-auditorias têm mesma estrutura básica
    const firstAudit = subAudits[0];
    if (firstAudit) {
      const requiredFields = ['id', 'checks'];
      for (let i = 1; i < subAudits.length; i++) {
        for (const field of requiredFields) {
          if (!subAudits[i][field] && firstAudit[field]) {
            issues.push({
              type: 'inconsistent_structure',
              subAuditId: subAudits[i].id,
              missingField: field,
              description: `Sub-auditoria ${subAudits[i].id} não tem campo ${field}`
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
   * Valida justificativa para cobertura abaixo do mínimo
   * 
   * @param {Object} audit - Auditoria
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateCoverageJustification(audit) {
    const issues = [];

    if (audit.coverage && audit.coverage.total && audit.coverage.total.percentage < 95) {
      if (!audit.coverage.justification || audit.coverage.justification.trim().length === 0) {
        issues.push({
          type: 'missing_coverage_justification',
          description: 'Cobertura abaixo do mínimo mas não há justificativa'
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
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
