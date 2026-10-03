// Builds the static GitHub Pages version into ./out.
//
// Pages can only serve files, so server-only code is moved aside for the build
// (and always restored), search logging is switched off, and every
// course/instructor page is pre-rendered.
//
// Usage: NEXT_PUBLIC_BASE_PATH=/repo-name node scripts/build-pages.mjs
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const stash = path.join(root, ".pages-build-stash");
// API routes and the proxy can't run on a static host.
const setAside = ["src/app/api", "src/proxy.ts"];

rmSync(stash, { recursive: true, force: true });
mkdirSync(stash);
const moved = [];
let status = 1;
try {
  for (const rel of setAside) {
    const from = path.join(root, rel);
    if (!existsSync(from)) continue;
    const to = path.join(stash, rel.replaceAll("/", "__"));
    renameSync(from, to);
    moved.push([to, from]);
  }

  const result = spawnSync("npx", ["next", "build", "--webpack"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      STATIC_EXPORT: "1",
      NEXT_PUBLIC_DISABLE_SEARCH_LOG: "1",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });
  status = result.status ?? 1;

  if (status === 0) {
    // Stop Pages' Jekyll step from hiding the _next/ directory.
    writeFileSync(path.join(root, "out", ".nojekyll"), "");
  }
} finally {
  // Restore each item independently so one failure can't strand the others.
  const failed = [];
  for (const [from, to] of moved.reverse()) {
    try {
      renameSync(from, to);
    } catch (error) {
      failed.push(`${path.relative(root, from)} -> ${path.relative(root, to)}: ${error.message}`);
    }
  }
  if (failed.length) {
    const where = path.relative(root, stash);
    console.error(`\nCould not restore set-aside files; they are still in ${where}:\n  ${failed.join("\n  ")}`);
    process.exit(1);
  }
  rmSync(stash, { recursive: true, force: true });
}
process.exit(status);
