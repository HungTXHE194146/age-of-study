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

export default nextConfig;
