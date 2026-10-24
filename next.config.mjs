/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript 6 still exposes the compiler API, which avoids an extra CLI
  // subprocess and provides faster, richer build-time diagnostics.
  experimental: {
    useTypeScriptCli: false,
  },
};

export default nextConfig;
