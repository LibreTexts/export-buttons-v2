/**
 * @file DOM identifiers, class names, key names, and service configuration shared across
 * the widget. The IDs and classes are also interpolated into the injected stylesheet in
 * `styles.ts`, so they must stay in sync with the elements built in `index.ts`.
 */

export const ARROW_UP_KEY = 'ArrowUp';
export const ARROW_DOWN_KEY = 'ArrowDown';
export const ENTER_KEY = 'Enter';
export const ESCAPE_KEY = 'Escape';
export const SPACE_KEY = ' ';

export const ID_CONTAINER_DIV = 'libreExportButtons';
export const ID_PDF_DROPDOWN_BTN = 'libre-pdf-dropdown-btn';
export const ID_DWNLD_DROPDOWN_BTN = 'libre-dwnld-dropdown-btn';
export const ID_PDF_DROPDOWN_CONTENT = 'libre-pdf-dropdown-content';
export const ID_DWNLD_DROPDOWN_CONTENT = 'libre-dwnld-dropdown-content';
export const ID_REVIEW_DROPDOWN_BTN = 'libre-review-dropdown-btn';
export const ID_REVIEW_DROPDOWN_CONTENT = 'libre-review-dropdown-content';
export const ID_COMMONS_ADAPT_BTN = 'libre-commons-adapt-btn';
export const ID_COMMONS_MATERIALS_BTN = 'libre-commons-materials-btn';
export const ID_COMMONS_BTN = 'libre-commons-btn';
export const ID_CONDUCTOR_PROJECT_BTN = 'libre-conductor-project-btn';

export const CLASS_DROPDOWN = 'libre-dropdown';
export const CLASS_DROPDOWN_BTN = 'libre-dropdown-btn';
export const CLASS_PDF_DROPDOWN_ITEM = 'libre-pdf-dropdown-item';
export const CLASS_DWNLD_DROPDOWN_ITEM = 'libre-dwnld-dropdown-item';
export const CLASS_REVIEW_DROPDOWN_ITEM = 'libre-review-dropdown-item';
export const CLASS_BUTTON_ICON_TEXT = 'libre-icon-btn-text';
export const CLASS_DROPDOWN_OPEN_STATE = 'dropdown-open';
export const CLASS_DONORBOX_LINK = 'libretexts-dbox-popup';
export const CLASS_BUY_PRINT_COPY_BTN = 'libre-buy-print-copy-btn';
export const CLASS_DONATE_ICON_SPAN = 'donate-icon-span';

// Shapeshift export service (replaces the retired batch.libretexts.org server).
export const SHAPESHIFT_API = 'https://downloads.libretexts.org/api/v1';
export const JOB_POLL_INTERVAL_MS = 5000;
export const MAX_JOB_POLL_ATTEMPTS = 360; // ~30 min at JOB_POLL_INTERVAL_MS; bounds runaway polling

// Conductor project IDs are memoized in localStorage. The TTL bounds how long a reader
// keeps a stale ID after a book's project is re-linked or removed.
export const PROJECT_ID_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
