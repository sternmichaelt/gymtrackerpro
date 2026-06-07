import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

function normalizeSupabaseUrl(url: string) {
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

const supabaseUrl = normalizeSupabaseUrl(
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_DATABASE_URL ??
    ""
);

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  "";

const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.npm_package_version ??
  Date.now().toString();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false,
  additionalPrecacheEntries: [
    { url: "/offline", revision },
    { url: "/overview", revision },
  ],
});

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  },
  turbopack: {},
};

export default withSerwist(nextConfig);
