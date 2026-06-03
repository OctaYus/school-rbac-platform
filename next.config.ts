import type { NextConfig } from "next";

import { SECURITY_HEADERS } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Argon2 is a native module; keep it external to the server bundle.
  serverExternalPackages: ["@node-rs/argon2"],
  async headers() {
    // Static security headers applied to all responses (defense in depth; CSP
    // with a per-request nonce is set in middleware.ts).
    return [
      {
        source: "/:path*",
        headers: Object.entries(SECURITY_HEADERS).map(([key, value]) => ({ key, value })),
      },
    ];
  },
};

export default nextConfig;
