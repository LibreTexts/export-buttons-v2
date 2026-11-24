/**
 * @file Adds export options and menus to the LibreTexts library pages.
 * @author LibreTexts <info@libretexts.org>
 */
import {
  getBook,
  getBookCommonsEntry,
  getBookID,
  getBookProjectID,
  getDownloadURL,
} from './api';
import { batch } from './batch';
import {
  CLASS_BUTTON_ICON_TEXT,
  CLASS_BUY_PRINT_COPY_BTN,
  CLASS_DONATE_ICON_SPAN,
  CLASS_DONORBOX_LINK,
  CLASS_DROPDOWN,
  CLASS_DROPDOWN_BTN,
  CLASS_DROPDOWN_OPEN_STATE,
  CLASS_DWNLD_DROPDOWN_ITEM,
  CLASS_PDF_DROPDOWN_ITEM,
  CLASS_REVIEW_DROPDOWN_ITEM,
  ENTER_KEY,
  ID_COMMONS_ADAPT_BTN,
  ID_COMMONS_BTN,
  ID_COMMONS_MATERIALS_BTN,
  ID_CONDUCTOR_PROJECT_BTN,
  ID_CONTAINER_DIV,
  ID_DONORBOX_SCRIPT,
  ID_DWNLD_DROPDOWN_BTN,
  ID_DWNLD_DROPDOWN_CONTENT,
  ID_PDF_DROPDOWN_BTN,
  ID_PDF_DROPDOWN_CONTENT,
  ID_REVIEW_DROPDOWN_BTN,
  ID_REVIEW_DROPDOWN_CONTENT,
} from './constants';
import { assignProps } from './dom';
import { createDropdown } from './dropdown';
import type { DropdownOption } from './dropdown';
import { refreshAfterCompile } from './refresh';
import { state } from './state';
import { injectExportButtonStyles } from './styles';
import type { CommonsBook } from './types/api';

/**
 * Reads one of the hidden holder elements the host page is contracted to provide.
 *
 * @param {string} id - The holder element's ID.
 * @returns {string} The holder's text content.
 * @throws {Error} If the host page does not provide the holder.
 */
const readHolder = (id: string): string => {
  const holder = document.getElementById(id);
  if (!holder) {
    throw new Error(`host page is missing the #${id} element`);
  }
  return holder.innerText;
};

/**
 * Retrieves information about the current LibreText and inserts applicable export dropdowns
 *  and the Readability menu toggle into the DOM.
 *
 * Safe to run more than once: it always rebuilds the row from freshly fetched data and
 * replaces the social-share bar's contents wholesale, which is how the post-compile
 * refresh in `refresh.ts` surfaces downloads that a compile just unlocked.
 *
 * @param {object} [prefetched] - A Commons entry the caller already holds, to skip refetching it.
 */
const buildExportButtons = async (prefetched?: CommonsBook): Promise<void> => {
  try {
    // These four holders are provided by the host page. Reading them inside the try means a
    // broken host contract still leaves the global assignments below intact, so other page
    // scripts that depend on `LibreTexts.batch` keep working.
    const isPro = readHolder('proHolder') === 'true';
    const isAdmin = readHolder('adminHolder') === 'true';
    const basicBatchAccess = isAdmin || isPro;
    const pageID = Number.parseInt(readHolder('pageIDHolder'), 10);
    const tags = readHolder('pageTagsHolder');

    // The Commons catalog entry is the single source of truth for this text: an
    // `exportInfo` object is only written once the book has been compiled, so its
    // presence is what marks prepared downloads as available. The systemwide
    // DownloadsCenter listings this used to read are no longer maintained.
    let commonsEntry: CommonsBook | null;
    if (prefetched) {
      // The post-compile probe fetched this quietly, so announce it here instead.
      commonsEntry = prefetched;
      window.dispatchEvent(new Event('libre-commonsinfoavailable', { cancelable: true }));
    } else {
      commonsEntry = await getBookCommonsEntry();
    }
    const downloadsAvailable = Boolean(commonsEntry?.exportInfo);

    const topicGuide = tags.includes('"article:topic-guide"');
    // `coverID` is the coverpage's MindTouch page ID as a string; `pageID` is a number,
    // so both sides are normalized before comparing. Falls back to the cached coverpage
    // for texts with no Commons entry.
    const coverID = commonsEntry?.coverID ?? state.currentCoverpage?.id;
    const isChapter = topicGuide && (
      !downloadsAvailable || String(coverID) !== String(pageID)
    );
    const fullBook = await getBook();
    const exportFragment = document.createDocumentFragment(); // create in a vDOM first
    const exportContainer = document.createElement('div');
    exportContainer.id = ID_CONTAINER_DIV;

    /* PDF Export Dropdown */
    const pdfExportOptions: DropdownOption[] = [];

    /* Full PDF Download */
    if (fullBook) {
      LibreTexts.current.downloads.pdf.full = fullBook;
      pdfExportOptions.push({
        text: 'Full Book',
        title: 'Get a PDF of this book (opens in a new tab)',
        href: fullBook,
      });
    }
    /* Chapter PDF Download */
    if (isChapter) {
      pdfExportOptions.push({
        text: 'Chapter',
        title: 'Get a PDF of this chapter (opens in a new tab)',
        listener: (e) => {
          e.preventDefault();
          batch();
        },
      });
    }
    /* Page PDF Download */
    if (tags.includes('"article:topic"')) {
      // Shapeshift has no direct single-page download, so compile this page on demand
      // via the job flow (opens in a new tab when complete).
      pdfExportOptions.push({
        text: 'Page',
        title: 'Get a PDF of this page (opens in a new tab when complete)',
        listener: (e) => {
          e.preventDefault();
          batch();
        },
      });
    }
    /* Compile Book (Page + Subpages) */
    if (basicBatchAccess && pdfExportOptions.length > 0) { // don't add option if non-content
      pdfExportOptions.push({
        text: 'Compile Book',
        title: 'Compile this page and all subpages (opens in new tab when complete)',
        listener: (e) => {
          e.preventDefault();
          batch();
        },
        icon: 'mt-icon-spinner6',
      });
    }
    /*
     * The legacy "Compile Full" option forced a no-cache full recompile via
     * batch.libretexts.org. Shapeshift has no cache-control, so this option is dropped;
     * "Compile Book" above submits a standard job that covers recompilation.
     */

    if (pdfExportOptions.length > 0) {
      exportContainer.appendChild(createDropdown({
        dropdownClass: CLASS_DROPDOWN,
        dropdownBtnId: ID_PDF_DROPDOWN_BTN,
        dropdownBtnClass: CLASS_DROPDOWN_BTN,
        dropdownBtnTitle: 'PDF Export Options',
        dropdownIconName: 'picture_as_pdf',
        dropdownIconClass: 'material-icons',
        dropdownOptsId: ID_PDF_DROPDOWN_CONTENT,
        dropdownOptsOpenClass: CLASS_DROPDOWN_OPEN_STATE,
        dropdownOptsBtnClass: CLASS_PDF_DROPDOWN_ITEM,
        dropdownOptsBtnTxtClass: CLASS_BUTTON_ICON_TEXT,
        dropdownOptions: pdfExportOptions,
      }));
    }

    /* Prepared Download Dropdown */
    if (downloadsAvailable) {
      const bookID = getBookID();
      const bookstoreURL = commonsEntry?.links?.buy
        ?? `https://commons.libretexts.org/store/product/${bookID}`;

      const downloadOptions: DropdownOption[] = [
        {
          key: 'full',
          text: 'Full PDF',
          title: 'Download Full PDF',
          href: getDownloadURL(bookID, 'pdf'),
          icon: 'mt-icon-file-pdf',
        },
        {
          key: 'lms',
          text: 'Import into LMS (Thin CC)',
          title: 'Download Thin CC File for LMS Import',
          href: getDownloadURL(bookID, 'thincc'),
          icon: 'mt-icon-graduation',
        },
        {
          key: 'zip',
          text: 'Individual ZIP',
          title: 'Download ZIP of Individual Pages',
          href: getDownloadURL(bookID, 'pages'),
          icon: 'mt-icon-file-zip',
        },
        {
          key: 'bookstore',
          text: 'Buy Print Copy',
          title: 'Buy Print Copy (opens in new tab)',
          href: bookstoreURL,
          icon: 'mt-icon-book2',
        },
        {
          key: 'publication',
          text: 'Print Book Files',
          title: 'Download Publication Files',
          href: getDownloadURL(bookID, 'publication'),
          icon: 'mt-icon-book3',
        },
      ];

      downloadOptions.forEach((option) => {
        LibreTexts.current.downloads[option.key!] = option.href;
      });

      const downloadsInfoAvailable = new Event('libre-downloadsinfoavailable', {
        cancelable: true,
      });
      window.dispatchEvent(downloadsInfoAvailable);

      exportContainer.appendChild(createDropdown({
        dropdownClass: CLASS_DROPDOWN,
        dropdownBtnId: ID_DWNLD_DROPDOWN_BTN,
        dropdownBtnClass: CLASS_DROPDOWN_BTN,
        dropdownBtnTitle: 'LibreText Download Options',
        dropdownText: 'Downloads',
        dropdownOptsId: ID_DWNLD_DROPDOWN_CONTENT,
        dropdownOptsOpenClass: CLASS_DROPDOWN_OPEN_STATE,
        dropdownOptsBtnClass: CLASS_DWNLD_DROPDOWN_ITEM,
        dropdownOptsBtnTxtClass: CLASS_BUTTON_ICON_TEXT,
        dropdownOptions: downloadOptions,
      }));

      /* Also add "Buy Print Copy" as a standalone button */
      const buyPrintCopyLink = document.createElement('a');
      assignProps(buyPrintCopyLink, {
        title: 'Buy Print Copy (opens in new tab)',
        href: bookstoreURL,
        target: '_blank',
        rel: 'noreferrer',
        classList: CLASS_BUY_PRINT_COPY_BTN,
        id: 'buyPrintCopy',
        ariaLabel: 'Buy Print Copy',
      });

      buyPrintCopyLink.classList.add(CLASS_BUY_PRINT_COPY_BTN);

      // Create the span element for the icon
      const iconSpan = document.createElement('span');
      iconSpan.classList.add('mt-icon-book2', `${CLASS_BUY_PRINT_COPY_BTN}-icon-span`); // Add the icon class
      iconSpan.setAttribute('aria-hidden', 'true');

      // Create the text node
      const buttonText = document.createTextNode(' Buy Print Copy'); // Space for separation

      // Append icon and text to the button
      buyPrintCopyLink.appendChild(iconSpan);
      buyPrintCopyLink.appendChild(buttonText);

      exportContainer.appendChild(buyPrintCopyLink);
    }

    /* LibreCommons tools/buttons */
    if (commonsEntry) {
      const commonsURL = `https://commons.libretexts.org/book/${commonsEntry.bookID}`;

      /**
       * Opens the text's LibreCommons Catalog entry page in a new tab with the Adoption Report
       * tool open.
       *
       * @param {MouseEvent|KeyboardEvent} e - The event that triggered the handler.
       */
      const openAdoptionReport = (e: Event): void => {
        e.preventDefault();
        window.open(`${commonsURL}?adoptionreport=show`, '_blank', 'noreferrer');
      };

      /**
       * Opens the text's LibreCommons Catalog entry page in a new tab with the Peer Review
       * submission form open.
       *
       * @param {MouseEvent|KeyboardEvent} e - The event that triggered the handler.
       */
      const openPeerReview = (e: Event): void => {
        e.preventDefault();
        window.open(`${commonsURL}?peerreview=show`, '_blank', 'noreferrer');
      };

      /**
       * Opens the text's associated ADAPT course in a new tab using anonymous access.
       *
       * @param {MouseEvent|KeyboardEvent} e - The event that triggered the handler.
       */
      const openADAPTCourse = (e: Event): void => {
        e.preventDefault();
        window.open(
          `https://adapt.libretexts.org/courses/${commonsEntry.adaptCourseID}/anonymous`,
          '_blank',
          'noreferrer',
        );
      };

      /**
       * Opens the text's LibreCommons Catalog entry page in a new tab with the Ancillary
       * Materials viewer open.
       *
       * @param {MouseEvent|KeyboardEvent} e - The event that triggered the handler.
       */
      const openAncillaryMaterials = (e: Event): void => {
        e.preventDefault();
        window.open(`${commonsURL}?materials=show`, '_blank', 'noreferrer');
      };


      const reviewOptions: DropdownOption[] = [{
        text: 'Submit Adoption Report',
        title: 'Submit an Adoption Report for this text (opens in new tab)',
        listener: (e) => {
          e.preventDefault();
          openAdoptionReport(e);
        },
        icon: "mt-icon-user-activity"
      }];

      if(commonsEntry.hasPeerReviews || commonsEntry.allowAnonPR){
        reviewOptions.push({
          text: 'Submit a Peer Review',
          title: 'Submit a Peer Review for this text (opens in new tab)',
          listener: (e) => {
            e.preventDefault();
            openPeerReview(e);
          },
          icon: "mt-icon-support-man"
        })
      }

      exportContainer.appendChild(createDropdown({
        dropdownClass: CLASS_DROPDOWN,
        dropdownBtnId: ID_REVIEW_DROPDOWN_BTN,
        dropdownBtnClass: CLASS_REVIEW_DROPDOWN_ITEM,
        dropdownBtnTitle: 'Review & Adopt Options',
        dropdownText: 'Review / Adopt',
        dropdownOptsId: ID_REVIEW_DROPDOWN_CONTENT,
        dropdownOptsOpenClass: CLASS_DROPDOWN_OPEN_STATE,
        dropdownOptsBtnClass: CLASS_REVIEW_DROPDOWN_ITEM,
        dropdownOptsBtnTxtClass: CLASS_BUTTON_ICON_TEXT,
        dropdownOptions: reviewOptions,
      }));

      if (commonsEntry.hasAdaptCourse) {
        const adaptButton = document.createElement('button');
        assignProps(adaptButton, {
          id: ID_COMMONS_ADAPT_BTN,
          title: 'View ADAPT Homework Resources (opens in new tab)',
          type: 'button',
          tabIndex: 0,
        });
        adaptButton.appendChild(document.createTextNode('Homework'));
        adaptButton.addEventListener('click', openADAPTCourse);
        adaptButton.addEventListener('keydown', (e) => {
          if (e.key === ENTER_KEY) openADAPTCourse(e);
        });
        exportContainer.appendChild(adaptButton);
      }

      if (commonsEntry.hasMaterials) {
        const materialsButton = document.createElement('button');
        assignProps(materialsButton, {
          id: ID_COMMONS_MATERIALS_BTN,
          title: 'View Ancillary Materials (opens in new tab)',
          type: 'button',
          tabIndex: 0,
        });
        materialsButton.appendChild(document.createTextNode('Ancillary Materials'));
        materialsButton.addEventListener('click', openAncillaryMaterials);
        materialsButton.addEventListener('keydown', (e) => {
          if (e.key === ENTER_KEY) openAncillaryMaterials(e);
        });
        exportContainer.appendChild(materialsButton);
      }

      /* Add Commons button */
      const commonsButton = document.createElement('a');
      assignProps(commonsButton, {
        id: ID_COMMONS_BTN,
        ariaLabel: 'View LibreCommons Catalog Entry (opens in new tab)',
        title: 'View LibreCommons Catalog Entry (opens in new tab)',
        type: 'button',
        target: '_blank',
        rel: 'noreferrer',
        href: commonsURL,
      });
      commonsButton.appendChild(document.createTextNode('View on Commons'));
      exportContainer.appendChild(commonsButton);
    }

    /* Add DonorBox links (if applicable) */
    if (!isAdmin) {
      const donorBoxLink = document.createElement('a');
      assignProps(donorBoxLink, {
        href: 'https://donorbox.org/libretexts',
        target: '_blank',
        rel: 'noreferrer',
        classList: `${CLASS_DONORBOX_LINK} notSS`,
        id: 'donate',
        ariaLabel: 'Donate to LibreTexts (opens in modal)',
      });

      // Create the span element for the icon
      const donateIconSpan = document.createElement('span');
      donateIconSpan.classList.add('mt-icon-support-hands', CLASS_DONATE_ICON_SPAN);
      donateIconSpan.setAttribute('aria-hidden', 'true');
      donorBoxLink.appendChild(donateIconSpan);

      // Create the text node
      donorBoxLink.appendChild(document.createTextNode(' Donate')); // Space for separation

      exportContainer.appendChild(donorBoxLink);
      window.DonorBox = { widgetLinkClassName: CLASS_DONORBOX_LINK };
      // The popup script binds to the donate link when it loads, so a rebuild has to drop
      // the previous copy and re-add it: leaving it in place would leave the freshly
      // created link unwired, and appending blindly would stack duplicate scripts.
      document.getElementById(ID_DONORBOX_SCRIPT)?.remove();
      const donorBoxScript = document.createElement('script');
      assignProps(donorBoxScript, {
        id: ID_DONORBOX_SCRIPT,
        type: 'text/javascript',
        src: 'https://donorbox.org/install-popup-button.js',
        defer: true,
      });
      document.body.append(donorBoxScript);
    }

    // Only Pro users see the button, and nothing reads the project ID for anonymous
    // readers, so skip the Conductor lookup for them entirely.
    const conductorProjectID = isPro ? await getBookProjectID() : null;
    if (conductorProjectID) {
      /* Add Conductor Project button */
      const conductorButton = document.createElement('a');
      assignProps(conductorButton, {
        id: ID_CONDUCTOR_PROJECT_BTN,
        ariaLabel: 'View Conductor Project (opens in new tab)',
        title: 'View Conductor Project (opens in new tab)',
        type: 'button',
        target: '_blank',
        rel: 'noopener',
        href: `https://commons.libretexts.org/projects/${conductorProjectID}`,
      });


      // conductorButton.addEventListener('click', openConductorProject);
      // conductorButton.addEventListener('keydown', (e) => {
      //   if (e.key === ENTER_KEY) openConductorProject(e);
      // });

      conductorButton.appendChild(document.createTextNode('Conductor Project'));
      exportContainer.appendChild(conductorButton);
    }

    /* Styles */
    injectExportButtonStyles();

    /* Add buttons to DOM */
    exportFragment.appendChild(exportContainer);
    const cxSocialShare = document.querySelector('.elm-social-share');
    if (cxSocialShare) {
      cxSocialShare.replaceChildren(exportFragment);
    }

    /*
     * The TOC link is not yet supported by Shapeshift (no toc endpoint exists in the API).
     * The legacy batch.libretexts.org implementation is preserved below, commented out, so
     * it can be revived if/when Shapeshift adds an equivalent.
     *
     * const url = window.location.href.replace(/#$/, '');
     * const getTOCLink = document.getElementById('getTOCLink');
     * if (getTOCLink) {
     *   getTOCLink.rel = 'noopener nofollow';
     *   getTOCLink.href = `https://batch.libretexts.org/print/toc=${url}`;
     * }
     */
  } catch (e) {
    console.error(`[ExportButtons]: ${(e as Error).toString()}`);
  }
};

/**
 * Builds the button row, then keeps it current: a finished export job can make prepared
 * downloads (and, for a never-compiled book, the whole Commons/Conductor block) available
 * for the first time, so the row is rebuilt once that data lands.
 */
const loadExportButtons = async (): Promise<void> => {
  await buildExportButtons();

  window.addEventListener('libre-exportjobfinished', () => {
    void refreshAfterCompile(buildExportButtons);
  });

  LibreTexts.active.exportButtons = true;
  /* attach functions to global namespace */
  LibreTexts.batch = batch;
  // LibreTexts.cover = cover; // disabled: Shapeshift has no cover endpoint (see above)
};

// only load if client-facing and not yet initialized.
// The bare `LibreTexts` reference is deliberate: optional chaining does not guard an
// undeclared identifier, so this throws when the host global is missing, exactly as the
// original did.
if (!(navigator.webdriver || window.matchMedia('print').matches) && !LibreTexts?.active?.exportButtons) {
  window.addEventListener('load', loadExportButtons);
}
