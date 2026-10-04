import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/api/chat": ["./data/index.json"] },
};

export default nextConfig;