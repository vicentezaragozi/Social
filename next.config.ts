import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const supabaseHostname = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return undefined;
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
})();

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    ...(supabaseHostname
      ? {
          remotePatterns: [
            {
              protocol: "https",
              hostname: supabaseHostname,
            },
          ],
        }
      : {}),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Ensure middleware is properly traced for Vercel
  outputFileTracingIncludes: {
    '/**': ['./middleware.ts'],
  },
  async rewrites() {
    return [
      {
        source: "/auth/callback",
        destination: "/en/auth/callback",
      },
    ];
  },
};

export default withNextIntl(nextConfig);
