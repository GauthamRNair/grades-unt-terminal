# grades-unt

## Choosing classes is a gamble. It shouldn't be.

You do not always know what you are signing up for until it is too late. `grades-unt` makes UNT grade distributions easier to browse by course and instructor.

**Live site:** [untgrades.app](https://untgrades.app)
**Terminal edition:** [terminal.untgrades.app](https://terminal.untgrades.app)

## Terminal edition

This branch restyles the whole app as a terminal: a black screen, monospace type, and a `❯` prompt instead of a search box.

- **Home** is just the title and the prompt. Results type themselves out in two columns at once (instructors on the left, courses on the right), so neither kind of result waits behind the other. Use ↑↓ to move, ←→ to switch columns, and Enter to open.
- **Every other page** has a one-line status bar (`unt-grades │ ❯ search │ compare │ saved[n] │ ko-fi`). Press `/` anywhere to jump into its search.
- **Grade charts** are text bars (`A  ████████  249  28.9%`) in the grade colors instead of chart-library graphs.
- **Controls** are terminal-style: `[x] fall 2025` semester toggles, `[share] [save] [compare]` buttons, and `── section ──` headings.
- **Motion** respects the system's reduced-motion setting, which turns off the typing, blinking and bar animations.

It is deployed as a static site on GitHub Pages; see [Deploying the terminal edition](#deploying-the-terminal-edition).

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

The terminal edition is served from GitHub Pages at **terminal.untgrades.app**. Pages only hosts files, so it uses a static export of the app instead of the normal server build.

### How the static build differs

`npm run build:pages` (see `unt-grade-distribution/scripts/build-pages.mjs`) builds with `STATIC_EXPORT=1`, which:

- pre-renders every course and instructor page (about 6,100 pages, roughly 160 MB including the encrypted data);
- turns off search logging, because there are no API routes on a static host;
- sets `src/app/api/` and `src/proxy.ts` aside during the build, then always restores them;
- writes the site to `unt-grade-distribution/out/`.

One instructor whose name contains quote marks can't be written as a file name, so that single page is skipped on Pages. The normal build (`npm run build`) and the main deployment are unaffected by any of this.

### Deploy workflow

`.github/workflows/pages.yml` builds and deploys on every push to `main` in the preview repo, [GauthamRNair/grades-unt-terminal](https://github.com/GauthamRNair/grades-unt-terminal). It only runs in that repo, so it does nothing if this branch is merged elsewhere.

It needs one repository secret, `NEXT_PUBLIC_DATA_KEY`, set to the same value used to encrypt the data. That key ends up in the browser bundle either way, as it does on the main site.

### Custom domain setup (one time)

1. **DNS:** add a `CNAME` record for `terminal` pointing to `gauthamrnair.github.io`.
2. **Verify the domain (recommended):** in GitHub, go to *Settings → Pages → Add a domain* on your account and verify `untgrades.app`. This stops anyone else's Pages site from claiming a subdomain.
3. **Point the repo at it:** in the preview repo, go to *Settings → Pages → Custom domain*, enter `terminal.untgrades.app`, and save. Or run:
   ```bash
   gh api -X PUT repos/GauthamRNair/grades-unt-terminal/pages -f cname=terminal.untgrades.app
   ```
4. **Turn on *Enforce HTTPS*** once GitHub has issued the certificate. That can take a few minutes up to about an hour after DNS resolves.
5. **Redeploy** by re-running the workflow or pushing a commit. The site's base path comes from the Pages settings (`actions/configure-pages`), so the build has to run again after the domain is set. Before that, links point at `/grades-unt-terminal/`; afterwards they're served from the domain root.

After that, `gauthamrnair.github.io/grades-unt-terminal/` redirects to the custom domain.

### Building it locally

```bash
cd unt-grade-distribution
npm run build:pages
```

When the domain is set, leave `NEXT_PUBLIC_BASE_PATH` unset (the site is served from the root). To test the `github.io` subpath instead, set `NEXT_PUBLIC_BASE_PATH=/grades-unt-terminal` first; on Windows, do that in PowerShell, because Git Bash rewrites paths that start with `/`.

Serve `out/` with any static file server to check it. On Windows, a few instructor folders whose names end in a period won't open locally. GitHub's Linux build handles them fine.

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
