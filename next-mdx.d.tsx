declare module '@next/mdx/server' {
  export function compileMDX(options: { source: string }): Promise<{ frontmatter: Record<string, any>; content: string }>;
}