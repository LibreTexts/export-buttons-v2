import {readFileSync} from 'node:fs';
import {defineConfig} from 'vite';

// The bundle is named for the package version so the CDN can pin a release and
// bust caches on upgrade. semantic-release writes this field before tagging, so
// a build after a release picks up the new version automatically.
const {version} = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/*
The widget ships as a single self-executing IIFE that LibreTexts injects into every
library page via a <script> tag. It has no dependencies and no exports: on evaluation
it registers a `load` listener that builds the export button row and replaces the
contents of the CXone social-share bar. `npm run build` produces
build/libreExportButtons-<version>.min.js. `npm run dev` serves index.html — a
standalone harness that stubs the host globals and DOM.
*/
export default defineConfig({
    build: {
        // The source ships optional chaining and nullish coalescing; es2020 keeps them
        // intact rather than downleveling, matching what the hand-run terser step emitted.
        target: 'es2020',
        outDir: 'build',
        emptyOutDir: true,
        lib: {
            entry: 'src/index.ts',
            formats: ['iife'],
            name: 'LibreExportButtons',
            fileName: () => `libreExportButtons-${version}.min.js`,
        },
    },
});
