import { readFileSync } from "node:fs";
import path from "node:path";
import { listInstructorSlugs, type ManifestEntry } from "./encryptedData";

/** True for the static-export (GitHub Pages) build. */
export const IS_STATIC_EXPORT = process.env.STATIC_EXPORT === "1";

function readManifest(): ManifestEntry[] {
  const file = path.join(process.cwd(), "public", "encrypted", "manifest.json");
  return JSON.parse(readFileSync(file, "utf8"));
}

export function courseParams() {
  const seen = new Set<string>();
  return readManifest()
    .map(({ preview }) => ({ prefix: preview.prefix, number: preview.number }))
    .filter(({ prefix, number }) => {
      const key = `${prefix}/${number}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

// Characters that can't appear in an exported file name on every OS. Only one
// instructor (a quoted nickname) has any; that page is skipped in the static build.
const UNSAFE_FILE_CHARS = /[<>:"|?*\\/]/;

export function instructorParams() {
  return listInstructorSlugs(readManifest())
    .filter((id) => !UNSAFE_FILE_CHARS.test(id))
    .map((id) => ({ id }));
}
