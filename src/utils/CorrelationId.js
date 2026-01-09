/**
 * Correlation ID Manager
 * 
 * Gera e gerencia correlation IDs para rastreamento de requisições
 */

import { randomBytes } from 'crypto';

class CorrelationId {
  static generate() {
    return randomBytes(16).toString('hex');
  }

  static middleware() {
    return (req, res, next) => {
      req.correlationId = req.headers['x-correlation-id'] || CorrelationId.generate();
      res.setHeader('X-Correlation-ID', req.correlationId);
      next();
    };
  }
}

export default CorrelationId;
