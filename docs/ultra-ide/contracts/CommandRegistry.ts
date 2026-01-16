/**
 * Interface para registro e execucao de comandos
 *
 * Versao: 1.0.0
 */

export interface CommandHandler<T = unknown> {
  (...args: unknown[]): Promise<T> | T;
}

export interface CommandDescriptor {
  id: string;
  title: string;
  category?: string;
}

export interface CommandRegistry {
  register<T = unknown>(id: string, handler: CommandHandler<T>): Disposable;
  execute<T = unknown>(id: string, ...args: unknown[]): Promise<T>;
  list(): CommandDescriptor[];
}

export interface Disposable {
  dispose(): void;
}

/**
 * Exemplo de uso:
 *
 * ```typescript
 * commands.register('editor.formatDocument', async (args) => {
 *   await formatter.format(args.uri);
 * });
 *
 * await commands.execute('editor.formatDocument', { uri: 'file:///test.ts' });
 * ```
 */
