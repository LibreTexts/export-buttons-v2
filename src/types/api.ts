/**
 * @file Response shapes for the remote services the export buttons consume. Only the
 * fields the widget actually reads are declared; each service returns more.
 */

/** A MindTouch page record as returned by `LibreTexts.getAPI`. */
export interface CoverpageInfo {
  id: number | string;
  [key: string]: unknown;
}

/**
 * Export metadata for a book. Present only once the book has been compiled, so its
 * presence is what marks prepared downloads as available.
 */
export interface CommonsBookExportInfo {
  contentPageCount?: number;
  compiledBy?: string;
  [key: string]: unknown;
}

/** Prepared download and storefront links Commons publishes alongside a book. */
export interface CommonsBookLinks {
  online?: string;
  pdf?: string;
  buy?: string;
  zip?: string;
  files?: string;
  lms?: string;
  [key: string]: unknown;
}

/** A book's catalog listing in the LibreCommons. */
export interface CommonsBook {
  bookID: string;
  /** MindTouch page ID of the book's coverpage, as a string. */
  coverID?: string;
  exportInfo?: CommonsBookExportInfo;
  links?: CommonsBookLinks;
  hasPeerReviews?: boolean;
  allowAnonPR?: boolean;
  hasAdaptCourse?: boolean;
  adaptCourseID?: string;
  hasMaterials?: boolean;
  [key: string]: unknown;
}

/** `GET /api/v1/commons/book/{bookID}` on commons.libretexts.org. */
export interface CommonsBookResponse {
  book?: CommonsBook;
}

/** `GET /api/v1/project/find-by-book/{bookID}` on commons.libretexts.org. */
export interface ConductorProjectResponse {
  projectID?: string;
}

/** A memoized Conductor project ID, stamped so it can be expired. */
export interface CachedProjectID {
  projectID: string;
  cachedAt: number;
}

/** A Shapeshift export job. */
export interface ShapeshiftJob {
  id: string;
  bookID: string;
  status: 'created' | 'inprogress' | 'finished' | 'failed';
}

/** `POST /api/v1/job` and `GET /api/v1/job/{id}` on downloads.libretexts.org. */
export interface ShapeshiftJobResponse {
  data?: Partial<ShapeshiftJob>;
  msg?: string;
}
