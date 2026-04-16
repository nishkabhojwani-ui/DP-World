/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep pdfjs-dist as external to avoid bundling issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'pdfjs-dist'];
    }
    return config;
  },
};

export default nextConfig;
