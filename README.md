# LibreExportButtons

The LibreExportButtons provide quick access to several download options (such as PDFs) and other LibreVerse tools (such as those from Commons & Conductor) while reading on the LibreTexts libraries.

It is not a standalone app. It compiles to a single self-executing IIFE (`build/libreExportButtons-<version>.min.js`) that LibreTexts injects into every library page via a `<script>` tag. On evaluation it registers a `load` listener that resolves the current text, builds the button row, and replaces the contents of the CXone social-share bar (`.elm-social-share`).

## Host page contract

The bundle has no dependencies, but it is not self-contained — the library page must already provide:

- The `LibreTexts` global (from `reuse.js`), used for `getCoverpage()`, `parseURL()`, `getAPI()`, and the `LibreTexts.current` / `LibreTexts.active` namespaces.
- Hidden holder elements read for page context: `#proHolder`, `#adminHolder`, `#pageIDHolder`, `#pageTagsHolder`.
- A `.elm-social-share` element to inject into.
- The Material Icons and MindTouch (`mt-icon-*`) icon fonts.

See `src/types/libretexts.d.ts` for the typed contract.

It also reads from two LibreTexts services: Shapeshift (`downloads.libretexts.org`) for PDF/ThinCC/ZIP exports, and the LibreCommons catalog plus Conductor (`commons.libretexts.org`).

## Stack

TypeScript, bundled with Vite 6 in library mode to a single minified IIFE. No runtime dependencies and no separate stylesheet — the widget's CSS is injected into `document.head` as a `<style>` block at build-free runtime (`src/styles.ts`).

## Development

- `npm install`
- `npm run dev` — Vite dev server. Serves `index.html`, a standalone harness that stubs the `LibreTexts` global, the holder elements, and the Commons / Conductor / Shapeshift endpoints (`dev/mocks.ts`), so no LibreTexts page is needed. Edit `dev/mocks.ts` to exercise different states (Pro vs. admin, missing downloads via the stubbed `exportInfo`, no Commons entry).
- `npm run typecheck` — `tsc --noEmit`. The only checking step; Vite/esbuild strips types without checking them.
- `npm run build` — type-checks, then builds `build/libreExportButtons-<version>.min.js`, named for the version in `package.json`. The build fails if `typecheck` fails.

There is no test framework or linter.

Defects carried over unchanged from the original vanilla JS implementation are recorded in
[`LATENT_BUGS.md`](./LATENT_BUGS.md). All are fixed; the file explains what each one was
and how it was resolved.

### Source layout

| File | Contents |
| --- | --- |
| `src/index.ts` | Entry guard, `loadExportButtons`, and the button row assembly |
| `src/api.ts` | Coverpage, Commons, and Conductor lookups |
| `src/batch.ts` | Shapeshift job submission and polling |
| `src/dropdown.ts` | The dropdown factory and its keyboard interactions |
| `src/styles.ts` | The injected stylesheet |
| `src/constants.ts` | DOM IDs, class names, key names, service configuration |
| `src/state.ts` | Cached coverpage and subdomain for the current text |
| `src/dom.ts` | `assignProps` helper |
| `src/types/` | Host-page contract and remote response shapes |

## Releases

Versioning is handled by [semantic-release](https://semantic-release.gitbook.io/), so commits must follow [Conventional Commits](https://www.conventionalcommits.org/). Run the **Release New Version** workflow (`workflow_dispatch`) to cut a release; it is gated on the `DEPLOYMENT_AUTHORIZED_USERS` repository secret and bumps `package.json` plus the GitHub release notes. It does not publish to npm.

Required repository secrets: `DEPLOYMENT_AUTHORIZED_USERS`, `LIBREBOT_ACCESS_TOKEN`.

## Deployment

The release workflow does not build or upload the bundle. After a release, pull the bumped `package.json`, run `npm run build`, and copy `build/libreExportButtons-<version>.min.js` to the CDN.

**The bundle filename changes on every release.** Update the `<script>` tag on the libraries to point at the new version, otherwise the deploy is a no-op.
