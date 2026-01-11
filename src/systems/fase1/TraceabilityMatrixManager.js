/**
 * TraceabilityMatrixManager - Sistema de Matriz de Rastreabilidade
 * 
 * Mapeia requisito→artefato→teste→evidência.
 * 
 * Funcionalidades:
 * - Mapeamento (mapear cada check para artefato produzido, artefato para teste/validação, teste para evidência)
 * - Validação (validar que artefato existe fisicamente, teste passa, evidência segue nível requerido)
 * 
 * Métricas de Sucesso:
 * - 100% dos requisitos mapeados para artefatos
 * - 100% dos artefatos mapeados para testes
 * - 100% dos testes mapeados para evidências
 */

import BaseSystem from '../../core/BaseSystem.js';
import { existsSync } from 'fs';
import { join } from 'path';

class TraceabilityMatrixManager extends BaseSystem {
  async onInitialize() {
    this.matrices = new Map();
    this.projectRoot = null;
    this.logger?.info('TraceabilityMatrixManager inicializado');
  }

  /**
   * Cria ou valida matriz de rastreabilidade
   * 
   * @param {Object} context - Contexto com checks ou matrix
   * @returns {Promise<Object>} Matriz criada ou validação
   */
  async onExecute(context) {
    const { checks, matrix, matrixId, action = 'create' } = context;

    if (action === 'create') {
      if (!checks) {
        throw new Error('checks é obrigatório para create');
      }
      return await this.createMatrix(checks, matrixId);
    } else if (action === 'validate') {
      if (!matrix && !matrixId) {
        throw new Error('matrix ou matrixId é obrigatório para validate');
      }
      const matrixToValidate = matrix || (matrixId ? this.getMatrix(matrixId) : null);
      if (!matrixToValidate) {
        throw new Error('Matriz não encontrada');
      }
      return await this.validateMatrix(matrixToValidate);
    } else if (action === 'get') {
      if (!matrixId) {
        throw new Error('matrixId é obrigatório para get');
      }
      const matrix = this.getMatrix(matrixId);
      if (!matrix) {
        throw new Error(`Matriz não encontrada: ${matrixId}`);
      }
      return matrix;
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Cria matriz de rastreabilidade
   * 
   * @param {Array<Object>} checks - Lista de checks
   * @param {string} matrixId - ID da matriz (opcional)
   * @returns {Promise<Object>} Matriz criada
   */
  async createMatrix(checks, matrixId = null) {
    const id = matrixId || `matrix-${Date.now()}`;

    const matrix = checks.map(check => ({
      requisito: check.id || check.requisito || null,
      artefato: check.artifact || check.artefato || null,
      teste: check.test || check.teste || null,
      evidencia: check.evidence || check.evidencia || null,
      metadata: {
        checkId: check.id,
        createdAt: new Date().toISOString()
      }
    }));

    const matrixData = {
      id,
      matrix,
      createdAt: new Date().toISOString()
    };

    this.matrices.set(id, matrixData);

    this.logger?.info('Matriz de rastreabilidade criada', {
      matrixId: id,
      rows: matrix.length
    });

    return matrixData;
  }

  /**
   * Valida matriz de rastreabilidade
   * 
   * @param {Object} matrixData - Dados da matriz
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateMatrix(matrixData) {
    const validations = [];
    const matrix = matrixData.matrix || matrixData;

    // Detectar raiz do projeto se necessário
    if (!this.projectRoot) {
      this.projectRoot = this.detectProjectRoot();
    }

    for (const row of matrix) {
      const rowValidation = {
        row,
        errors: [],
        warnings: []
      };

      // Validar campos obrigatórios
      if (!row.requisito || !row.artefato || !row.teste || !row.evidencia) {
        const missing = [];
        if (!row.requisito) missing.push('requisito');
        if (!row.artefato) missing.push('artefato');
        if (!row.teste) missing.push('teste');
        if (!row.evidencia) missing.push('evidencia');

        rowValidation.errors.push({
          type: 'missing_fields',
          message: `Campos faltando: ${missing.join(', ')}`
        });
      } else {
        // Validar que artefato existe fisicamente
        if (!await this.artifactExists(row.artefato)) {
          rowValidation.errors.push({
            type: 'artifact_not_exists',
            message: `Artefato não existe fisicamente: ${row.artefato}`
          });
        }

        // Validar que teste existe
        if (!await this.testExists(row.teste)) {
          rowValidation.warnings.push({
            type: 'test_not_exists',
            message: `Teste não encontrado: ${row.teste}`
          });
        }

        // Validar nível de evidência
        if (!await this.validateEvidenceLevel(row.evidencia, row.requisito)) {
          rowValidation.warnings.push({
            type: 'evidence_level_inadequate',
            message: `Nível de evidência pode ser inadequado para requisito ${row.requisito}`
          });
        }
      }

      if (rowValidation.errors.length > 0 || rowValidation.warnings.length > 0) {
        validations.push(rowValidation);
      }
    }

    const isValid = validations.every(v => v.errors.length === 0);

    return {
      valid: isValid,
      validations,
      totalRows: matrix.length,
      validRows: matrix.length - validations.length,
      invalidRows: validations.filter(v => v.errors.length > 0).length,
      warnings: validations.filter(v => v.warnings.length > 0).length
    };
  }

  /**
   * Verifica se artefato existe fisicamente
   * 
   * @param {string} artifact - Caminho do artefato
   * @returns {Promise<boolean>} True se existe
   */
  async artifactExists(artifact) {
    // Se é caminho relativo, tentar resolver
    let path = artifact;
    if (!path.startsWith('/') && !path.startsWith('.')) {
      path = join(this.projectRoot, path);
    } else if (path.startsWith('.')) {
      path = join(this.projectRoot, path);
    }

    return existsSync(path);
  }

  /**
   * Verifica se teste existe
   * 
   * @param {string} test - Identificador do teste
   * @returns {Promise<boolean>} True se existe
   */
  async testExists(test) {
    // Verificar se é caminho de arquivo
    if (test.includes('/') || test.includes('\\')) {
      let path = test;
      if (!path.startsWith('/') && !path.startsWith('.')) {
        path = join(this.projectRoot, path);
      } else if (path.startsWith('.')) {
        path = join(this.projectRoot, path);
      }
      return existsSync(path);
    }

    // Verificar se é nome de teste (buscar em arquivos de teste)
    // Implementação simplificada - em produção faria busca mais sofisticada
    const testFiles = [
      join(this.projectRoot, 'tests', `${test}.test.js`),
      join(this.projectRoot, 'tests', `${test}.spec.js`),
      join(this.projectRoot, '__tests__', `${test}.test.js`)
    ];

    return testFiles.some(file => existsSync(file));
  }

  /**
   * Valida nível de evidência
   * 
   * @param {*} evidence - Evidência
   * @param {string} requisito - Requisito
   * @returns {Promise<boolean>} True se nível adequado
   */
  async validateEvidenceLevel(evidence, requisito) {
    // Implementação simplificada
    // Em produção, validaria nível de evidência baseado em requisito
    if (typeof evidence === 'string') {
      // Evidência mínima deve ter pelo menos algum conteúdo
      return evidence.trim().length > 0;
    }

    if (typeof evidence === 'object' && evidence !== null) {
      // Evidência estruturada deve ter campos mínimos
      return Object.keys(evidence).length > 0;
    }

    return false;
  }

  /**
   * Detecta raiz do projeto
   * 
   * @returns {string} Caminho da raiz do projeto
   */
  detectProjectRoot() {
    let current = process.cwd();
    const path = require('path');
    const { dirname } = path;

    while (current !== '/' && current !== dirname(current)) {
      if (existsSync(join(current, 'package.json'))) {
        return current;
      }
      const parent = dirname(current);
      if (parent === current) break;
      current = parent;
    }

    return process.cwd();
  }

  /**
   * Obtém matriz
   * 
   * @param {string} matrixId - ID da matriz
   * @returns {Object|null} Matriz ou null
   */
  getMatrix(matrixId) {
    return this.matrices.get(matrixId) || null;
  }

  /**
   * Lista todas as matrizes
   * 
   * @returns {Array<Object>} Lista de matrizes
   */
  listMatrices() {
    return Array.from(this.matrices.values());
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    const all = Array.from(this.matrices.values());
    const totalRows = all.reduce((sum, m) => sum + (m.matrix?.length || 0), 0);

    return {
      totalMatrices: all.length,
      totalRows
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

    if (!context.action) {
      return { valid: false, errors: ['action é obrigatório'] };
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

export default TraceabilityMatrixManager;

/**
 * Factory function para criar TraceabilityMatrixManager
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {TraceabilityMatrixManager} Instância do TraceabilityMatrixManager
 */
export function createTraceabilityMatrixManager(config = null, logger = null, errorHandler = null) {
  return new TraceabilityMatrixManager(config, logger, errorHandler);
}
