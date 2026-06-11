import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  sassOptions: {
    prependData: `@use "@/styles/variables" as *;`,
    silenceDeprecations: ["import"],
  },
  reactCompiler: true,
};

export default nextConfig;
