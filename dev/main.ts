/**
 * @file Dev-server entry. Installs the host stubs, then loads the widget exactly as a
 * library page would. Not shipped.
 */
import './mocks';
import '../src/index';

// The widget attaches its work to `window`'s `load` event. Under Vite the module graph
// may resolve after the real `load` has already fired, in which case that listener would
// never run, so re-dispatch it once the document is ready.
if (document.readyState === 'complete') {
  window.dispatchEvent(new Event('load'));
}
