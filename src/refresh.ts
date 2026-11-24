/**
 * @file Re-checks the LibreCommons catalog entry after an export job finishes and rebuilds
 * the button row once new data lands.
 *
 * A Shapeshift compile does more than produce a PDF: for a book that has never been
 * compiled, it is also what syncs the book into Conductor and writes an `exportInfo`
 * object onto its Commons entry. The row is otherwise built once on `load`, so everything
 * the compile just unlocked — the Downloads dropdown, Buy Print Copy, and, for a
 * first-ever sync, the whole Commons/Conductor block — would stay invisible until the
 * reader happened to reload the page.
 */
import { getBookCommonsEntry } from './api';
import {
  ID_DWNLD_DROPDOWN_BTN,
  MAX_POST_COMPILE_REFRESH_ATTEMPTS,
  POST_COMPILE_REFRESH_DELAY_MS,
  POST_COMPILE_REFRESH_INTERVAL_MS,
} from './constants';
import type { CommonsBook } from './types/api';

// Guards against a second job finishing while a refresh is still probing, which would
// otherwise run two poll loops and rebuild the row twice.
let refreshInFlight = false;

/**
 * Resolves after the given delay.
 *
 * @param {number} ms - How long to wait, in milliseconds.
 * @returns {Promise<void>} A promise that settles once the delay elapses.
 */
const sleep = (ms: number): Promise<void> => (
  new Promise<void>((resolve) => { setTimeout(resolve, ms); })
);

/**
 * Waits for Conductor to catch up after a compile, then rebuilds the button row if the
 * book's prepared downloads have become available. Gives up silently if they never do:
 * the row is left exactly as the reader already saw it, with no alert and no DOM churn.
 *
 * @param {Function} rebuild - Rebuilds the button row from freshly fetched data.
 * @returns {Promise<void>} Resolves once the row has been rebuilt or the probes are spent.
 */
export const refreshAfterCompile = async (
  rebuild: (commonsEntry: CommonsBook) => Promise<void>,
): Promise<void> => {
  if (refreshInFlight) {
    return;
  }
  // The Downloads dropdown is only rendered when the book already had `exportInfo`, so
  // its presence means this was a recompile of an established text: nothing to discover,
  // and rebuilding would just churn the DOM under the reader.
  if (document.getElementById(ID_DWNLD_DROPDOWN_BTN)) {
    return;
  }
  refreshInFlight = true;
  try {
    await sleep(POST_COMPILE_REFRESH_DELAY_MS);
    for (let attempt = 1; attempt <= MAX_POST_COMPILE_REFRESH_ATTEMPTS; attempt += 1) {
      // Probe quietly: `rebuild` fires the public events itself, so announcing every
      // unsuccessful poll would be noise. The winning entry is handed over, not refetched.
      const commonsEntry = await getBookCommonsEntry({ dispatchEvent: false });
      if (commonsEntry?.exportInfo) {
        await rebuild(commonsEntry);
        return;
      }
      if (attempt < MAX_POST_COMPILE_REFRESH_ATTEMPTS) {
        await sleep(POST_COMPILE_REFRESH_INTERVAL_MS);
      }
    }
    console.debug('[ExportButtons]: prepared downloads did not appear after compiling; leaving the button row as is.');
  } catch (e) {
    // `getBookCommonsEntry` swallows its own fetch failures, so reaching here is
    // unexpected — but this runs from an event listener and must not reject unhandled.
    console.error(`[ExportButtons]: ${(e as Error).toString()}`);
  } finally {
    refreshInFlight = false;
  }
};
