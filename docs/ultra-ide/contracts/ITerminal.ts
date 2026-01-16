/**
 * Interface para operacoes de terminal
 * 
 * Versao: 1.0.0
 */

export interface TerminalOptions {
  name?: string;
  cwd?: string;
  env?: Record<string, string>;
  shell?: string;
  cols?: number;
  rows?: number;
}

export interface TerminalWriteOptions {
  addNewLine?: boolean;
}

export interface Disposable {
  dispose(): void;
}

export interface Terminal {
  /**
   * ID unico do terminal
   */
  readonly id: string;

  /**
   * Escreve dados no terminal
   * 
   * @param data - Dados a escrever
   * @param options - Opcoes de escrita
   */
  write(data: string, options?: TerminalWriteOptions): Promise<void>;

  /**
   * Envia comando para terminal
   * 
   * @param command - Comando a executar
   */
  sendCommand(command: string): Promise<void>;

  /**
   * Redimensiona terminal
   * 
   * @param cols - Numero de colunas
   * @param rows - Numero de linhas
   */
  resize(cols: number, rows: number): Promise<void>;

  /**
   * Mata processo do terminal
   */
  kill(): Promise<void>;

  /**
   * Observa saida do terminal
   * 
   * @param callback - Callback chamado com dados
   * @returns Disposable para cancelar observacao
   */
  onData(callback: (data: string) => void): Disposable;

  /**
   * Observa fechamento do terminal
   * 
   * @param callback - Callback chamado quando fecha
   * @returns Disposable para cancelar observacao
   */
  onClose(callback: () => void): Disposable;
}

/**
 * Interface abstrata para criacao e gerenciamento de terminais
 * 
 * Implementacoes:
 * - WebTerminal: packages/web/src/adapters/WebTerminal.ts
 * - TauriTerminal: packages/desktop/src/adapters/TauriTerminal.ts
 */
export interface ITerminal {
  /**
   * Cria novo terminal
   * 
   * @param options - Opcoes do terminal
   * @returns Instancia do terminal
   */
  create(options?: TerminalOptions): Promise<Terminal>;

  /**
   * Lista terminais ativos
   * 
   * @returns Lista de terminais
   */
  list(): Promise<Terminal[]>;

  /**
   * Obtem terminal por ID
   * 
   * @param id - ID do terminal
   * @returns Terminal ou undefined se nao existe
   */
  get(id: string): Promise<Terminal | undefined>;

  /**
   * Mata todos os terminais
   */
  killAll(): Promise<void>;
}

/**
 * Exemplo de uso:
 * 
 * ```typescript
 * const terminalService: ITerminal = getTerminalService();
 * 
 * // Criar terminal
 * const term = await terminalService.create({
 *   name: 'bash',
 *   cwd: '/home/user/project',
 *   cols: 80,
 *   rows: 24
 * });
 * 
 * // Observar saida
 * term.onData((data) => {
 *   console.log('Terminal output:', data);
 * });
 * 
 * // Enviar comando
 * await term.sendCommand('ls -la');
 * 
 * // Redimensionar
 * await term.resize(120, 30);
 * 
 * // Fechar
 * await term.kill();
 * ```
 */
