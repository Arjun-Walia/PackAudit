import type { NextConfig } from "next";

const api = process.env.API_UPSTREAM ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/v1/:path*", destination: `${api}/v1/:path*` }];
  },
};

export default nextConfig;
