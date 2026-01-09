/**
 * Testes unitários para RequirementAnalyzer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import RequirementAnalyzer, { createRequirementAnalyzer } from '../../src/components/RequirementAnalyzer.js';
import { createLogger } from '../../src/utils/Logger.js';

describe('RequirementAnalyzer', () => {
  let analyzer;
  let logger;

  beforeEach(() => {
    // Criar logger de teste
    logger = createLogger({
      paths: { logs: './logs' },
      logging: { level: 'error' }
    });

    // Criar config de teste
    const config = {};

    analyzer = createRequirementAnalyzer(config, logger);
  });

  describe('inicialização', () => {
    it('deve criar analyzer', () => {
      expect(analyzer).toBeInstanceOf(RequirementAnalyzer);
    });
  });

  describe('analyze', () => {
    it('deve retornar erro para requisitos vazios', () => {
      const result = analyzer.analyze('');
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve analisar requisitos válidos', () => {
      const requirements = 'Criar uma função para validar email';
      const result = analyzer.analyze(requirements);
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('completeness');
      expect(result).toHaveProperty('ambiguities');
    });

    it('deve detectar ambiguidades', () => {
      const requirements = 'Criar sistema melhor e rápido';
      const result = analyzer.analyze(requirements);
      
      expect(result.ambiguities.length).toBeGreaterThan(0);
    });

    it('deve calcular completude', () => {
      const requirements = 'Criar uma função para validar email. A função deve retornar true se o email for válido e false caso contrário. Deve verificar formato básico e domínio.';
      const result = analyzer.analyze(requirements);
      
      expect(result.completeness).toBeGreaterThan(0);
      expect(result.completeness).toBeLessThanOrEqual(1);
    });
  });

  describe('detectAmbiguities', () => {
    it('deve detectar ambiguidade de performance', () => {
      const requirements = 'Sistema deve ser rápido';
      const ambiguities = analyzer.detectAmbiguities(requirements);
      
      expect(ambiguities.length).toBeGreaterThan(0);
      expect(ambiguities.some(a => a.type === 'performance')).toBe(true);
    });

    it('deve detectar ambiguidade de quantificação', () => {
      const requirements = 'Adicionar alguns recursos';
      const ambiguities = analyzer.detectAmbiguities(requirements);
      
      expect(ambiguities.length).toBeGreaterThan(0);
      expect(ambiguities.some(a => a.type === 'quantification')).toBe(true);
    });
  });

  describe('detectMissingRequirements', () => {
    it('deve detectar requisitos faltantes quando contexto requer detalhes técnicos', () => {
      const requirements = 'Criar sistema simples';
      const context = { requireTechnicalDetails: true };
      const missing = analyzer.detectMissingRequirements(requirements, context);
      
      expect(missing.length).toBeGreaterThan(0);
    });
  });

  describe('calculateCompleteness', () => {
    it('deve retornar score entre 0 e 1', () => {
      const requirements = 'Criar função';
      const completeness = analyzer.calculateCompleteness(requirements);
      
      expect(completeness).toBeGreaterThanOrEqual(0);
      expect(completeness).toBeLessThanOrEqual(1);
    });

    it('deve dar score maior para requisitos mais completos', () => {
      const simple = 'Criar função';
      const complete = 'Criar função para validar email. A função deve verificar formato, domínio e retornar boolean. Deve ter tratamento de erros e testes unitários. Performance esperada: < 10ms.';
      
      const simpleScore = analyzer.calculateCompleteness(simple);
      const completeScore = analyzer.calculateCompleteness(complete);
      
      expect(completeScore).toBeGreaterThan(simpleScore);
    });
  });

  describe('analyzeTechnicalCoverage', () => {
    it('deve analisar cobertura técnica', () => {
      const requirements = 'Sistema deve ter boa performance e segurança';
      const coverage = analyzer.analyzeTechnicalCoverage(requirements);
      
      expect(coverage).toHaveProperty('performance');
      expect(coverage).toHaveProperty('security');
      expect(coverage.performance.covered).toBe(true);
      expect(coverage.security.covered).toBe(true);
    });
  });

  describe('validateRequirements', () => {
    it('deve validar presença de elementos obrigatórios', () => {
      const requirements = 'Criar função de validação e sistema de autenticação';
      const requiredElements = ['validação', 'autenticação'];
      
      const validation = analyzer.validateRequirements(requirements, requiredElements);
      
      expect(validation.valid).toBe(true);
      expect(validation.found.length).toBe(2);
    });

    it('deve detectar elementos faltantes', () => {
      const requirements = 'Criar função de validação';
      const requiredElements = ['validação', 'autenticação', 'autorização'];
      
      const validation = analyzer.validateRequirements(requirements, requiredElements);
      
      expect(validation.valid).toBe(false);
      expect(validation.missing.length).toBeGreaterThan(0);
    });
  });

  describe('extractStructuredRequirements', () => {
    it('deve extrair requisitos estruturados', () => {
      const requirements = `
        Criar função de validação
        Sistema deve ter boa performance
        Não deve expor dados sensíveis
        Assumindo que usuário está autenticado
      `;
      
      const structured = analyzer.extractStructuredRequirements(requirements);
      
      expect(structured.functional.length).toBeGreaterThan(0);
      expect(structured.nonFunctional.length).toBeGreaterThan(0);
      expect(structured.constraints.length).toBeGreaterThan(0);
    });
  });
});
