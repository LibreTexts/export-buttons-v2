/**
 * @file Ambient declarations for the host page contract. The export buttons are injected
 * into LibreTexts library pages, which supply the `LibreTexts` global (via `reuse.js`)
 * and the `#proHolder`/`#adminHolder`/`#pageIDHolder`/`#pageTagsHolder` elements. None of
 * this is bundled — it must already exist on the page.
 */
import type { CommonsBook, CoverpageInfo } from './api';

export interface LibreTextsGlobal {
  /** Flags marking which widgets have already initialized on this page. */
  active: { exportButtons?: boolean; [key: string]: unknown };
  /** Information about the text currently being read, populated as it is discovered. */
  current: {
    coverpage?: CoverpageInfo;
    commons?: CommonsBook;
    projectID?: string;
    downloads: {
      pdf: { full?: string };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  /** Attached by this widget so other page scripts can trigger an export. */
  batch?: (target?: string) => Promise<void>;
  /** Resolves the path of the current text's coverpage, if it has one. */
  getCoverpage: () => Promise<string | null>;
  /** Splits the current URL into `[subdomain, path]`. */
  parseURL: () => [string, string];
  /** Fetches the MindTouch API record for a page URL. */
  getAPI: (url: string) => Promise<CoverpageInfo>;
}

declare global {
  const LibreTexts: LibreTextsGlobal;

  interface Window {
    LibreTexts: LibreTextsGlobal;
    /** Memoized export results, keyed by the compiled target URL. */
    LibreTextsBatchCompleted?: Record<string, string>;
    /** Configuration read by DonorBox's popup-button script. */
    DonorBox?: { widgetLinkClassName: string };
  }
}
