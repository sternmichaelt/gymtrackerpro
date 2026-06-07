import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

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
  turbopack: {},
};

export default withSerwist(nextConfig);
