/**
 * Validadores de Requisição da API
 * 
 * Schemas de validação usando Zod para todos os endpoints da API
 */

import { z } from 'zod';

/**
 * Schema de validação para POST /api/generate
 */
export const generateRequestSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt não pode estar vazio')
    .max(10240, 'Prompt excede tamanho máximo de 10KB')
    .refine(
      (val) => {
        // Verificar caracteres perigosos básicos
        const dangerousPatterns = [
          /<script/i,
          /javascript:/i,
          /on\w+\s*=/i
        ];
        return !dangerousPatterns.some(pattern => pattern.test(val));
      },
      { message: 'Prompt contém padrões potencialmente perigosos' }
    ),
  sessionId: z.string()
    .min(1, 'SessionId não pode estar vazio')
    .max(100, 'SessionId excede tamanho máximo')
    .regex(/^[a-zA-Z0-9_-]+$/, 'SessionId contém caracteres inválidos')
    .default('default'),
  projectId: z.string()
    .max(100, 'ProjectId excede tamanho máximo')
    .regex(/^[a-zA-Z0-9_-]*$/, 'ProjectId contém caracteres inválidos')
    .nullable()
    .optional(),
  language: z.enum(['javascript', 'python', 'typescript', 'js', 'py', 'ts'], {
    errorMap: () => ({ message: 'Linguagem não suportada' })
  }).default('javascript'),
  expectedOutput: z.string()
    .max(1000, 'ExpectedOutput excede tamanho máximo')
    .nullable()
    .optional(),
  maxIterations: z.number()
    .int('maxIterations deve ser um número inteiro')
    .min(1, 'maxIterations deve ser pelo menos 1')
    .max(50, 'maxIterations não pode exceder 50')
    .default(10),
  enableRefinement: z.boolean().default(true)
});

const codebasePathSchema = z.string()
  .min(1, 'codebasePath é obrigatório')
  .max(500, 'codebasePath excede tamanho máximo')
  .refine(
    (val) => {
      // Verificar se não contém caracteres perigosos
      return !val.includes('..') && !val.includes('~');
    },
    { message: 'codebasePath contém caracteres perigosos' }
  );

/**
 * Schema de validação para POST /api/index
 */
export const indexRequestSchema = z.object({
  codebasePath: codebasePathSchema.optional(),
  path: codebasePathSchema.optional(),
  patterns: z.array(z.string().min(1, 'patterns não pode conter strings vazias'))
    .optional(),
  projectId: z.string()
    .max(100, 'ProjectId excede tamanho máximo')
    .regex(/^[a-zA-Z0-9_-]*$/, 'ProjectId contém caracteres inválidos')
    .optional()
}).superRefine((data, ctx) => {
  const pathValue = data.codebasePath ?? data.path;
  if (!pathValue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'codebasePath é obrigatório',
      path: ['codebasePath']
    });
  }
}).transform((data) => ({
  codebasePath: data.codebasePath ?? data.path,
  patterns: data.patterns,
  projectId: data.projectId
}));

/**
 * Schema de validação para POST /api/validate
 */
export const validateRequestSchema = z.object({
  code: z.string()
    .min(1, 'Code não pode estar vazio')
    .max(10240, 'Code excede tamanho máximo de 10KB'),
  language: z.enum(['javascript', 'python', 'typescript', 'js', 'py', 'ts'], {
    errorMap: () => ({ message: 'Linguagem não suportada' })
  }).default('javascript')
});

/**
 * Schema de validação para GET /api/search
 */
export const searchQuerySchema = z.object({
  q: z.string()
    .min(1, 'Query não pode estar vazia')
    .max(200, 'Query excede tamanho máximo'),
  limit: z.coerce.number()
    .int('limit deve ser um número inteiro')
    .positive('limit deve ser positivo')
    .optional(),
  projectId: z.string()
    .max(100, 'ProjectId excede tamanho máximo')
    .regex(/^[a-zA-Z0-9_-]*$/, 'ProjectId contém caracteres inválidos')
    .optional()
});

/**
 * Schema de validação para GET /api/history/:sessionId
 */
export const historyParamsSchema = z.object({
  sessionId: z.string()
    .min(1, 'SessionId não pode estar vazio')
    .max(100, 'SessionId excede tamanho máximo')
    .regex(/^[a-zA-Z0-9_-]+$/, 'SessionId contém caracteres inválidos')
});

/**
 * Valida dados usando schema Zod
 * @param {object} schema - Schema Zod
 * @param {object} data - Dados a validar
 * @returns {object} Resultado da validação
 */
export function validate(schema, data) {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated,
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = Array.isArray(error.issues) ? error.issues : [];
      if (issues.length === 0) {
        return {
          success: false,
          data: null,
          errors: [{
            path: '',
            message: error.message || 'Erro de validação (Zod)',
            code: 'ZOD_ERROR'
          }]
        };
      }
      return {
        success: false,
        data: null,
        errors: issues.map(err => ({
          path: err.path?.join('.') || '',
          message: err.message,
          code: err.code
        }))
      };
    }
    throw error;
  }
}

/**
 * Sanitiza string removendo caracteres perigosos
 * @param {string} input - String a sanitizar
 * @returns {string} String sanitizada
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remover caracteres de controle
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');

  // Limitar tamanho
  if (sanitized.length > 10240) {
    sanitized = sanitized.substring(0, 10240);
  }

  return sanitized;
}

/**
 * Valida e sanitiza objeto de requisição
 * @param {object} schema - Schema Zod
 * @param {object} data - Dados a validar
 * @returns {object} Resultado da validação
 */
export function validateAndSanitize(schema, data) {
  // Sanitizar strings primeiro
  const sanitized = {};
  for (const key in data) {
    if (typeof data[key] === 'string') {
      sanitized[key] = sanitizeString(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  }

  // Validar
  return validate(schema, sanitized);
}
