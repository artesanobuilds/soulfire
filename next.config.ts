import type { NextConfig } from "next";
const config: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  devIndicators: false,
  webpack(config) {
    config.watchOptions = {
      ...config.watchOptions,
      poll: 1000,
      ignored: ["**/node_modules/**", "**/.git/**", "**/docs/**"],
    };
    return config;
  },
};
export default config;
