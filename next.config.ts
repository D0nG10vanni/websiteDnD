import createMDX from '@next/mdx'

const nextConfig = {
  // markdown-Datein mit MDX-Parser: https://nextjs.org/docs/app/guides/mdx
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],

  // Stellen Sie sicher, dass Server-Komponenten richtig funktionieren
  reactStrictMode: false,
  
};

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

// Merge MDX config with Next.js config
export default withMDX(nextConfig);