/**
 * Canonical page paths. They end in "/" because the static export is built
 * with `trailingSlash: true`, so these match the URLs GitHub Pages serves.
 */

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function coursePath(prefix: string, number: string) {
  return `/course/${encodeURIComponent(safeDecode(prefix))}/${encodeURIComponent(safeDecode(number))}/`;
}

/** `id` is the "Last,First" slug, raw or already URL-encoded. */
export function instructorPath(id: string) {
  return `/instructor/${encodeURIComponent(safeDecode(id))}/`;
}
