/**
 * @file The dropdown factory used by every menu in the export button row. Handles the
 * hover/focus open-close behavior and the arrow-key roving focus over the options.
 */
import {
  ARROW_DOWN_KEY,
  ARROW_UP_KEY,
  ENTER_KEY,
  ESCAPE_KEY,
  SPACE_KEY,
} from './constants';
import { assignProps } from './dom';

/** A single entry in a dropdown menu. */
export interface DropdownOption {
  /** The UI text to include in the button. */
  text?: string;
  /** The HTML title/label to set on the button. */
  title: string;
  /** The URL to open when clicked, if the button should function as a link. */
  href?: string;
  /** The function to run when clicked, if it should not function as a link. */
  listener?: (e: MouseEvent) => void;
  /** The CXone icon class to set as the button's contents, if desired. */
  icon?: string;
  /** Identifier used by callers to index the option; unused by the factory. */
  key?: string;
}

/** Properties used while building a dropdown. */
export interface DropdownProps {
  /** The class to set on the main dropdown div. */
  dropdownClass: string;
  /** The DOM ID to set on the dropdown button. */
  dropdownBtnId: string;
  /** The class to set on the dropdown button. */
  dropdownBtnClass: string;
  /** The HTML title/label to set on the dropdown button. */
  dropdownBtnTitle: string;
  /** The name of the icon to include on the dropdown button, if desired. */
  dropdownIconName?: string;
  /** The class to set on the icon included in the dropdown button, if desired. */
  dropdownIconClass?: string;
  /** The UI text to include in the dropdown button, if desired. */
  dropdownText?: string;
  /** The DOM ID to set on the dropdown options container. */
  dropdownOptsId: string;
  /** The class to set on the dropdown options container when the dropdown is open. */
  dropdownOptsOpenClass: string;
  /** The class to set on each dropdown option button. */
  dropdownOptsBtnClass: string;
  /** The class to set on the UI text included in each dropdown option button. */
  dropdownOptsBtnTxtClass: string;
  /** Information about each dropdown option to include. */
  dropdownOptions: DropdownOption[];
}

/**
 * Creates a new button with a dropdown element and interactions built in.
 *
 * @param {object} props - Properties to use while building the dropdown.
 * @returns {HTMLElement} - The dropdown ready for DOM inclusion.
 */
export const createDropdown = ({
  dropdownClass,
  dropdownBtnId,
  dropdownBtnClass,
  dropdownBtnTitle,
  dropdownIconName,
  dropdownIconClass,
  dropdownText,
  dropdownOptsId,
  dropdownOptsOpenClass,
  dropdownOptsBtnClass,
  dropdownOptsBtnTxtClass,
  dropdownOptions,
}: DropdownProps): HTMLElement => {
  /**
   * Creates a new dropdown button with interactions attached.
   *
   * @param {object} buttonProps - Properties to use while assembling the button.
   * @param {Function} focusOutListener - A function to run when the button loses focus.
   * @param {Function} keyDownListener - A function to run when a key is pressed while the button
   *  is focused.
   * @returns {HTMLElement} The new button to include in the dropdown.
   */
  const createDropdownButton = (
    {
      text, title, href, listener, icon,
    }: DropdownOption,
    focusOutListener: (e: FocusEvent) => void,
    keyDownListener: (e: KeyboardEvent) => void,
  ): HTMLElement => {
    let didAddIcon = false;
    /* Create basic structure */
    const newButton = document.createElement('button');
    assignProps(newButton, {
      classList: dropdownOptsBtnClass,
      type: 'button',
      ariaLabel: title,
      title,
    });
    /* Add text and icons */
    if (typeof (icon) === 'string') {
      const buttonIcon = document.createElement('span');
      assignProps(buttonIcon, { classList: icon, ariaHidden: true });
      newButton.appendChild(buttonIcon);
      didAddIcon = true;
    }
    if (typeof (text) === 'string') {
      const newTextNode = document.createTextNode(text);
      if (didAddIcon) {
        const buttonText = document.createElement('span');
        assignProps(buttonText, { classList: dropdownOptsBtnTxtClass, ariaHidden: true });
        buttonText.appendChild(newTextNode);
        newButton.appendChild(buttonText);
      } else {
        newButton.appendChild(newTextNode);
      }
    }
    /* Add actions */
    if (typeof (listener) === 'function') {
      newButton.addEventListener('click', listener);
    } else if (typeof (href) === 'string') {
      newButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(href, '_blank', 'noreferrer');
      });
    }
    newButton.addEventListener('focusout', focusOutListener);
    newButton.addEventListener('keydown', keyDownListener);
    return newButton;
  };

  /* Create dropdown elements */
  const newDropdown = document.createElement('div');
  const newDropdownBtn = document.createElement('button');
  const newDropdownOpts = document.createElement('div');
  newDropdown.classList.add(dropdownClass);
  assignProps(newDropdownBtn, {
    id: dropdownBtnId,
    classList: dropdownBtnClass,
    type: 'button',
    title: dropdownBtnTitle,
    tabIndex: 0,
    ariaExpanded: false,
  });
  if (dropdownIconName && dropdownIconClass) {
    const newDropdownIcon = document.createElement('span');
    assignProps(newDropdownIcon, { classList: dropdownIconClass, ariaHidden: true });
    newDropdownIcon.appendChild(document.createTextNode(dropdownIconName));
    newDropdownBtn.appendChild(newDropdownIcon);
  }
  if (dropdownText) {
    const newDropdownText = document.createTextNode(dropdownText);
    // No-op at runtime: `Text` has no `ariaHidden`. Preserved from the original.
    assignProps(newDropdownText, { ariaHidden: true });
    newDropdownBtn.appendChild(newDropdownText);
  }
  newDropdown.appendChild(newDropdownBtn);
  newDropdownOpts.id = dropdownOptsId;

  /* Add actions */
  // `ariaExpanded` is a string reflection; assigning the booleans the original used
  // coerces to exactly these values, and the arrow-key handler below compares to 'true'.
  const openDropdown = (e?: Event): void => {
    if (e) e.preventDefault();
    newDropdownBtn.ariaExpanded = 'true';
    newDropdownOpts.classList.add(dropdownOptsOpenClass);
  };
  const closeDropdown = (e?: Event): void => {
    if (e) e.preventDefault();
    newDropdownBtn.ariaExpanded = 'false';
    newDropdownOpts.classList.remove(dropdownOptsOpenClass);
  };
  newDropdown.addEventListener('mouseenter', openDropdown);
  newDropdown.addEventListener('mouseleave', closeDropdown);
  newDropdown.addEventListener('keydown', (e) => {
    if (e.key === ESCAPE_KEY) closeDropdown(e);
  });
  newDropdown.addEventListener('focusout', (e) => {
    if (newDropdownOpts?.children) {
      const dropdownChildren = Array.from(newDropdownOpts.children);
      if (dropdownChildren && dropdownChildren.length > 0) {
        if (!dropdownChildren.includes(e.relatedTarget as Element)) {
          // New focus is not in the dropdown, close it
          closeDropdown(e);
        }
      }
    }
  });
  newDropdownBtn.addEventListener('click', openDropdown);
  newDropdownBtn.addEventListener('keydown', (e) => {
    if (e.key === ENTER_KEY || e.key === SPACE_KEY) {
      openDropdown(e);
    } else if (e.key === ARROW_DOWN_KEY) {
      e.preventDefault();
      if (newDropdownBtn.ariaExpanded === 'true') {
        if (newDropdownOpts?.children && newDropdownOpts.children.length > 0) {
          (newDropdownOpts.children[0] as HTMLElement).focus(); // focus first element in list
        }
      }
    }
  });

  /**
   * Searches the dropdown options to detect if any if still have focus.
   *  If not, the dropdown is closed.
   *
   * @param {FocusEvent} e - The event that triggered the listener.
   */
  const optionFocusOutListener = (e: FocusEvent): void => {
    if (newDropdownOpts?.children) {
      e.stopPropagation();
      const dropdownChildren = Array.from(newDropdownOpts.children);
      if (dropdownChildren && dropdownChildren.length > 0) {
        const lastChild = dropdownChildren[dropdownChildren.length - 1];
        if (e.target === lastChild && !dropdownChildren.includes(e.relatedTarget as Element)) {
          // Last element in list lost focus and new focus is not in list, so close dropdown
          closeDropdown(e);
        }
      }
    }
  };

  /**
   * Detects up or down arrow presses from the keyboard and attempts to focus the next relative
   *  option in the dropdown list.
   *
   * @param {KeyboardEvent} e - The event that triggered the listener.
   */
  const optionKeyDownListener = (e: KeyboardEvent): void => {
    if (e.key === ARROW_DOWN_KEY || e.key === ARROW_UP_KEY) {
      e.preventDefault();
      if (newDropdownOpts?.children) {
        const dropdownChildren = Array.from(newDropdownOpts.children);
        if (dropdownChildren && dropdownChildren.length > 0) {
          const currElemIdx = dropdownChildren.findIndex((elem) => elem === e.target);
          if (currElemIdx > -1) {
            let prevElement: HTMLElement | null = null;
            let nextElement: HTMLElement | null = null;
            if ((currElemIdx - 1 >= 0) && dropdownChildren[currElemIdx - 1]) {
              prevElement = dropdownChildren[currElemIdx - 1] as HTMLElement;
            }
            if (
              (currElemIdx + 1 < dropdownChildren.length)
              && dropdownChildren[currElemIdx + 1]
            ) {
              nextElement = dropdownChildren[currElemIdx + 1] as HTMLElement;
            }
            if (e.key === ARROW_DOWN_KEY && nextElement) {
              // Move down to next elem in list
              nextElement.focus();
            }
            if (e.key === ARROW_UP_KEY && prevElement) {
              // Move up to previous elem in list
              prevElement.focus();
            }
          }
        }
      }
    }
  };

  /* Add dropdown options/list elements */
  if (dropdownOptions && dropdownOptions.length > 0) {
    for (let i = 0, n = dropdownOptions.length; i < n; i += 1) {
      newDropdownOpts.appendChild(createDropdownButton(
        dropdownOptions[i]!,
        optionFocusOutListener,
        optionKeyDownListener,
      ));
    }
  }

  newDropdown.appendChild(newDropdownOpts);
  return newDropdown;
};
