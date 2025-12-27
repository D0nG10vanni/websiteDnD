
/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");
const typography = require('@tailwindcss/typography');

module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  pplugins: [
    typography,
    require('tailwind-scrollbar'), // <--- Das hier muss neu dazu!
  ],
  
  theme: {
    extend: {
      typography: (theme) => ({
        mystical: {
          css: {
            // Pergament-ähnliche Farbpalette mit warmen, gedämpften Tönen
            '--tw-prose-body': theme('colors.amber[50]'),
            '--tw-prose-headings': theme('colors.yellow[600]'),
            '--tw-prose-links': theme('colors.orange[600]'),
            '--tw-prose-bold': theme('colors.amber[200]'),
            '--tw-prose-counters': theme('colors.amber[600]'),
            '--tw-prose-bullets': theme('colors.amber[700]'),
            '--tw-prose-quotes': theme('colors.orange[700]'),
            '--tw-prose-quote-borders': theme('colors.amber[800]'),
            '--tw-prose-code': theme('colors.yellow[700]'),
            '--tw-prose-pre-bg': theme('colors.amber[950]/30'),
            '--tw-prose-th-borders': theme('colors.amber[800]'),
            '--tw-prose-td-borders': theme('colors.amber[700]'),
            
            // Erhöhte Zeilenhöhe für bessere Lesbarkeit alter Texte
            lineHeight: '1.9',
            fontSize: '1.05rem',
            
            // Mystische Schriftarten-Familie
            fontFamily: '"Cinzel", "Cormorant Garamond", "EB Garamond", Georgia, serif',
            
            // Überschriften-Styling für antikes Aussehen
            h1: {
              fontFamily: '"Cinzel Decorative", "Cinzel", serif',
              fontWeight: '600',
              fontSize: '2.25rem',
              color: theme('colors.yellow[600]'),
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              marginBottom: '1.5rem',
              borderBottom: `2px solid ${theme('colors.amber[800]')}`,
              paddingBottom: '0.5rem',
            },
            
            h2: {
              fontFamily: '"Cinzel", serif',
              fontWeight: '500',
              fontSize: '1.75rem',
              color: theme('colors.amber[300]'),
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            },
            
            h3: {
              fontFamily: '"Cinzel", serif',
              fontWeight: '500',
              fontSize: '1.375rem',
              color: theme('colors.amber[400]'),
            },
            
            // Initialbuchstaben-Effekt
            'p:first-of-type::first-letter': {
              float: 'left',
              fontSize: '4rem',
              lineHeight: '3rem',
              paddingRight: '0.5rem',
              paddingTop: '0.25rem',
              fontFamily: '"Cinzel Decorative", serif',
              color: theme('colors.yellow[600]'),
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            },
            
            // Links mit mystischem Hover-Effekt
            a: {
              textDecoration: 'underline',
              textDecorationColor: theme('colors.amber[600]'),
              textUnderlineOffset: '3px',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: theme('colors.orange[400]'),
                textShadow: '0 0 8px rgba(251, 146, 60, 0.4)',
                textDecorationColor: theme('colors.orange[400]'),
              },
            },
            
            // Blockquotes als mystische Zitate
            blockquote: {
              borderLeft: `4px solid ${theme('colors.amber[800]')}`,
              backgroundColor: theme('colors.amber[950]/20'),
              padding: '1rem 1.5rem',
              fontStyle: 'italic',
              position: 'relative',
              '&::before': {
                content: '"„"',
                fontSize: '3rem',
                position: 'absolute',
                left: '0.5rem',
                top: '-0.5rem',
                color: theme('colors.amber[800]'),
                fontFamily: '"Cinzel Decorative", serif',
              },
            },
            
            // Code-Blöcke als antike Schrifttafeln
            code: {
              backgroundColor: theme('colors.amber[900]/30'),
              padding: '3px 6px',
              borderRadius: '0.375rem',
              fontSize: '0.9em',
              border: `1px solid ${theme('colors.amber[800]')}`,
              fontFamily: '"Fira Code", "Courier New", monospace',
            },
            
            pre: {
              backgroundColor: theme('colors.amber[950]/40'),
              border: `2px solid ${theme('colors.amber[800]')}`,
              borderRadius: '0.5rem',
              padding: '1.5rem',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
            },
            
            // Listen mit antiken Aufzählungszeichen
            ul: {
              '> li': {
                '&::marker': {
                  color: theme('colors.amber[700]'),
                },
              },
            },
            
            ol: {
              '> li': {
                '&::marker': {
                  color: theme('colors.amber[700]'),
                  fontWeight: 'bold',
                },
              },
            },
            
            // Tabellen als pergamentartige Schrifttafeln
            table: {
              backgroundColor: theme('colors.amber[950]/10'),
              borderRadius: '0.5rem',
              overflow: 'hidden',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            },
            
            th: {
              backgroundColor: theme('colors.amber[900]/30'),
              fontFamily: '"Cinzel", serif',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            },
            
            // Horizontale Linien als dekorative Elemente
            hr: {
              border: 'none',
              height: '2px',
              background: `linear-gradient(to right, transparent, ${theme('colors.amber[800]')}, transparent)`,
              margin: '2rem 0',
              position: 'relative',
              '&::after': {
                content: '"❦"',
                position: 'absolute',
                left: '50%',
                top: '-0.75rem',
                transform: 'translateX(-50%)',
                backgroundColor: theme('colors.amber[950]'),
                color: theme('colors.amber[600]'),
                padding: '0 1rem',
                fontSize: '1.5rem',
              },
            },
          },
        },
        invert: {
          css: {
            color: theme("colors.gray.200"),
            a: {
              color: theme("colors.blue.400"),
              textDecoration: "underline",
              "&:hover": {
                color: theme("colors.blue.300"),
                textDecoration: "underline",
              },
            },
            h1: { color: theme("colors.white") },
            h2: { color: theme("colors.white") },
            h3: { color: theme("colors.white") },
            strong: { color: theme("colors.white") },
            code: {
              color: theme("colors.pink.400"),
              backgroundColor: theme("colors.gray.900"),
              padding: "0.2em 0.4em",
              borderRadius: "0.25rem",
            },
            "pre code": {
              display: "block",
              padding: theme("spacing.4"),
              backgroundColor: theme("colors.gray.900"),
              borderRadius: theme("borderRadius.lg"),
            },
            blockquote: {
              color: theme("colors.gray.300"),
              borderLeftColor: theme("colors.blue.600"),
              fontStyle: "italic",
            },
            "ul > li::marker": { color: theme("colors.blue.400") },
            hr: { borderColor: theme("colors.gray.700") },
          },
        },
      }),
    },
  },
};