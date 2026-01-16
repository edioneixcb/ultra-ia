/**
 * Interface para operacoes de filesystem
 * 
 * Versao: 1.0.0
 * 
 * Regra de Versionamento:
 * - MAJOR: Quebra assinatura existente
 * - MINOR: Adiciona metodo opcional
 * - PATCH: Fix sem mudanca de assinatura
 */

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modified?: Date;
}

export interface FileStat {
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  modified: Date;
  created: Date;
}

export type WatchCallback = (event: FileWatchEvent) => void;

export interface FileWatchEvent {
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  path: string;
  oldPath?: string; // Para eventos de rename
}

export interface Disposable {
  dispose(): void;
}

/**
 * Interface abstrata para operacoes de filesystem
 * 
 * Implementacoes:
 * - WebFileSystem: packages/web/src/adapters/WebFileSystem.ts
 * - TauriFileSystem: packages/desktop/src/adapters/TauriFileSystem.ts
 */
export interface IFileSystem {
  /**
   * Lista conteudo de diretorio
   * 
   * @param path - Caminho absoluto do diretorio
   * @returns Lista de entries no diretorio
   * @throws FileNotFoundError se path nao existe
   * @throws PermissionError se nao tem permissao
   */
  list(path: string): Promise<FileEntry[]>;

  /**
   * Le conteudo de arquivo
   * 
   * @param path - Caminho absoluto do arquivo
   * @returns Conteudo como Uint8Array
   * @throws FileNotFoundError se arquivo nao existe
   * @throws PermissionError se nao tem permissao
   */
  read(path: string): Promise<Uint8Array>;

  /**
   * Escreve conteudo em arquivo
   * 
   * @param path - Caminho absoluto do arquivo
   * @param content - Conteudo a escrever
   * @throws PermissionError se nao tem permissao
   * @throws DiskFullError se disco cheio
   */
  write(path: string, content: Uint8Array): Promise<void>;

  /**
   * Deleta arquivo ou diretorio
   * 
   * @param path - Caminho absoluto
   * @throws FileNotFoundError se nao existe
   * @throws PermissionError se nao tem permissao
   */
  delete(path: string): Promise<void>;

  /**
   * Verifica se arquivo/diretorio existe
   * 
   * @param path - Caminho absoluto
   * @returns true se existe, false caso contrario
   */
  exists(path: string): Promise<boolean>;

  /**
   * Obtem estatisticas de arquivo/diretorio
   * 
   * @param path - Caminho absoluto
   * @returns Estatisticas do arquivo
   * @throws FileNotFoundError se nao existe
   */
  stat(path: string): Promise<FileStat>;

  /**
   * Observa mudancas em arquivos/diretorios
   * 
   * @param glob - Padrao glob para observar (ex: "**/*.ts")
   * @param callback - Callback chamado em mudancas
   * @returns Disposable para cancelar observacao
   */
  watch(glob: string, callback: WatchCallback): Disposable;

  /**
   * Cria diretorio
   * 
   * @param path - Caminho absoluto do diretorio
   * @throws PermissionError se nao tem permissao
   */
  createDirectory(path: string): Promise<void>;

  /**
   * Renomeia arquivo/diretorio
   * 
   * @param oldPath - Caminho atual
   * @param newPath - Novo caminho
   * @throws FileNotFoundError se oldPath nao existe
   * @throws PermissionError se nao tem permissao
   */
  rename(oldPath: string, newPath: string): Promise<void>;

  /**
   * Copia arquivo/diretorio
   * 
   * @param source - Caminho origem
   * @param destination - Caminho destino
   * @throws FileNotFoundError se source nao existe
   * @throws PermissionError se nao tem permissao
   */
  copy(source: string, destination: string): Promise<void>;
}

/**
 * Exemplo de uso:
 * 
 * ```typescript
 * const fs: IFileSystem = getFileSystem(); // Obtem implementacao
 * 
 * // Listar diretorio
 * const files = await fs.list('/home/user/project');
 * for (const file of files) {
 *   if (!file.isDirectory) {
 *     const content = await fs.read(file.path);
 *     console.log(new TextDecoder().decode(content));
 *   }
 * }
 * 
 * // Observar mudancas
 * const disposable = fs.watch('**/*.ts', (event) => {
 *   console.log(`File ${event.path} was ${event.type}`);
 * });
 * 
 * // Limpar observacao
 * disposable.dispose();
 * ```
 */
