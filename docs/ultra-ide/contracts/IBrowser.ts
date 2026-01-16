/**
 * Interface para automacao de navegador
 *
 * Versao: 1.0.0
 */

export interface BrowserPage {
  id: string;
  url: string;
}

export interface BrowserSearchResult {
  title: string;
  url: string;
  snippet?: string;
}

export interface IBrowser {
  open(url: string): Promise<BrowserPage>;
  close(pageId: string): Promise<void>;
  navigate(pageId: string, url: string): Promise<void>;
  search(query: string): Promise<BrowserSearchResult[]>;

  click(pageId: string, selector: string): Promise<void>;
  type(pageId: string, selector: string, text: string): Promise<void>;
  screenshot(pageId: string): Promise<Uint8Array>;
  extractText(pageId: string, selector?: string): Promise<string>;
}

/**
 * Exemplo de uso:
 *
 * ```typescript
 * const page = await browser.open('https://example.com');
 * await browser.click(page.id, 'button#accept');
 * const text = await browser.extractText(page.id, 'h1');
 * ```
 */
