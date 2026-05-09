import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // node-ical pulls in big-integer / BigInt code that Next's webpack bundle
  // serializer mangles. Keep it as a regular Node module on the server.
  serverExternalPackages: ["node-ical"],
};

export default nextConfig;
