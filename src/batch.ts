/**
 * @file Compiles a page or book on demand through the Shapeshift export service.
 */
import { getDownloadURL } from './api';
import {
  ID_PDF_DROPDOWN_BTN,
  JOB_POLL_INTERVAL_MS,
  MAX_JOB_POLL_ATTEMPTS,
  SHAPESHIFT_API,
} from './constants';
import type { ShapeshiftJobResponse } from './types/api';

// Export jobs currently being polled, keyed by target URL. Prevents repeated clicks from
// submitting duplicate jobs and spawning parallel poll loops against the Shapeshift API.
const activeBatchJobs = new Set<string>();

/**
 * Submits an export job to the Shapeshift service to compile the current page or book,
 * then polls for completion. Shapeshift doesn't stream progress like legacy Batch, so
 * the PDF dropdown button shows a generic "Compiling" state until the job finishes, at
 * which point the resulting PDF is opened. Completed jobs are memoized per target to
 * avoid recompiling.
 *
 * @param {string} [target] - The URL of the page or book to compile. Defaults to the
 *  current page URL.
 */
export const batch = async (target?: string): Promise<void> => {
  const jobTarget = target || window.location.href;
  if (!window.LibreTextsBatchCompleted) {
    window.LibreTextsBatchCompleted = {};
  }
  // Already compiled this target: just reopen the finished file.
  const completedLocation = window.LibreTextsBatchCompleted[jobTarget];
  if (completedLocation) {
    window.open(completedLocation, '_blank', 'noreferrer');
    return;
  }
  // Already compiling this target: ignore the click so we don't submit a duplicate job
  // or start a second poll loop.
  if (activeBatchJobs.has(jobTarget)) {
    return;
  }
  activeBatchJobs.add(jobTarget);

  const batchButton = document.getElementById(ID_PDF_DROPDOWN_BTN)!;
  batchButton.classList.remove('material-icons');
  batchButton.innerText = 'Request sent...';

  /**
   * Marks the job for this target as no longer in-flight (allowing a future retry) and
   * updates the dropdown button label. Called on every terminal outcome.
   *
   * @param {string} label - The text to display on the dropdown button.
   */
  const endBatchJob = (label: string): void => {
    activeBatchJobs.delete(jobTarget);
    batchButton.innerText = label;
  };

  /**
   * Polls Shapeshift for the status of a job until it finishes, fails, or exceeds the
   * attempt cap, opening the resulting PDF on success.
   *
   * @param {string} jobID - The Shapeshift job identifier to poll.
   * @param {number} [attempt=1] - The current poll attempt number.
   */
  const pollJob = async (jobID: string, attempt = 1): Promise<void> => {
    try {
      const statusRes = await fetch(`${SHAPESHIFT_API}/job/${jobID}`);
      const statusBody: ShapeshiftJobResponse = await statusRes.json();
      const job = statusBody?.data;
      if (!statusRes.ok || !job) {
        throw new Error(statusBody?.msg || 'Failed to retrieve export job status.');
      }
      if (job.status === 'finished') {
        const fileLocation = getDownloadURL(job.bookID!, 'pdf');
        window.LibreTextsBatchCompleted![jobTarget] = fileLocation;
        window.open(fileLocation, '_blank', 'noreferrer');
        endBatchJob('Finished');
        return;
      }
      if (job.status === 'failed') {
        endBatchJob('Export failed');
        alert('The export job failed. Please try again later.');
        return;
      }
      // Still 'created' or 'inprogress': keep polling until the attempt cap is reached.
      if (attempt >= MAX_JOB_POLL_ATTEMPTS) {
        endBatchJob('Export timed out');
        alert('The export is taking longer than expected. Please try again later.');
        return;
      }
      setTimeout(() => pollJob(jobID, attempt + 1), JOB_POLL_INTERVAL_MS);
    } catch (e) {
      // Stop polling on any error rather than hammering the API on transient failures.
      endBatchJob('Export failed');
      console.error(`[ExportButtons]: ${(e as Error).toString()}`);
      alert('Something went wrong while exporting. Please try again later.');
    }
  };

  try {
    const jobRes = await fetch(`${SHAPESHIFT_API}/job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: jobTarget }),
    });
    const jobBody: ShapeshiftJobResponse = await jobRes.json();
    const jobID = jobBody?.data?.id;
    if (!jobRes.ok || !jobID) {
      throw new Error(jobBody?.msg || 'Failed to create export job.');
    }
    batchButton.innerText = 'Compiling…';
    pollJob(jobID);
  } catch (e) {
    endBatchJob('Export failed');
    console.error(`[ExportButtons]: ${(e as Error).toString()}`);
    alert('Something went wrong while exporting. Please try again later.');
  }
};

/*
 * Cover-page rendering is not yet supported by Shapeshift (no cover endpoint exists in
 * the API). The legacy batch.libretexts.org implementation is preserved below, commented
 * out, so it can be revived if/when Shapeshift adds an equivalent.
 *
 * const cover = (target) => {
 *   const numPages = prompt('Number of content pages:');
 *   if (numPages && !Number.isNaN(numPages)) {
 *     window.open(
 *       `https://batch.libretexts.org/print/cover=${target}&options={"numPages":"${numPages}", "hasExtraPadding": true}`,
 *       '_blank',
 *       'noreferrer',
 *     );
 *   } else {
 *     alert(`${numPages} is not recognized as a number! Please try again.`);
 *   }
 * };
 */
