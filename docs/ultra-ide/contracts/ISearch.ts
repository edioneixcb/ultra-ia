/**
 * Interface para busca no workspace
 *
 * Versao: 1.0.0
 */

import type { URI } from './types';

export interface SearchQuery {
  pattern: string;
  regex?: boolean;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  include?: string[];
  exclude?: string[];
  maxResults?: number;
}

export interface SearchMatch {
  file: URI;
  line: number;
  column: number;
  lineText: string;
  matchText: string;
}

export interface SearchResult {
  matches: SearchMatch[];
  total: number;
}

export interface ISearch {
  /**
   * Busca em todos os arquivos do workspace
   */
  searchInFiles(query: SearchQuery, root?: URI): Promise<SearchResult>;

  /**
   * Busca em um arquivo especifico
   */
  searchInFile(file: URI, query: SearchQuery): Promise<SearchMatch[]>;

  /**
   * Busca arquivos por padrao (fuzzy ou glob)
   */
  findFiles(pattern: string, root?: URI): Promise<URI[]>;
}

/**
 * Exemplo de uso:
 *
 * ```typescript
 * const result = await search.searchInFiles({ pattern: 'TODO', regex: false });
 * console.log(result.total);
 * ```
 */
