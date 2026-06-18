/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep pdfjs-dist and pdf-parse as external to avoid bundling issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'pdfjs-dist', 'pdf-parse'];
    }
    return config;
  },
};

export default nextConfig;
