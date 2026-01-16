/**
 * API disponivel para plugins
 * 
 * Versao: 1.0.0
 * 
 * IMPORTANTE: Esta API e versionada. Plugins devem declarar
 * apiVersion no manifest para garantir compatibilidade.
 */

import type { URI, FileWatchEvent, FileStat, Editor, Event } from './types';

export interface Disposable {
  dispose(): void;
}

export interface CommandHandler<T = unknown> {
  (...args: unknown[]): Promise<T> | T;
}

export interface ViewComponent {
  render(): React.ReactElement;
}

export interface StatusBarOptions {
  text: string;
  tooltip?: string;
  command?: string;
  priority?: number;
}

export interface StatusBarItem {
  update(options: Partial<StatusBarOptions>): void;
  dispose(): void;
}

export interface InputOptions {
  prompt: string;
  placeholder?: string;
  value?: string;
  password?: boolean;
}

export interface PluginContext {
  /**
   * Versao da API
   */
  readonly apiVersion: string;

  /**
   * ID do plugin
   */
  readonly pluginId: string;

  /**
   * Workspace root URI
   */
  readonly workspaceRoot: URI;

  /**
   * Filesystem (se permissao concedida)
   */
  readonly fs?: {
    readFile(uri: URI): Promise<Uint8Array>;
    writeFile(uri: URI, content: Uint8Array): Promise<void>;
    watch(glob: string, callback: (event: FileWatchEvent) => void): Disposable;
    exists(uri: URI): Promise<boolean>;
    stat(uri: URI): Promise<FileStat>;
  };

  /**
   * UI (se permissao concedida)
   */
  readonly ui?: {
    showMessage(msg: string, type: 'info' | 'warn' | 'error'): void;
    showInput(options: InputOptions): Promise<string | undefined>;
    registerView(id: string, component: ViewComponent): Disposable;
    registerStatusBarItem(options: StatusBarOptions): StatusBarItem;
  };

  /**
   * Comandos
   */
  readonly commands: {
    register<T = unknown>(id: string, handler: CommandHandler<T>): Disposable;
    execute<T = unknown>(id: string, ...args: unknown[]): Promise<T>;
  };

  /**
   * Eventos
   */
  readonly events: {
    onDidOpenFile: Event<URI>;
    onDidSaveFile: Event<URI>;
    onDidChangeActiveEditor: Event<Editor | undefined>;
  };

  /**
   * Storage isolado por plugin
   */
  readonly storage: {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
  };
}

export interface Plugin {
  /**
   * Ativacao do plugin
   * 
   * @param ctx - Contexto do plugin
   */
  activate(ctx: PluginContext): Promise<void> | void;

  /**
   * Desativacao do plugin (opcional)
   */
  deactivate?(): Promise<void> | void;
}

/**
 * Exemplo de uso:
 * 
 * ```typescript
 * import type { Plugin, PluginContext } from '@ultra-ide/core';
 * 
 * const plugin: Plugin = {
 *   async activate(ctx: PluginContext) {
 *     // Registrar comando
 *     ctx.commands.register('myplugin.hello', async () => {
 *       ctx.ui?.showMessage('Hello from plugin!', 'info');
 *     });
 * 
 *     // Observar eventos
 *     ctx.events.onDidOpenFile((uri) => {
 *       console.log('File opened:', uri);
 *     });
 * 
 *     // Usar storage
 *     await ctx.storage.set('lastActivated', Date.now());
 *     const lastActivated = await ctx.storage.get<number>('lastActivated');
 *   },
 * 
 *   async deactivate() {
 *     // Cleanup
 *   }
 * };
 * 
 * export default plugin;
 * ```
 */
