/**
 * PredictiveDependencyGuardian
 *
 * Analisa dependências e alerta sobre vulnerabilidades e desatualizações.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { getLogger } from '../utils/Logger.js';

class PredictiveDependencyGuardian {
  constructor(config = null, logger = null) {
    this.config = config;
    this.logger = logger || getLogger(config);
    this.projectRoot = config?.paths?.systemRoot || process.cwd();
    this.useNpmAudit = config?.proactive?.dependencyGuardian?.useNpmAudit === true;
  }

  scan() {
    const packageJsonPath = join(this.projectRoot, 'package.json');
    const packageLockPath = join(this.projectRoot, 'package-lock.json');

    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const deps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {})
    };

    const results = {
      vulnerabilities: [],
      outdated: [],
      deprecated: [],
      total: Object.keys(deps).length,
      auditedAt: new Date().toISOString()
    };

    if (this.useNpmAudit) {
      try {
        const auditRaw = execSync('npm audit --json', {
          cwd: this.projectRoot,
          stdio: ['ignore', 'pipe', 'ignore']
        }).toString();
        const audit = JSON.parse(auditRaw);
        const advisories = audit?.vulnerabilities || {};
        results.vulnerabilities = Object.keys(advisories).map(name => ({
          name,
          severity: advisories[name].severity,
          via: advisories[name].via
        }));
      } catch (error) {
        this.logger?.warn('Falha ao executar npm audit', { error: error.message });
      }
    }

    if (packageLockPath) {
      // placeholder para versões deprecadas/diffs futuras
    }

    return results;
  }
}

let instance = null;

/**
 * Obtém instância singleton do PredictiveDependencyGuardian.
 * @param {object} config - Configuração (opcional)
 * @param {object} logger - Logger (opcional)
 * @returns {PredictiveDependencyGuardian} Instância
 */
export function getPredictiveDependencyGuardian(config = null, logger = null) {
  if (!instance) {
    instance = new PredictiveDependencyGuardian(config, logger);
  }
  return instance;
}

/**
 * Cria nova instância do PredictiveDependencyGuardian.
 * @param {object} config - Configuração
 * @param {object} logger - Logger
 * @returns {PredictiveDependencyGuardian} Nova instância
 */
export function createPredictiveDependencyGuardian(config = null, logger = null) {
  return new PredictiveDependencyGuardian(config, logger);
}

export default PredictiveDependencyGuardian;
