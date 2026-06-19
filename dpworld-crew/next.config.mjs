/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle the data files into every serverless function so readSheet can
  // find them at runtime on Vercel. Paths are built dynamically and would
  // otherwise not be traced, causing some API routes to 500 in the lambda.
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./data/**/*'],
    },
  },
  // Keep pdfjs-dist and pdf-parse as external to avoid bundling issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'pdfjs-dist', 'pdf-parse'];
    }
    return config;
  },
};

export default nextConfig;
