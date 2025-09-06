/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*.cloudworkstations.dev", "*.firebaseapp.com", "*.web.app", "*.netlify.app"],
      bodySizeLimit: '2mb',
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // This will ignore the genkit api route during the build process,
    // which is necessary for the static export to succeed.
    config.plugins.push(
      new (require('webpack').IgnorePlugin)({
        resourceRegExp: /src\/app\/api\/genkit/,
      })
    );

    // Suppress the 'require.extensions' warning from handlebars
    config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        /require\.extensions/,
    ];
    
    return config;
  },
};

module.exports = nextConfig;
