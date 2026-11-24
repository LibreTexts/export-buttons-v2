/**
 * @file Lookups against the services that describe the current text: MindTouch (via the
 * `LibreTexts` global), the LibreCommons catalog, and Conductor. Each dispatches a
 * `libre-*infoavailable` event on `window` so other page scripts can react once the
 * data lands.
 */
import { SHAPESHIFT_API } from './constants';
import { state } from './state';
import type { CommonsBook, CommonsBookResponse } from './types/api';

/**
 * Builds the Shapeshift book identifier (e.g. "chem-12345") for the current text.
 *
 * @returns {string} The library-prefixed book ID.
 */
export const getBookID = (): string => (
  state.currentSubdomain && state.currentCoverpage
    ? `${state.currentSubdomain}-${state.currentCoverpage.id}`
    : ''
);

/**
 * Builds a Shapeshift download URL for a given book and export format. The endpoint
 * responds with a 302 redirect to a short-lived signed CloudFront URL.
 *
 * @param {string} bookID - The library-prefixed book ID (e.g. "chem-12345").
 * @param {string} format - The export format (pdf, epub, thincc, pages, publication).
 * @returns {string} The Shapeshift download URL.
 */
export const getDownloadURL = (bookID: string, format: string): string => (
  `${SHAPESHIFT_API}/download/${bookID}/${format}`
);

/**
 * Loads information about the current text's coverpage, if it exists, into memory.
 *
 * @returns {Promise<boolean>} True if information loaded, false otherwise.
 */
export const loadCoverpage = async (): Promise<boolean> => {
  const coverPath = await LibreTexts.getCoverpage();
  if (coverPath) {
    const [subdomain] = LibreTexts.parseURL();
    state.currentSubdomain = subdomain;
    state.currentCoverpage = await LibreTexts.getAPI(`https://${subdomain}.libretexts.org/${coverPath}`);
    LibreTexts.current.coverpage = state.currentCoverpage;
    const coverpageInfoAvailable = new Event('libre-coverpageinfoavailable', {
      cancelable: true,
    });
    window.dispatchEvent(coverpageInfoAvailable);
    return true;
  }
  return false;
};

/**
 * Finds the current text's coverpage and retrieves the Full PDF download link.
 *
 * @returns {Promise<string|boolean>} The Full PDF download link, or false if not found.
 */
export const getBook = async (): Promise<string | false> => {
  if (!state.currentCoverpage) {
    await loadCoverpage();
  }
  if (state.currentCoverpage) {
    return getDownloadURL(getBookID(), 'pdf');
  }
  return false;
};

/**
 * Attempts to retrieve a LibreText's catalog listing in the LibreCommons.
 *
 * @param {object} [options] - Lookup options.
 * @param {boolean} [options.dispatchEvent=true] - Whether to announce the result on
 *  `window` as `libre-commonsinfoavailable`. The post-compile refresh in `refresh.ts`
 *  polls this endpoint repeatedly and opts out so it doesn't spam the public event;
 *  `LibreTexts.current.commons` is still updated either way.
 * @returns {Promise<object|null>} The book's listing, or null if not found.
 */
export const getBookCommonsEntry = async (
  { dispatchEvent = true }: { dispatchEvent?: boolean } = {},
): Promise<CommonsBook | null> => {
  if (!state.currentCoverpage) {
    await loadCoverpage();
  }
  if (state.currentCoverpage) {
    try {
      const commonsRes = await fetch(
        `https://commons.libretexts.org/api/v1/commons/book/${state.currentSubdomain}-${state.currentCoverpage.id}`,
        {
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
          // The endpoint sends max-age=300. The post-compile probe must revalidate, or it
          // would keep reading the pre-compile entry from the HTTP cache.
          cache: dispatchEvent ? 'default' : 'no-cache',
        },
      );
      if (commonsRes.status === 200) {
        const entryData: CommonsBookResponse = await commonsRes.json();
        const bookData = entryData.book;
        LibreTexts.current.commons = bookData;
        if (dispatchEvent) {
          const commonsInfoAvailable = new Event('libre-commonsinfoavailable', {
            cancelable: true,
          });
          window.dispatchEvent(commonsInfoAvailable);
        }
        return bookData ?? null;
      }
    } catch (e) {
      console.error(`[ExportButtons]: ${(e as Error).toString()}`);
    }
  }
  return null;
};
