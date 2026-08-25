/**
 * @file The widget's stylesheet, injected into `document.head` as a `<style>` block. The
 * selectors are built from the same identifier constants used to create the elements, so
 * renaming an ID or class in `constants.ts` updates both sides at once.
 */
import {
  ID_CONTAINER_DIV,
  ID_STYLE_BLOCK,
  ID_PDF_DROPDOWN_BTN,
  ID_DWNLD_DROPDOWN_BTN,
  ID_PDF_DROPDOWN_CONTENT,
  ID_DWNLD_DROPDOWN_CONTENT,
  ID_REVIEW_DROPDOWN_BTN,
  ID_REVIEW_DROPDOWN_CONTENT,
  ID_COMMONS_ADAPT_BTN,
  ID_COMMONS_MATERIALS_BTN,
  ID_COMMONS_BTN,
  ID_CONDUCTOR_PROJECT_BTN,
  CLASS_PDF_DROPDOWN_ITEM,
  CLASS_DWNLD_DROPDOWN_ITEM,
  CLASS_REVIEW_DROPDOWN_ITEM,
  CLASS_BUTTON_ICON_TEXT,
  CLASS_DROPDOWN_OPEN_STATE,
  CLASS_BUY_PRINT_COPY_BTN,
  CLASS_DONATE_ICON_SPAN,
} from './constants';

/**
 * Appends the export button row's styles to the document head. Idempotent: the button row
 * is rebuilt in place after a compile finishes, and the `ID_STYLE_BLOCK` guard keeps that
 * from stacking a duplicate `<style>` block per rebuild.
 */
export const injectExportButtonStyles = (): void => {
  if (document.getElementById(ID_STYLE_BLOCK)) {
    return;
  }
  const commonButtonStyles = `
    color: #FFFFFF !important;
    border: none !important;
    border-radius: 0.25em !important;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 35px !important;
    box-shadow: none !important;
  `;
  const dropdownListStyles = `
    display: block !important;
    z-index: 1000;
    position: absolute;
    width: 150px;
  `;
  const dropdownOptionsStyles = `
    width: 150px !important;
    border: none !important;
    border-radius: 0.25em !important;
    box-shadow: none !important;
    color: #FFFFFF !important;
    height: 40px !important;
  `;
  const styleBlock = document.createElement('style');
  styleBlock.id = ID_STYLE_BLOCK;
  styleBlock.textContent = `
    #${ID_CONTAINER_DIV} {
      display: flex;
      flex-wrap: wrap;
      align-items: stretch;
      justify-content: center;
      gap: 0.25em;
    }
    .${CLASS_BUTTON_ICON_TEXT} {
      margin-left: 5px;
    }
    #${ID_PDF_DROPDOWN_BTN} {
      background-color: #C53030 !important;
      ${commonButtonStyles}
    }
    #${ID_PDF_DROPDOWN_BTN}:focus {
      border: 3px solid #30B3F6 !important;
      box-shadow: none !important;
    }
    #${ID_PDF_DROPDOWN_CONTENT} {
      display: none;
      background-color: #C53030;
      color: #FFFFFF;
      font-size: 14px;
    }
    #${ID_PDF_DROPDOWN_CONTENT}.${CLASS_DROPDOWN_OPEN_STATE} {
      ${dropdownListStyles}
    }
    #${ID_PDF_DROPDOWN_CONTENT} li:not(:first-child) {
      border-top: 1px solid #FFFFFF;
    }
    .${CLASS_PDF_DROPDOWN_ITEM}, .${CLASS_PDF_DROPDOWN_ITEM}:hover {
      background-color: #C53030 !important;
      ${dropdownOptionsStyles}
    }
    .${CLASS_PDF_DROPDOWN_ITEM}:hover {
      background-color: #9C2626 !important;
    }
    .${CLASS_PDF_DROPDOWN_ITEM}:not(:first-child) {
      border-top: 1px solid white !important;
    }
    .${CLASS_PDF_DROPDOWN_ITEM}:focus {
      border: 3px solid #30B3F6 !important;
      box-shadow: none !important;
    }
    #${ID_COMMONS_BTN}, #${ID_COMMONS_BTN} {
      background-color: #088A20 !important;
      padding-left: 10px !important;
      padding-right: 10px !important;
      ${commonButtonStyles}
    }
    #${ID_REVIEW_DROPDOWN_BTN} {
      background-color: #CD4D12 !important;
      ${commonButtonStyles}
    }
    #${ID_REVIEW_DROPDOWN_BTN}:focus {
      border: 3px solid #30B3F6 !important;
    }
    #${ID_REVIEW_DROPDOWN_CONTENT} {
      display: none;
      background-color: #CD4D12;
      color: #FFFFFF;
      font-size: 14px;
    }
    #${ID_REVIEW_DROPDOWN_CONTENT}.${CLASS_DROPDOWN_OPEN_STATE} {
      ${dropdownListStyles}
    }
    .${CLASS_REVIEW_DROPDOWN_ITEM}, .${CLASS_REVIEW_DROPDOWN_ITEM}:hover {
      background-color: #CD4D12 !important;
      ${dropdownOptionsStyles}
    }
    .${CLASS_REVIEW_DROPDOWN_ITEM}:hover {
      background-color: #a13706 !important;
    }
    .${CLASS_REVIEW_DROPDOWN_ITEM}:not(:first-child) {
      border-top: 1px solid white !important;
    }
    .${CLASS_REVIEW_DROPDOWN_ITEM}:focus {
      border: 3px solid #0B0115 !important;
      box-shadow: none !important;
    }
    #${ID_DWNLD_DROPDOWN_BTN} {
      background-color: #187AC9 !important;
      ${commonButtonStyles}
    }
    #${ID_DWNLD_DROPDOWN_BTN}:focus {
      border: 3px solid #0B0115 !important;
      box-shadow: none !important;
    }
    #${ID_DWNLD_DROPDOWN_CONTENT} {
      display: none;
      background-color: #187AC9;
      color: #FFFFFF;
      font-size: 14px; 
    }
    #${ID_DWNLD_DROPDOWN_CONTENT}.${CLASS_DROPDOWN_OPEN_STATE} {
      ${dropdownListStyles}
    }
    #${ID_DWNLD_DROPDOWN_CONTENT} li:not(:first-child) {
      border-top: 1px solid #FFFFFF;
    }
    .${CLASS_DWNLD_DROPDOWN_ITEM}, .${CLASS_DWNLD_DROPDOWN_ITEM}:hover {
      background-color: #187AC9 !important;
      ${dropdownOptionsStyles}
    }
    .${CLASS_DWNLD_DROPDOWN_ITEM}:hover {
      background-color: #1361A0 !important;
    }
    .${CLASS_DWNLD_DROPDOWN_ITEM}:not(:first-child) {
      border-top: 1px solid white !important;
    }
    .${CLASS_DWNLD_DROPDOWN_ITEM}:focus {
      border: 3px solid #0B0115 !important;
      box-shadow: none !important;
    }
    #${ID_COMMONS_ADAPT_BTN}, #${ID_COMMONS_ADAPT_BTN} {
      background-color: #088488 !important;
      ${commonButtonStyles}
    }
    #${ID_COMMONS_ADAPT_BTN}:focus {
      border: 3px solid #30B3F6 !important;
    }
    #${ID_COMMONS_MATERIALS_BTN}, #${ID_COMMONS_MATERIALS_BTN} {
      background-color: #2E79C6 !important;
      ${commonButtonStyles}
    }
    #${ID_COMMONS_MATERIALS_BTN}:focus {
      border: 3px solid #30B3F6 !important;
    }
    #${ID_CONDUCTOR_PROJECT_BTN}, #${ID_CONDUCTOR_PROJECT_BTN} {
      background-color: #2441E7 !important;
      padding-left: 10px !important;
      padding-right: 10px !important;
      ${commonButtonStyles}
    }
    #${ID_CONDUCTOR_PROJECT_BTN}:focus {
      border: 3px solid #30B3F6 !important;
    }
    .${CLASS_BUY_PRINT_COPY_BTN} {
      background-color: #57116A !important;
      color: #FFFFFF !important;
      border: none !important;
      border-radius: 0.25em !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 8px !important;
      height: 19px !important;
      box-shadow: none !important;
      gap: 6px !important;
    }
    .${CLASS_BUY_PRINT_COPY_BTN}-icon-span {
      padding-top: 3px
    }
    #donate {
      padding: 8px !important;
      border-radius: 0.25em !important;
      height: 19px !important;
      gap: 6px !important;
    }
    .${CLASS_DONATE_ICON_SPAN} {
      padding-top: 3px
    }
`;
  document.head.appendChild(styleBlock);
};
