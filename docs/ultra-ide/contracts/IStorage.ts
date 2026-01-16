/**
 * Interface para armazenamento persistente
 *
 * Versao: 1.0.0
 */

export type StorageScope = 'global' | 'workspace' | 'user';

export interface IStorage {
  get<T>(key: string, scope?: StorageScope): Promise<T | undefined>;
  set<T>(key: string, value: T, scope?: StorageScope): Promise<void>;
  delete(key: string, scope?: StorageScope): Promise<void>;
  clear(scope?: StorageScope): Promise<void>;
  keys(scope?: StorageScope): Promise<string[]>;
}

/**
 * Exemplo de uso:
 *
 * ```typescript
 * await storage.set('theme', 'dark', 'user');
 * const theme = await storage.get<string>('theme', 'user');
 * ```
 */
