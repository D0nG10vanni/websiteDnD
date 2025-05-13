import createMDX from '@next/mdx'
/** @type {import('next').NextConfig} */

const nextConfig = {
  // markdown-Datein mit MDX-Parser: https://nextjs.org/docs/app/guides/mdx
  
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],

  // Konfigurieren der API-Routen für experimentelle Funktionen
  experimental: {
    serverComponentsExternalPackages: ['fs'],
  },
  // Stellen Sie sicher, dass Server-Komponenten richtig funktionieren
  reactStrictMode: true,
  swcMinify: true,
  // Erlauben Sie die Verwendung von fs-Modul in API-Routen
  webpack: (config: import('webpack').Configuration, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Client-Side: Vermeiden von fs-Modul auf der Client-Seite
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

const withMDX = require('@next/mdx')({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

/** @type {import('next').NextConfig} */
module.exports = withMDX({
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
})
 
// Merge MDX config with Next.js config
export default withMDX(nextConfig)

module.exports = nextConfig;