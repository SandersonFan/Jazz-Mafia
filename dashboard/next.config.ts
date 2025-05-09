import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: 'export',
  // If deploying to a subpath, set basePath: '/your-repo-name',
  basePath: '/Jazz-Mafia',
};

export default nextConfig;
