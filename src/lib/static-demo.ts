/**
 * True in static-demo builds (`npm run build:static`), where there is no
 * server: vehicle lookup runs entirely in the browser, and booking/estimate
 * submissions show a demo notice instead of persisting. The flag is inlined
 * at build time (next.config.js sets NEXT_PUBLIC_STATIC_DEMO under
 * STATIC_EXPORT=1), so regular `next build` deployments are unaffected.
 */
export const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";
