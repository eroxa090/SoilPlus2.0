/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Prevent MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Disable legacy XSS filter (modern browsers ignore; set for old ones)
  { key: "X-XSS-Protection", value: "0" },
  // Cross-origin controls
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Feature policy — deny dangerous features by default; allow geolocation and camera
  // since our /weather and /diagnose pages need them.
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(), geolocation=(self), payment=(), usb=()",
  },
  // HSTS — only meaningful on HTTPS, but harmless otherwise.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
