/**
 * Interface para operacoes Git
 *
 * Versao: 1.0.0
 */

import type { URI } from './types';

export type GitFileStatus =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'renamed'
  | 'untracked'
  | 'conflicted';

export interface GitStatusEntry {
  path: URI;
  status: GitFileStatus;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
}

export interface CommitOptions {
  author?: string;
  email?: string;
}

export interface IGit {
  status(root: URI): Promise<GitStatusEntry[]>;
  add(paths: URI[]): Promise<void>;
  commit(message: string, options?: CommitOptions): Promise<GitCommit>;
  push(remote?: string, branch?: string): Promise<void>;
  pull(remote?: string, branch?: string): Promise<void>;
  checkout(ref: string): Promise<void>;
  branchList(): Promise<string[]>;
  diff(path?: URI): Promise<string>;
}

/**
 * Exemplo de uso:
 *
 * ```typescript
 * const status = await git.status(workspaceRoot);
 * await git.add(status.map(s => s.path));
 * await git.commit('feat: update', { author: 'User' });
 * ```
 */
