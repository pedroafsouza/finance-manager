import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['canvas', 'pdf.js-extract', 'pdfjs-dist'],
};

export default nextConfig;
