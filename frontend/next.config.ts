import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: 'app/auth/cadastro/page.tsx',
        permanent: true, // true para SEO (301), false para temporário (307)
      },
    ]
  }
}

export default nextConfig;
