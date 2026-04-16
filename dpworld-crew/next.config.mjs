/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure dependencies are available in serverless environment
  serverComponentsExternalPackages: ['pdfjs-dist', 'exceljs'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'pdfjs-dist'];
    }
    return config;
  },
};

export default nextConfig;
