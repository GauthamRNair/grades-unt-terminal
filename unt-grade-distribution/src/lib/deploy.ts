/**
 * Build-time deployment settings. Both default to the normal site; the
 * GitHub Pages build sets them (see .github/workflows/pages.yml).
 */

/** URL prefix when the site is served from a subpath, e.g. "/grades-unt-terminal". */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Static hosts have no API routes, so search logging can be switched off. */
export const SEARCH_LOG_ENABLED = process.env.NEXT_PUBLIC_DISABLE_SEARCH_LOG !== "1";
