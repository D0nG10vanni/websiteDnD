import type { Config } from 'tailwindcss';

interface ExtendedConfig extends Config {
  daisyui?: {
    themes?: string[];
    darkTheme?: string;
  };
}

const config: ExtendedConfig = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark', 'cupcake'],
    darkTheme: 'dark',
  },
};

export default config;