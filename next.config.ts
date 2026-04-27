import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // @react-pdf/renderer needs canvas to be aliased away in browser bundles
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};

export default nextConfig;
