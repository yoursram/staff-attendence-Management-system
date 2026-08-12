/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin requests from the production domain during dev
  allowedDevOrigins: ['staff-attendance.vjstartup.com'],

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8011/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;

