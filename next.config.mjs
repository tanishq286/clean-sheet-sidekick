/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only lint the Next.js application source, never the legacy Vite app in /src.
  eslint: {
    dirs: ["app", "components", "lib"],
  },
};

export default nextConfig;
