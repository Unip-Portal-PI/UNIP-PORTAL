/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/auth/cadastro',
        permanent: true, // true para SEO (301), false para temporário (307)
      },
    ]
  }
}

export default nextConfig;
