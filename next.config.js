/** @type {import('next').NextConfig} */

// `npm run build:static` (scripts/build-static.mjs) sets STATIC_EXPORT=1 to
// produce a fully static build in `out/` for static hosts (Render Static
// Site, GitHub Pages, …). Server-only routes (/api, /admin) are excluded by
// the build script; client code reads NEXT_PUBLIC_STATIC_DEMO to swap
// server calls for in-browser math and demo-mode notices.
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig = {
  reactStrictMode: true,
  ...(staticExport
    ? {
        output: "export",
        // Every route becomes folder/index.html, which serves cleanly from
        // any static file host without rewrite rules.
        trailingSlash: true,
        images: { unoptimized: true },
        env: { NEXT_PUBLIC_STATIC_DEMO: "1" },
      }
    : {}),
};

module.exports = nextConfig;
