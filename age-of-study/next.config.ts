import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (if you're using it for avatars)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // Common avatar/image services
      {
        protocol: 'https',
        hostname: 'i.guim.co.uk', // Guardian images
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google user content
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // GitHub avatars
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com', // IPFS via Cloudflare
      },
      // Add more specific domains as needed
    ],
  },
};

// Set turbopack root explicitly to current directory to avoid parent workspace inference
// In Next.js 15+, turbopack is placed at the root of the configuration object
nextConfig.turbopack = {
  ...nextConfig.turbopack || {},
  root: process.cwd(),
};

export default nextConfig;
