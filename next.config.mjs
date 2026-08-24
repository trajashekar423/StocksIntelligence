/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://dev-api.ranevra.com/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;

