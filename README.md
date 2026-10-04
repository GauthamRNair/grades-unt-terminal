# grades-unt

## Choosing classes is a gamble. It shouldn't be.

You do not always know what you are signing up for until it is too late. `grades-unt` makes UNT grade distributions easier to browse by course and instructor.

**Live site:** [untgrades.app](https://untgrades.app)
**Terminal edition:** [terminal.untgrades.app](https://terminal.untgrades.app)

## Terminal edition

This version restyles the whole app as a terminal: a black screen, monospace type, and a `❯` prompt instead of a search box.

- **Home** is just the title and the prompt. Results type themselves out in two columns at once (instructors on the left, courses on the right), so neither kind of result waits behind the other. Use ↑↓ to move, ←→ to switch columns, and Enter to open.
- **Every other page** has a one-line status bar (`unt-grades │ ❯ search │ compare │ saved[n] │ ko-fi`). Press `/` anywhere to jump into its search.
- **Grade charts** are text bars (`A  ████████  249  28.9%`) in the grade colors instead of chart-library graphs.
- **Controls** are terminal-style: `[x] fall 2025` semester toggles, `[share] [save] [compare]` buttons, and `── section ──` headings.
- **Motion** respects the system's reduced-motion setting, which turns off the typing, blinking and bar animations.

## What the app uses today

The public website reads from **encrypted static data stored with the deployed site**, not live Postgres queries.

- Course and instructor data is generated from CSV exports during the data-prep workflow.
- The generated files live under `unt-grade-distribution/public/encrypted/`.
- The browser downloads `manifest.json` and only the encrypted blob needed for the selected course or instructor.
- Client-side WebCrypto decrypts the blob with `NEXT_PUBLIC_DATA_KEY`.
- Prisma/Postgres still exists for import, validation, migrations, and backend/API compatibility work, but it is not the primary user-facing read path.

## Technical implementation

### Frontend

- React 19.2.3
- Next.js 16.1.6 App Router
- TypeScript
- Tailwind CSS v4, JetBrains Mono via `next/font`
- Text-based (block-character) grade distribution charts; `recharts` is still listed in `package.json` but no longer used
- jsPDF + jspdf-autotable for PDF export
- Vercel Analytics + Vercel Speed Insights for real-user monitoring

### Data delivery

- Static encrypted blobs generated at build/data-prep time from CSV exports
- Manifest-driven search in the browser
- Client-side WebCrypto decryption for course and instructor pages
- CDN-backed reads through Vercel static assets
- No Prisma/Postgres runtime dependency for normal website browsing

### Backend and database

- Prisma 7.4.2 with PostgreSQL/Postgres remains in the repo for seeding, migrations, validation, and backend API routes.
- Backend API routes use explicit Prisma `select` clauses and indexes for faster query paths when those routes are used.
- `DATABASE_URL` should point at the pooled Postgres in production-like serverless environments.
- `DIRECT_URL` should point at the direct Postgres host for local development and bulk operations.

## Deploying the terminal edition

The terminal edition is a static export of the app, hosted on GitHub Pages at [terminal.untgrades.app](https://terminal.untgrades.app).

`npm run build:pages` (`unt-grade-distribution/scripts/build-pages.mjs`) builds with `STATIC_EXPORT=1`, which:

- pre-renders every course and instructor page into `unt-grade-distribution/out/`;
- turns off search logging, because a static host has no API routes;
- sets `src/app/api/` and `src/proxy.ts` aside during the build, then restores them.

`.github/workflows/pages.yml` runs this on every push to `main` and deploys the result. It needs the `NEXT_PUBLIC_DATA_KEY` repository secret. The normal `npm run build` is unaffected.

## Repository layout

```text
.
├── README.md
├── DOCUMENTATION.md
└── unt-grade-distribution/
    ├── README.md
    ├── DOCUMENTATION.md
    ├── ENCRYPT_README.md
    ├── PERF_VALIDATION_RUNBOOK.md
    ├── prisma/
    ├── public/encrypted/
    ├── src/
    └── tools/
```

The Next.js app lives in `unt-grade-distribution/`. Root-level docs provide repo-wide context; app-level docs provide implementation details.

## Development workflow

Keep the existing branch/PR/review model:

1. Start from an up-to-date `main`.
2. Create a separate branch for each change, for example `feat/...`, `fix/...`, `perf/...`, or `docs/...`.
3. Commit with a conventional message.
4. Push the branch and open a PR into `main`.
5. Wait for automated checks and review before merging.
6. Do not push directly to `main` unless the maintainers intentionally choose to bypass the normal review path.

## Useful commands

```bash
cd unt-grade-distribution
npm install
npm test
npx tsc --noEmit
DATABASE_URL="postgresql://user:***@host:5432/db" DIRECT_URL="postgresql://user:***@host:5432/db" npm run build
npm run build:pages   # static GitHub Pages build of the terminal edition
```

## Maintainers

- [Dylan Joseph](https://github.com/dyl-joseph)
- [Gautham Nair](https://github.com/GauthamRNair)

## Initial contributors

- [Sai Are](https://github.com/FrostNinja397)
- [Akhil Tumati](https://github.com/YouSoMoose)

## Planned features

- **SPOT Evaluations** — integrate Student Perceptions of Teaching data for instructors.
- **More historical coverage** — expand beyond the currently imported semesters as additional source exports become available.
- **Smarter client aggregates** — keep compare-page aggregation fast by precomputing or indexing more summary data in the encrypted manifest layer without reintroducing a live database dependency for public reads.
