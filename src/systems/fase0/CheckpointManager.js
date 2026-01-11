/**
 * CheckpointManager - Sistema de Checkpoints Obrigatórios com Portões de Qualidade
 * 
 * Estrutura processo com portões de qualidade em pontos críticos.
 * 
 * Funcionalidades:
 * - 5 Checkpoints Obrigatórios (Baseline, Alvos, Execução, Evidências, Roadmap)
 * - Validação de Portões de Qualidade
 * - Bloqueio de Progressão se checkpoint falhar
 * 
 * Métricas de Sucesso:
 * - 100% dos checkpoints obrigatórios executados
 * - 100% dos portões de qualidade validados
 * - 0% de progressão sem checkpoint aprovado
 */

import BaseSystem from '../../core/BaseSystem.js';

class CheckpointManager extends BaseSystem {
  async onInitialize() {
    this.checkpoints = new Map();
    this.initializeDefaultCheckpoints();
    this.logger?.info('CheckpointManager inicializado');
  }

  /**
   * Inicializa checkpoints padrão
   */
  initializeDefaultCheckpoints() {
    const defaultCheckpoints = [
      {
        id: 'checkpoint-1',
        name: 'Scoping e Baseline',
        required: true,
        qualityGate: {
          requiredFields: ['baseline', 'targets', 'applicableChecks'],
          validators: ['baselineComplete', 'targetsDefined']
        },
        payload: {
          baseline: null,
          targets: null,
          applicableChecks: null,
          preconditions: null
        }
      },
      {
        id: 'checkpoint-2',
        name: 'Validação Preventiva',
        required: true,
        qualityGate: {
          requiredFields: ['preChecks', 'apisValidated', 'impactAnalysis'],
          validators: ['preChecksExecuted', 'apisValidated']
        },
        payload: {
          preChecks: null,
          apisValidated: null,
          impactAnalysis: null,
          dependencies: null,
          implicitRequirements: null
        }
      },
      {
        id: 'checkpoint-3',
        name: 'Execução Técnica',
        required: true,
        qualityGate: {
          requiredFields: ['evidence', 'errors', 'coverage', 'score'],
          validators: ['evidenceCollected', 'errorsDeduplicated', 'coverageCalculated']
        },
        payload: {
          evidence: null,
          errors: null,
          coverage: null,
          score: null
        }
      },
      {
        id: 'checkpoint-4',
        name: 'Verificação Física',
        required: true,
        qualityGate: {
          requiredFields: ['verificationChecks', 'flexibilityChecks', 'consistencyChecks', 'traceability'],
          validators: ['verificationChecksExecuted', 'traceabilityComplete']
        },
        payload: {
          verificationChecks: null,
          flexibilityChecks: null,
          consistencyChecks: null,
          traceability: null
        }
      },
      {
        id: 'checkpoint-5',
        name: 'Pre-entrega',
        required: true,
        qualityGate: {
          requiredFields: ['metaValidation', 'roadmap', 'finalScore', 'justifications'],
          validators: ['metaValidationComplete', 'roadmapGenerated', 'scoreCalculated']
        },
        payload: {
          metaValidation: null,
          roadmap: null,
          finalScore: null,
          justifications: null,
          antiPatterns: null
        }
      }
    ];

    for (const checkpoint of defaultCheckpoints) {
      this.checkpoints.set(checkpoint.id, {
        ...checkpoint,
        completed: false,
        completedAt: null,
        validated: false
      });
    }
  }

  /**
   * Valida checkpoint
   * 
   * @param {Object} context - Contexto com checkpointId e data
   * @returns {Promise<Object>} Resultado da validação
   */
  async onExecute(context) {
    const { checkpointId, data, action } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'validate') {
      if (!checkpointId) {
        throw new Error('checkpointId é obrigatório para validate');
      }
      return await this.validateCheckpoint(checkpointId, data);
    } else if (action === 'enforce') {
      if (!checkpointId) {
        throw new Error('checkpointId é obrigatório para enforce');
      }
      return await this.enforceCheckpoint(checkpointId);
    } else if (action === 'complete') {
      if (!checkpointId) {
        throw new Error('checkpointId é obrigatório para complete');
      }
      return await this.completeCheckpoint(checkpointId, data);
    } else if (action === 'get') {
      if (!checkpointId) {
        throw new Error('checkpointId é obrigatório para get');
      }
      return await this.getCheckpoint(checkpointId);
    } else if (action === 'list') {
      return await this.listCheckpoints();
    } else {
      throw new Error(`Ação desconhecida: ${action}. Use: validate, enforce, complete, get, list`);
    }
  }

  /**
   * Valida checkpoint
   * 
   * @param {string} checkpointId - ID do checkpoint
   * @param {Object} data - Dados do checkpoint
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateCheckpoint(checkpointId, data) {
    const checkpoint = this.getCheckpoint(checkpointId);

    if (!checkpoint) {
      throw new Error(`Checkpoint não encontrado: ${checkpointId}`);
    }

    this.logger?.info(`Validando checkpoint: ${checkpoint.name}`, { checkpointId });

    // Validar portão de qualidade
    const validation = await this.validateQualityGate(checkpoint, data);

    if (!validation.passed) {
      this.logger?.warn('Checkpoint não passou no portão de qualidade', {
        checkpointId,
        failures: validation.failures
      });

      return {
        passed: false,
        blocked: true,
        reasons: validation.failures,
        requiredActions: validation.requiredActions,
        checkpoint: checkpoint.name
      };
    }

    this.logger?.info('Checkpoint passou no portão de qualidade', { checkpointId });

    return {
      passed: true,
      blocked: false,
      checkpoint: checkpoint.name
    };
  }

  /**
   * Valida portão de qualidade
   * 
   * @param {Object} checkpoint - Checkpoint
   * @param {Object} data - Dados
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateQualityGate(checkpoint, data) {
    const failures = [];
    const requiredActions = [];

    // Validar campos obrigatórios
    if (checkpoint.qualityGate.requiredFields) {
      for (const field of checkpoint.qualityGate.requiredFields) {
        if (!data || data[field] === null || data[field] === undefined) {
          failures.push(`Campo obrigatório faltando: ${field}`);
          requiredActions.push(`Fornecer valor para: ${field}`);
        }
      }
    }

    // Executar validadores customizados
    if (checkpoint.qualityGate.validators) {
      for (const validatorName of checkpoint.qualityGate.validators) {
        const validator = this.getValidator(validatorName);
        if (validator) {
          const result = await validator(data, checkpoint);
          if (!result.valid) {
            failures.push(...result.errors);
            requiredActions.push(...result.actions);
          }
        }
      }
    }

    return {
      passed: failures.length === 0,
      failures,
      requiredActions
    };
  }

  /**
   * Obtém validador por nome
   * 
   * @param {string} validatorName - Nome do validador
   * @returns {Function|null} Validador ou null
   */
  getValidator(validatorName) {
    const validators = {
      baselineComplete: (data) => {
        if (!data.baseline || typeof data.baseline !== 'object') {
          return { valid: false, errors: ['Baseline deve ser um objeto completo'], actions: [] };
        }
        return { valid: true };
      },
      targetsDefined: (data) => {
        if (!data.targets || !Array.isArray(data.targets) || data.targets.length === 0) {
          return { valid: false, errors: ['Alvos devem ser definidos'], actions: [] };
        }
        return { valid: true };
      },
      preChecksExecuted: (data) => {
        if (!data.preChecks || !Array.isArray(data.preChecks)) {
          return { valid: false, errors: ['Checks preventivos devem ser executados'], actions: [] };
        }
        return { valid: true };
      },
      apisValidated: (data) => {
        if (!data.apisValidated || typeof data.apisValidated !== 'object') {
          return { valid: false, errors: ['APIs devem ser validadas'], actions: [] };
        }
        return { valid: true };
      },
      evidenceCollected: (data) => {
        if (!data.evidence || !Array.isArray(data.evidence)) {
          return { valid: false, errors: ['Evidências devem ser coletadas'], actions: [] };
        }
        return { valid: true };
      },
      errorsDeduplicated: (data) => {
        if (!data.errors || !Array.isArray(data.errors)) {
          return { valid: false, errors: ['Erros devem ser deduplicados'], actions: [] };
        }
        return { valid: true };
      },
      coverageCalculated: (data) => {
        if (!data.coverage || typeof data.coverage !== 'object') {
          return { valid: false, errors: ['Cobertura deve ser calculada'], actions: [] };
        }
        return { valid: true };
      },
      verificationChecksExecuted: (data) => {
        if (!data.verificationChecks || !Array.isArray(data.verificationChecks)) {
          return { valid: false, errors: ['Checks de verificação devem ser executados'], actions: [] };
        }
        return { valid: true };
      },
      traceabilityComplete: (data) => {
        if (!data.traceability || typeof data.traceability !== 'object') {
          return { valid: false, errors: ['Matriz de rastreabilidade deve estar completa'], actions: [] };
        }
        return { valid: true };
      },
      metaValidationComplete: (data) => {
        if (!data.metaValidation || typeof data.metaValidation !== 'object') {
          return { valid: false, errors: ['Meta-validação deve estar completa'], actions: [] };
        }
        return { valid: true };
      },
      roadmapGenerated: (data) => {
        if (!data.roadmap || typeof data.roadmap !== 'object') {
          return { valid: false, errors: ['Roadmap deve ser gerado'], actions: [] };
        }
        return { valid: true };
      },
      scoreCalculated: (data) => {
        if (!data.finalScore || typeof data.finalScore !== 'number') {
          return { valid: false, errors: ['Score final deve ser calculado'], actions: [] };
        }
        return { valid: true };
      }
    };

    return validators[validatorName] || null;
  }

  /**
   * Força checkpoint obrigatório
   * 
   * @param {string} checkpointId - ID do checkpoint
   * @returns {Promise<Object>} Resultado
   */
  async enforceCheckpoint(checkpointId) {
    const checkpoint = this.getCheckpoint(checkpointId);

    if (!checkpoint) {
      throw new Error(`Checkpoint não encontrado: ${checkpointId}`);
    }

    if (checkpoint.required && !checkpoint.completed) {
      const error = new Error(
        `Checkpoint obrigatório '${checkpoint.name}' (${checkpointId}) não foi completado`
      );
      this.logger?.error('Checkpoint obrigatório não completado', {
        checkpointId,
        checkpoint: checkpoint.name
      });
      throw error;
    }

    return {
      enforced: true,
      checkpoint: checkpoint.name,
      completed: checkpoint.completed
    };
  }

  /**
   * Completa checkpoint
   * 
   * @param {string} checkpointId - ID do checkpoint
   * @param {Object} data - Dados do checkpoint
   * @returns {Promise<Object>} Resultado
   */
  async completeCheckpoint(checkpointId, data) {
    const checkpoint = this.getCheckpoint(checkpointId);

    if (!checkpoint) {
      throw new Error(`Checkpoint não encontrado: ${checkpointId}`);
    }

    // Validar antes de completar
    const validation = await this.validateCheckpoint(checkpointId, data);

    if (!validation.passed) {
      throw new Error(
        `Checkpoint não pode ser completado. Falhas: ${validation.reasons.join(', ')}`
      );
    }

    // Completar checkpoint
    checkpoint.completed = true;
    checkpoint.completedAt = new Date().toISOString();
    checkpoint.validated = true;
    checkpoint.payload = { ...checkpoint.payload, ...data };

    this.checkpoints.set(checkpointId, checkpoint);

    this.logger?.info('Checkpoint completado', {
      checkpointId,
      checkpoint: checkpoint.name,
      completedAt: checkpoint.completedAt
    });

    return {
      completed: true,
      checkpoint: checkpoint.name,
      completedAt: checkpoint.completedAt
    };
  }

  /**
   * Obtém checkpoint
   * 
   * @param {string} checkpointId - ID do checkpoint
   * @returns {Object|null} Checkpoint ou null
   */
  getCheckpoint(checkpointId) {
    return this.checkpoints.get(checkpointId) || null;
  }

  /**
   * Lista todos os checkpoints
   * 
   * @returns {Promise<Array<Object>>} Lista de checkpoints
   */
  async listCheckpoints() {
    return Array.from(this.checkpoints.values()).map(cp => ({
      id: cp.id,
      name: cp.name,
      required: cp.required,
      completed: cp.completed,
      completedAt: cp.completedAt
    }));
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.checkpoints.values());
    const completed = all.filter(cp => cp.completed);
    const required = all.filter(cp => cp.required);
    const requiredCompleted = required.filter(cp => cp.completed);

    return {
      total: all.length,
      completed: completed.length,
      required: required.length,
      requiredCompleted: requiredCompleted.length,
      completionRate: all.length > 0 ? (completed.length / all.length) * 100 : 0,
      requiredCompletionRate: required.length > 0 ? (requiredCompleted.length / required.length) * 100 : 0
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

    if (!context.action || typeof context.action !== 'string') {
      return { valid: false, errors: ['action é obrigatório e deve ser string'] };
    }

    const validActions = ['validate', 'enforce', 'complete', 'get', 'list'];
    if (!validActions.includes(context.action)) {
      return { valid: false, errors: [`action deve ser um de: ${validActions.join(', ')}`] };
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

export default CheckpointManager;

/**
 * Factory function para criar CheckpointManager
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {CheckpointManager} Instância do CheckpointManager
 */
export function createCheckpointManager(config = null, logger = null, errorHandler = null) {
  return new CheckpointManager(config, logger, errorHandler);
}
