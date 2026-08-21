/**
 * Static-demo build: `npm run build:static` → a fully static site in `out/`.
 *
 * Next.js `output: "export"` refuses to build dynamic route handlers and
 * cookie-reading pages, and a static host couldn't serve them anyway — so the
 * server-only segments (/api, /admin) are hidden for the duration of the
 * build by renaming them to underscore-prefixed folders, which the App Router
 * ignores. The rename is restored no matter how the build exits. Client code
 * covers the difference: vehicle lookup runs in the browser, and the booking
 * and estimate forms switch to demo-mode notices (see src/lib/static-demo.ts).
 */

import { spawnSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SERVER_ONLY = ["api", "admin"].map((name) => ({
  real: path.join(root, "src", "app", name),
  hidden: path.join(root, "src", "app", `_${name}`),
}));

for (const { real, hidden } of SERVER_ONLY) {
  if (existsSync(hidden)) {
    console.error(`Refusing to build: ${hidden} already exists (crashed build?). ` +
      `Restore it to ${real} first.`);
    process.exit(1);
  }
}

const hiddenNow = [];
let status = 1;
try {
  for (const seg of SERVER_ONLY) {
    if (existsSync(seg.real)) {
      renameSync(seg.real, seg.hidden);
      hiddenNow.push(seg);
    }
  }

  const result = spawnSync("npx", ["next", "build"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, STATIC_EXPORT: "1" },
  });
  status = result.status ?? 1;
} finally {
  for (const seg of hiddenNow) {
    renameSync(seg.hidden, seg.real);
  }
}

if (status === 0) {
  console.log("\nStatic site written to out/ — publish that directory.");
}
process.exit(status);
