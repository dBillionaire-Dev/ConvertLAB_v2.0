// Identity of this deployment. NEXT_PUBLIC_BUILD_ID is set at build time (see next.config.mjs) from the
// hosting provider's deployment id, so it is different for every deploy and identical for every visitor of
// that deploy. An empty value (local builds, hosts that do not expose one) turns automatic updating off.
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? ""

// Same value the analytics code reports as appVersion.
export const APP_VERSION = "2.0.0"
