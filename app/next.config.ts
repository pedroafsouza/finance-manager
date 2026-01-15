import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['canvas', 'pdf.js-extract', 'pdfjs-dist'],
};

export default nextConfig;
