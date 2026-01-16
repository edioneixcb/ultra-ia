/**
 * Tipos compartilhados entre contratos
 */

export type URI = string;

export interface FileWatchEvent {
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  path: string;
  oldPath?: string;
}

export interface FileStat {
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  modified: Date;
  created: Date;
}

export interface Editor {
  uri: URI;
  language: string;
  content: string;
}

export interface Event<T> {
  (listener: (e: T) => void): { dispose(): void };
}
