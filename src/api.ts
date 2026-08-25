/**
 * @file Lookups against the services that describe the current text: MindTouch (via the
 * `LibreTexts` global), the LibreCommons catalog, and Conductor. Each dispatches a
 * `libre-*infoavailable` event on `window` so other page scripts can react once the
 * data lands.
 */
import { PROJECT_ID_CACHE_TTL_MS, SHAPESHIFT_API } from './constants';
import { state } from './state';
import type {
  CachedProjectID,
  CommonsBook,
  CommonsBookResponse,
  ConductorProjectResponse,
} from './types/api';

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
        { headers: { 'X-Requested-With': 'XMLHttpRequest' } },
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

/**
 * Builds the localStorage key under which a book's Conductor project ID is memoized.
 *
 * @returns {string} The cache key for the current text.
 */
const getProjectIDCacheKey = (): string => (
  `projectID-${state.currentSubdomain}-${state.currentCoverpage?.id}`
);

/**
 * Reads a memoized Conductor project ID, treating anything older than
 * `PROJECT_ID_CACHE_TTL_MS` as a miss so a re-linked or removed project is picked up on
 * the reader's next visit rather than never.
 *
 * @returns {string|null} The cached project ID, or null if absent, expired, or unreadable.
 */
const readCachedProjectID = (): string | null => {
  const raw = localStorage.getItem(getProjectIDCacheKey());
  if (!raw) {
    return null;
  }
  try {
    // Entries written before the TTL existed are bare ID strings, not JSON. Treat those
    // as a miss so they are refetched once and rewritten in the current shape.
    const entry: unknown = JSON.parse(raw);
    if (
      typeof entry === 'object' && entry !== null
      && typeof (entry as CachedProjectID).projectID === 'string'
      && typeof (entry as CachedProjectID).cachedAt === 'number'
    ) {
      const { projectID, cachedAt } = entry as CachedProjectID;
      if (Date.now() - cachedAt < PROJECT_ID_CACHE_TTL_MS) {
        return projectID;
      }
    }
  } catch {
    // Not JSON: a legacy entry or unrelated data. Fall through to the miss below.
  }
  localStorage.removeItem(getProjectIDCacheKey());
  return null;
};

export const getBookProjectID = async (): Promise<string | null> => {
  try {
    if(!state.currentCoverpage){
      await loadCoverpage();
    }
    if(state.currentCoverpage){
      const projectInfoAvailable = new Event('libre-projectinfoavailable', {
        cancelable: true,
      });

      // Check local storage for a still-fresh projectID first
      const projectID = readCachedProjectID();
      if(projectID){
        LibreTexts.current.projectID = projectID;
        window.dispatchEvent(projectInfoAvailable);
        return projectID;
      }

      // If not found in local storage, fetch from conductor
      const conductorRes = await fetch(
        `https://commons.libretexts.org/api/v1/project/find-by-book/${state.currentSubdomain}-${state.currentCoverpage.id}`,
        { headers: { 'X-Requested-With': 'XMLHttpRequest' } },
      );

      if(conductorRes.status === 200){
        const projectData: ConductorProjectResponse = await conductorRes.json();
        const foundProjectID = projectData.projectID;
        LibreTexts.current.projectID = foundProjectID;
        window.dispatchEvent(projectInfoAvailable);

        // Save projectID to local storage, stamped so it can expire
        if(foundProjectID){
          localStorage.setItem(
            getProjectIDCacheKey(),
            JSON.stringify({ projectID: foundProjectID, cachedAt: Date.now() }),
          );
        }

        return foundProjectID ?? null;
      }
    }
  } catch (e) {
    console.error(`[ExportButtons]: ${(e as Error).toString()}`);
  }
  return null;
}
