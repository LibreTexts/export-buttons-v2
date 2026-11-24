/**
 * @file Stubs the host page contract so the export buttons can run standalone under Vite.
 * Not shipped. Everything here is normally supplied by a LibreTexts library page: the
 * `LibreTexts` global (from `reuse.js`), the four holder elements, the social-share bar
 * the buttons replace, and the three read-only APIs the widget queries.
 *
 * Must be imported before `src/index.ts`, since the widget's guard runs on evaluation.
 */
import type { LibreTextsGlobal } from '../src/types/libretexts';

// Flip to true to exercise a book that has never been compiled: the Commons entry and the
// Conductor project only come into existence once an export job finishes, which is what the
// post-compile refresh in `src/refresh.ts` waits for.
const SIMULATE_NEW_BOOK = false;

const SUBDOMAIN = 'chem';
const COVERPAGE_ID = 207587;
const PAGE_ID = 207589;

/* Host globals ------------------------------------------------------------------- */

const libreTexts: LibreTextsGlobal = {
  active: {},
  current: { downloads: { pdf: {} } },
  getCoverpage: async () => 'Bookshelves/Introductory_Chemistry/Sample_Text',
  parseURL: () => [SUBDOMAIN, 'Bookshelves/Introductory_Chemistry/Sample_Text/01:_A_Chapter'],
  getAPI: async () => ({ id: COVERPAGE_ID, title: 'Sample LibreText' }),
};

window.LibreTexts = libreTexts;

/* Host DOM ---------------------------------------------------------------------- */

/**
 * Creates one of the hidden holder elements the widget reads page context from.
 *
 * @param id - The holder's DOM ID.
 * @param value - The text content the host page would have rendered.
 */
const addHolder = (id: string, value: string): void => {
  const holder = document.createElement('div');
  holder.id = id;
  holder.style.display = 'none';
  holder.innerText = value;
  document.body.appendChild(holder);
};

addHolder('proHolder', 'true');
addHolder('adminHolder', 'false');
addHolder('pageIDHolder', String(PAGE_ID));
addHolder('pageTagsHolder', '["article:topic","article:topic-guide"]');

const socialShare = document.createElement('div');
socialShare.className = 'elm-social-share';
document.body.appendChild(socialShare);

/* Remote APIs -------------------------------------------------------------------- */

const BOOK_ID = `${SUBDOMAIN}-${COVERPAGE_ID}`;

/**
 * A minimal JSON response, matching what each stubbed endpoint returns.
 *
 * @param body - The value to serialize.
 */
const json = (body: unknown): Response => (
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
);

const realFetch = window.fetch.bind(window);

// Flipped by a finished export job below, standing in for Shapeshift syncing the book into
// Conductor and writing its Commons `exportInfo`.
let bookCompiled = !SIMULATE_NEW_BOOK;

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

  if (url.includes('/api/v1/commons/book/')) {
    // No `book` key: the text has no catalog entry at all, so the Downloads dropdown, Buy
    // Print Copy, and every Commons-gated button are absent from the initial row.
    if (!bookCompiled) {
      return json({});
    }
    return json({
      book: {
        bookID: BOOK_ID,
        coverID: String(COVERPAGE_ID),
        // Drop `exportInfo` to exercise a text with no prepared downloads: the Downloads
        // dropdown and the Buy Print Copy button both disappear.
        exportInfo: { contentPageCount: 70, compiledBy: 'shapeshift' },
        links: {
          buy: `https://commons.libretexts.org/store/product/${BOOK_ID}`,
        },
        hasPeerReviews: true,
        allowAnonPR: true,
        hasAdaptCourse: true,
        adaptCourseID: '1234',
        hasMaterials: true,
        projectID: 'sample-project-id',
      },
    });
  }

  // Shapeshift job submission and polling: report an immediately finished job so the
  // "Compiling…" -> "Finished" transition can be exercised without hitting the service.
  if (url.includes('downloads.libretexts.org/api/v1/job')) {
    bookCompiled = true;
    return json({ data: { id: 'sample-job-id', bookID: BOOK_ID, status: 'finished' } });
  }

  return realFetch(input, init);
};
