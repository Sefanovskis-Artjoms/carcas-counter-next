import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    prependData: `@use "@/styles/variables" as *;`,
    silenceDeprecations: ["import"],
  },
  reactCompiler: true,
};

export default nextConfig;
