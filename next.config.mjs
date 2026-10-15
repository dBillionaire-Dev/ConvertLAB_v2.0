const landingUrl = (process.env.NEXT_PUBLIC_LANDING_URL ?? "").trim().replace(/\/+$/, "")
let landingOrigins = ""
try {
  const u = new URL(landingUrl)
  landingOrigins = `${u.origin} ${u.protocol}//www.${u.host}`
} catch {}
// With a separate landing domain, only that domain (and the app itself) may embed the app in its live demo.
const FRAME_HEADERS = landingOrigins
  ? [{ key: "Content-Security-Policy", value: `frame-ancestors 'self' ${landingOrigins}` }]
  : [{ key: "X-Frame-Options", value: "SAMEORIGIN" }]

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  poweredByHeader: false,
  env: {
    // Identifies this deployment, so an open copy of the app can tell when a newer one is live.
    // Empty (local builds, hosts that do not set one) turns automatic updating off, never on by mistake.
    NEXT_PUBLIC_BUILD_ID: (process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_BUILD_ID || "").slice(0, 60),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          ...FRAME_HEADERS,
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          ...(process.env.NODE_ENV === "production"
            ? [
                { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
                { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
              ]
            : []),
        ],
      },
    ]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
