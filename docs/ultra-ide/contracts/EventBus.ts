/**
 * Interface para EventBus
 *
 * Versao: 1.0.0
 */

export type EventHandler<T = unknown> = (payload: T) => void;

export interface EventBus {
  on<T>(event: string, handler: EventHandler<T>): Disposable;
  off<T>(event: string, handler: EventHandler<T>): void;
  emit<T>(event: string, payload: T): void;
  once<T>(event: string, handler: EventHandler<T>): Disposable;
}

export interface Disposable {
  dispose(): void;
}

/**
 * Exemplo de uso:
 *
 * ```typescript
 * const dispose = bus.on('file:opened', (uri) => {
 *   console.log('Opened', uri);
 * });
 *
 * bus.emit('file:opened', 'file:///test.ts');
 * dispose.dispose();
 * ```
 */
