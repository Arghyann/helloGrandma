/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Emit seance/index.html so the static host can serve /seance/ directly.
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
