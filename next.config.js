/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  sassOptions: {
    prependData: `@use "@/styles/variables" as *;`,
    silenceDeprecations: ["import"],
  },
  reactCompiler: true,
};

module.exports = nextConfig;
