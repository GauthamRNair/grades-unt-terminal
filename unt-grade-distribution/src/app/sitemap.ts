import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/deploy";
import { courseParams, instructorParams } from "@/lib/staticParams";
import { coursePath, instructorPath } from "@/lib/sitePaths";

// Written to /sitemap.xml at build time, so it works in the static export too.
export const dynamic = "force-static";

// Lists the same pages the static export pre-renders.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/terms/",
    ...courseParams().map(({ prefix, number }) => coursePath(prefix, number)),
    ...instructorParams().map(({ id }) => instructorPath(id)),
  ];
  return paths.map((path) => ({ url: new URL(path, SITE_URL).toString() }));
}
