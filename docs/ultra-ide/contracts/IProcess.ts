/**
 * Interface para gerenciamento de processos
 *
 * Versao: 1.0.0
 */

import type { Event } from './types';

export interface ProcessOptions {
  cwd?: string;
  env?: Record<string, string>;
  shell?: string;
  detached?: boolean;
}

export interface ProcessExit {
  code: number | null;
  signal?: string;
}

export interface Process {
  readonly id: string;
  readonly pid: number;

  write(data: string): Promise<void>;
  kill(signal?: string): Promise<void>;

  onData: Event<string>;
  onError: Event<string>;
  onExit: Event<ProcessExit>;
}

export interface IProcess {
  /**
   * Cria novo processo
   */
  spawn(command: string, args?: string[], options?: ProcessOptions): Promise<Process>;

  /**
   * Lista processos ativos
   */
  list(): Promise<Process[]>;

  /**
   * Obtem processo por ID
   */
  get(id: string): Promise<Process | undefined>;

  /**
   * Encerra todos os processos
   */
  killAll(): Promise<void>;
}

/**
 * Exemplo de uso:
 *
 * ```typescript
 * const proc = await processService.spawn('npm', ['run', 'build'], { cwd: '/proj' });
 * proc.onData((data) => console.log(data));
 * proc.onExit((exit) => console.log(exit.code));
 * ```
 */
