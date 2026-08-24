/**
 * @file The widget's module-level cache of the current text. `loadCoverpage` in `api.ts`
 * populates it once and every other lookup reads from it, so it lives in its own module
 * rather than being threaded through call sites.
 */
import type { CoverpageInfo } from './types/api';

export const state: {
  currentCoverpage: CoverpageInfo | null;
  currentSubdomain: string | null;
} = {
  currentCoverpage: null,
  currentSubdomain: null,
};
