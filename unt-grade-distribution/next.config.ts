import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a static site for GitHub Pages (see .github/workflows/pages.yml).
// NEXT_PUBLIC_BASE_PATH is the repo subpath Pages serves it from, e.g. "/grades-unt-terminal".
const isStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  ...(isStaticExport
    ? {
        output: "export",
        distDir: "out", // with output: "export", Next 16 writes the static site here
        typescript: { tsconfigPath: "tsconfig.pages.json" },
        basePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        async headers() {
          return [
            {
              source: "/encrypted/blobs/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
            {
              source: "/encrypted/manifest.json",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=0, must-revalidate",
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
