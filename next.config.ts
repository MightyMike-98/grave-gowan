import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // Google-Profilbilder (Avatar nach Google-Login)
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        // Supabase Storage (hochgeladene Memorial-Bilder)
        protocol: 'https',
        hostname: 'ypolhurdtkirvtcnqrkh.supabase.co',
      },
    ],
  },
};

export default nextConfig;
