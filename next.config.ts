/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;