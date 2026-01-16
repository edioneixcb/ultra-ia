/**
 * Testes unitários para EventBus
 */

import { describe, it, expect } from 'vitest';
import EventBus from '../../../src/infrastructure/EventBus.js';

describe('EventBus', () => {
  it('deve emitir e receber eventos', () => {
    const bus = new EventBus();
    let received = null;

    bus.on('test:event', (payload) => {
      received = payload;
    });

    bus.emit('test:event', { ok: true });

    expect(received).toEqual({ ok: true });
    expect(bus.getStats().events['test:event']).toBe(1);
  });

  it('deve atualizar contagem de listeners', () => {
    const bus = new EventBus();
    const handler = () => {};

    bus.on('listener:event', handler);
    expect(bus.getStats().listeners).toBe(1);

    bus.off('listener:event', handler);
    expect(bus.getStats().listeners).toBe(0);
  });
});
