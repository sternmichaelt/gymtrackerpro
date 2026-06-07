import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

function normalizeSupabaseUrl(url: string) {
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function deriveUrlFromPostgres(connectionString: string) {
  const poolerMatch = connectionString.match(/postgres\.([a-z0-9]+)@/i);
  if (poolerMatch) {
    return `https://${poolerMatch[1]}.supabase.co`;
  }

  const directMatch = connectionString.match(/db\.([a-z0-9]+)\.supabase\.co/i);
  if (directMatch) {
    return `https://${directMatch[1]}.supabase.co`;
  }

  return "";
}

function resolveSupabaseUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    process.env.SUPABASE_DATABASE_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (candidate.startsWith("https://")) {
      return normalizeSupabaseUrl(candidate);
    }

    if (
      candidate.startsWith("postgresql://") ||
      candidate.startsWith("postgres://")
    ) {
      const derived = deriveUrlFromPostgres(candidate);
      if (derived) return derived;
    }
  }

  return "";
}

const supabaseUrl = resolveSupabaseUrl();
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

if (process.env.NODE_ENV === "production" && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Netlify, or connect the Supabase integration."
  );
}

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
